# E2E Scenario Coverage

This project measures E2E coverage as **scenario coverage** — *which real user
journeys the Playwright suite exercises* — **not** lines of application code
executed. There is no app instrumentation and no coverage build; the metric is
pure bookkeeping over test tags, so it runs on the default `npm run test:e2e`.

## Mechanism

- **Catalog** — `e2e/scenarios.ts` holds a typed array `SCENARIOS` of
  `{ id, title, area, priority }`, plus the `scn(id)` tag helper. `id` is a
  stable, dotted join key (e.g. `log.dual-cut.success`); `priority` is
  `must` | `should` | `may`.
- **Tags** — every test declares the scenario(s) it covers via the object-options
  form: `test(title, { tag: scn("<id>") }, fn)`. A test MAY carry several tags
  (`tag: [scn("a"), scn("b")]`). `scn`'s argument is typed to the catalog's id
  union, so a typo or stale id fails `npm run typecheck`.
- **Reporter** — `e2e/reporters/scenario-coverage.ts` (appended to `reporter` in
  `playwright.config.ts`) tallies the `@scn:` tags of **passing** tests, prints
  an overall + per-priority `covered/total` table and a grouped list of
  **uncovered** scenarios, and writes `e2e/.scenario-coverage/summary.json`
  (gitignored). It fails the run on any tag whose id is not in the catalog.
- **Gate** — `scripts/check-scenario-coverage.mjs` reads that artifact.
  `npm run coverage:scenarios` runs the suite and then this check, which
  enforces the phased gate.

## Rules

- MUST tag every e2e test with `@scn:<id>` from `e2e/scenarios.ts` via `scn(...)`.
  An untagged test contributes nothing to coverage; a stale/typo tag fails the
  run (typecheck, and the reporter as a runtime backstop).
- MUST add a new entry to `SCENARIOS` when a change introduces a new user-facing
  journey, and tag the test that asserts its outcome. Tag the **asserting** test,
  not every test that merely passes through the journey — executed ≠ asserted.
- MUST NOT rename a scenario `id` without updating every tag that references it in
  the same commit — the id is the contract between catalog and tests.
- SHOULD keep genuinely-untested journeys in the catalog (with the right
  priority) so the report shows real gaps. Writing tests for surfaced gaps is a
  follow-up, not part of wiring or reading the metric.
- Only a **passing** test marks its scenario covered; a failed/skipped test
  correctly leaves it uncovered.

## Phased gate

- `must` scenarios are hard-gated at **100%**; `should`/`may` are report-only.
- The gate phase is controlled by `SCENARIO_GATE` (`must` = enforce,
  the default; anything else = report-only) — flipping it is a one-liner.
- `npm run test:e2e` stays fast and report-only for the `must` gate (it only
  fails on unknown tags). `npm run coverage:scenarios` enforces `must` = 100%.

## Running and reading it

```bash
# default run: prints coverage, fails only on unknown tags
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run test:e2e

# enforce the must gate (runs the suite, then the check)
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run coverage:scenarios
```

Read the printed table for the overall/per-priority numbers and the grouped
"Uncovered scenarios" list. A new `must` journey is a blocker until a passing
test covers it.
