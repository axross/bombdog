# E2E Scenario Coverage

This project measures E2E coverage as **scenario coverage** — *which real user
journeys the Playwright suite exercises* — **not** lines of application code
executed. There is no app instrumentation and no coverage build; the metric is
pure bookkeeping over test tags, so it runs on the default `npm run test:e2e`.

## Mechanism

- **Catalog** — `e2e/scenarios.ts` holds a typed array `SCENARIOS` of
  `{ id, title, area, priority }`. `id` is a stable, dotted join key (e.g.
  `log.dual-cut.success`); `priority` is `must` | `should` | `may`; `area` is
  one of the `AREAS`.
- **Tags** — tests declare coverage with ordinary, greppable Playwright tags via
  the object-options form `test(title, { tag: [...] }, fn)`:
  - `@scenario:<id>` — **the join key**: which catalog journey the test covers.
    A test MAY carry several. Build it with `scenario("<id>")`, whose argument is
    typed to the catalog's id union, so a typo/stale id fails `npm run typecheck`.
  - `@area:<area>` and `@priority:<priority>` — **facet tags** (via `area(...)`
    and `priority(...)`), for filtering runs and grouping the report.
  - `@smoke` (`SMOKE_TAG`) — an optional **selection facet** marking the fast
    pre-gate subset. Not tied to a scenario.
- **Reporter** — `e2e/reporters/scenario-coverage.ts` (appended to `reporter` in
  `playwright.config.ts`) tallies the `@scenario:` tags of **passing** tests,
  prints an overall + per-priority + per-area `covered/total` table and a grouped
  list of **uncovered** scenarios, and writes `e2e/.scenario-coverage/summary.json`
  (gitignored).
- **Gate** — `scripts/check-scenario-coverage.mjs` reads that artifact.
  `npm run coverage:scenarios` runs the suite and then this check.

## Rules

- MUST tag every e2e test with a `@scenario:<id>` from `e2e/scenarios.ts` via
  `scenario(...)`, plus the matching `area(...)` and `priority(...)` facet tags
  for each scenario it covers. An untagged test contributes nothing to coverage.
- MUST keep the `@area:`/`@priority:` facet tags consistent with the catalog: the
  reporter fails the run if a test is **missing** a facet its covered scenario
  implies, or carries a **stray** facet no covered scenario implies. This keeps
  `--grep @priority:must` / `--grep @area:<area>` trustworthy.
- MUST add a new entry to `SCENARIOS` when a change introduces a new user-facing
  journey, and tag the test that asserts its outcome. Tag the **asserting** test,
  not every test that merely passes through the journey — executed ≠ asserted.
- MUST NOT rename a scenario `id` without updating every `@scenario:` tag that
  references it in the same commit — the id is the contract between catalog and
  tests.
- SHOULD keep genuinely-untested journeys in the catalog (with the right
  priority) so the report shows real gaps. Writing tests for surfaced gaps is a
  follow-up, not part of wiring or reading the metric.
- SHOULD add `@smoke` (`SMOKE_TAG`) to the shallow boot/core-loop gates so
  `--grep @smoke` selects the fast subset.
- Only a **passing** test marks its scenario covered; a failed/skipped test
  correctly leaves it uncovered.

## Phased gate

- `must` scenarios are hard-gated at **100%**; `should`/`may` are report-only.
- The gate phase is controlled by `SCENARIO_GATE` (`must` = enforce,
  the default; anything else = report-only) — flipping it is a one-liner.
- Structural tag errors (unknown `@scenario:` id, or a facet mismatch) always
  fail — in every phase, in both the reporter and the check script.
- `npm run test:e2e` stays fast and report-only for the `must` threshold (it only
  fails on structural tag errors). `npm run coverage:scenarios` enforces `must` = 100%.

## Running, reading, and filtering

```bash
# default run: prints coverage, fails only on structural tag errors
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run test:e2e

# enforce the must gate (runs the suite, then the check)
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run coverage:scenarios

# filter runs by facet tag
npm run test:e2e -- --grep @smoke              # fast pre-gate subset
npm run test:e2e -- --grep @priority:must      # only must-priority journeys
npm run test:e2e -- --grep @area:persistence   # only one area
```

Read the printed table for the overall/per-priority/per-area numbers and the
grouped "Uncovered scenarios" list. A new `must` journey is a blocker until a
passing test covers it.
