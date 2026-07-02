# 1. E2E scenario coverage over E2E line coverage

- Status: accepted
- Date: 2026-07-02

## Context

We wanted to measure how well the Playwright suite covers the app. The obvious
option — E2E *line* coverage (instrumenting the app, collecting `window.__coverage__`
during Playwright, merging with the unit report) — has real drawbacks for this app:

- **Noisy and gameable.** Executed ≠ asserted: a line runs when a test merely walks
  past it, so line coverage over-reports how well journeys are actually verified.
- **Slow and heavy.** It needs an instrumented build (`nyc` / `swc-plugin-coverage-instrument`
  / `v8-to-istanbul`, a `COVERAGE` dev build), which is fragile under Next.js +
  Turbopack and slows the default e2e run.
- **Can't express gaps.** Line coverage cannot say "the reset-cancel journey is
  untested" — it has no notion of an *intended* journey that nobody has tested yet.

The question that matters here is risk/traceability-based: **are the important things
a player does covered end-to-end?** That needs a denominator of intended journeys,
including untested ones.

## Decision

Measure **scenario coverage** at the E2E layer instead of line coverage:

- An authored, typed catalog of user journeys lives at `e2e/scenarios.ts`
  (`{ id, title, area, priority }`). The catalog deliberately includes
  currently-untested journeys so gaps are visible.
- Each Playwright test declares the scenario(s) it covers with type-safe
  `@scn:<id>` tags built from the catalog (a typo/stale id fails `typecheck` and
  the reporter).
- A dependency-free custom reporter (`e2e/reporters/scenario-coverage.ts`) tallies
  the tags of **passing** tests, prints overall + per-priority `covered/total` and
  the uncovered list, and writes `e2e/.scenario-coverage/summary.json`.
- A check script (`scripts/check-scenario-coverage.mjs`) enforces a **phased gate**:
  unknown tags always fail; `must` scenarios are hard-gated at 100%
  (`npm run coverage:scenarios`), while `should`/`may` stay report-only.

No application-code instrumentation is added. The Vitest unit coverage gate
(`test:coverage`, ~95%) is unchanged, and the existing `/* v8 ignore */` pragmas
and defensive composer guards stay as they are.

## Consequences

- **Pro:** The metric names real gaps, stays honest about asserted-vs-executed, adds
  near-zero cost to the default e2e run, and pins critical journeys (`must`) at 100%.
- **Pro:** No instrumented build, no Turbopack/SWC-plugin risk, no merged report.
- **Con:** The denominator is a human judgment call — an incomplete catalog inflates
  the percentage. Mitigated by reviewing the catalog in PRs, requiring new
  user-facing journeys to be added, and hard-gating only `must`.
- **Con:** A tagged-but-non-asserting test overstates coverage; mitigated by tagging
  the asserting test and reviewing tags in code review.
