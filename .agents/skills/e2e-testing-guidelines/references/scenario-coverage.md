# E2E Scenario Coverage

This project measures E2E coverage as **scenario coverage** — *which real user
journeys the Playwright suite exercises* — **not** lines of application code
executed. There is no app instrumentation and no coverage build; the metric is
pure bookkeeping over test tags, so it runs on the default `npm run test:e2e`.

## Why scenario coverage, not E2E line coverage

This was a deliberate choice over instrumenting the app and collecting E2E *line*
coverage. Line coverage was rejected because:

- **Noisy and gameable.** Executed ≠ asserted: a line runs when a test merely
  walks past it, so line coverage overstates how well journeys are *verified*.
- **Slow and heavy.** It needs an instrumented build (`nyc` /
  `swc-plugin-coverage-instrument` / `v8-to-istanbul`, a `COVERAGE` dev build),
  which is fragile under Next.js + Turbopack and slows the default e2e run.
- **Cannot express gaps.** Line coverage has no notion of an *intended* journey
  nobody has tested yet, so it cannot say "the reset-cancel journey is untested."
  A traceability catalog can — that visible-gap capability is the whole point.

Consequences of the chosen approach, and their mitigations:

- The metric names real gaps, stays honest about asserted-vs-executed, adds
  near-zero cost to the default run, and pins critical journeys (`must`) at 100%.
- No instrumented build means no Turbopack/SWC-plugin risk and no merged report.
- The denominator is a **human judgment call** — an incomplete catalog inflates
  the percentage. Mitigate by reviewing the catalog in PRs, requiring new
  user-facing journeys to be added, and hard-gating only `must`.
- A tagged-but-non-asserting test overstates coverage; mitigate by tagging the
  **asserting** test and reviewing tags in code review.

This work does **not** touch the Vitest unit coverage gate (`test:coverage`,
~95%), and the existing `/* v8 ignore */` pragmas and defensive composer guards
stay as they are — they cover browser-only behavior that unit line coverage
can't reach, which is orthogonal to this E2E metric.

## Mechanism

- **Catalog** — `e2e/scenarios.md` holds a markdown table with columns
  `ID | Title | Area | Priority` (one row per journey). There is **no scenario
  list in code** — the catalog is authored as human-reviewable markdown. `ID` is
  a stable, dotted join key (e.g. `log.dual-cut.success`); `Priority` is `must` |
  `should` | `may`. The reporter parses this table (column order is read from the
  header) and fails the run on a malformed catalog (bad header, duplicate id, or
  a priority outside must/should/may).
- **Tags** — tests declare coverage with **plain string** tags (no builder
  helpers) via the object-options form `test(title, { tag: [...] }, fn)`:
  - `@scenario:<id>` — **the join key**: which catalog journey the test covers.
    A test MAY carry several. A typo/stale id fails the run at the reporter (see
    below), not at compile time.
  - `@area:<area>` and `@priority:<priority>` — **facet tags** for filtering runs
    and grouping the report.
  - `@smoke` — an optional **selection facet** marking the fast pre-gate subset.
    Not tied to a scenario.
- **Reporter** — `e2e/reporters/scenario-coverage.ts` (appended to `reporter` in
  `playwright.config.ts`) tallies the `@scenario:` tags of **passing** tests,
  prints an overall + per-priority + per-area `covered/total` table and a grouped
  list of **uncovered** scenarios, and writes `e2e/.scenario-coverage/summary.json`
  (gitignored).
- **Gate** — `scripts/check-scenario-coverage.mjs` reads that artifact.
  `npm run coverage:scenarios` runs the suite and then this check.

## Rules

- MUST tag every e2e test with a plain-string `@scenario:<id>` from
  `e2e/scenarios.md`, plus the matching `@area:<area>` and `@priority:<priority>`
  facet tags for each scenario it covers. An untagged test contributes nothing to
  coverage. Tags are plain strings (Playwright requires them to start with `@`).
- MUST keep the `@area:`/`@priority:` facet tags consistent with the catalog: the
  reporter fails the run if a test is **missing** a facet its covered scenario
  implies, or carries a **stray** facet no covered scenario implies. This keeps
  `--grep @priority:must` / `--grep @area:<area>` trustworthy.
- MUST add a new row to the `e2e/scenarios.md` table when a change introduces a
  new user-facing journey, and tag the test that asserts its outcome. Tag the
  **asserting** test, not every test that merely passes through the journey —
  executed ≠ asserted.
- MUST NOT rename a scenario `id` without updating every `@scenario:` tag that
  references it in the same commit — the id is the contract between catalog and
  tests.
- SHOULD keep genuinely-untested journeys in the catalog (with the right
  priority) so the report shows real gaps. Writing tests for surfaced gaps is a
  follow-up, not part of wiring or reading the metric.
- SHOULD add `@smoke` to the shallow boot/core-loop gates so `--grep @smoke`
  selects the fast subset.
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
