# Plan & Requirements: E2E **Scenario Coverage** for `bombdog`

> **How to use this document:** Hand it to a fresh AI coding session with the instruction "do this."
> It is self-contained. Do not assume any memory of prior sessions. **Verify every assumption against
> the actual repo state before acting** (scripts, line numbers, file contents, and test counts drift).
>
> **This supersedes the earlier "Combined Unit + E2E Code Coverage" plan.** That plan measured *lines of
> application code executed during Playwright*. This one measures something different and deliberately
> chosen: **which real user scenarios the E2E suite exercises.** See §0.1 for why the switch, and §0.2 for
> what is explicitly *not* being built.

---

## 0. One-line objective

Measure and track **E2E scenario coverage** for `bombdog`: maintain an authored catalog of real user
journeys, tag each Playwright test with the scenario(s) it exercises, and report `covered / total`
(overall and per priority) plus a concrete list of **untested** scenarios. Start **report-only**, then
**hard-gate the "must-have" scenarios at 100%** once the catalog stabilizes. **No application-code
instrumentation.** Keep the default e2e run fast.

### 0.1 Why scenario coverage instead of line coverage

Line coverage answers "which lines ran," which for an E2E suite is noisy, slow, and easy to game
(executed ≠ asserted). The question that actually matters for this app is **"are the important things a
player does covered by an end-to-end test?"** — traceability / risk-based coverage. That needs a
denominator of *intended user journeys* (including ones nobody has tested yet) so gaps are visible.
Line coverage cannot express "the reset-cancel journey is untested"; a scenario catalog can.

### 0.2 Explicit non-goals (do NOT build these)

- **No app instrumentation / coverage build.** Drop everything from the prior plan: `monocart-coverage-reports`,
  `nyc`, `swc-plugin-coverage-instrument`, `babel-plugin-istanbul`, `v8-to-istanbul`, `page.coverage`,
  `window.__coverage__`, `COVERAGE=1` builds, `dev:coverage`, the Turbopack/SWC-plugin spike. None of it.
- **No change to the unit gate.** Vitest coverage (`test:coverage`, V8, ~95% thresholds) stays exactly as
  is. This work is purely about the E2E layer.
- **No merged / combined number.** There is no unit+e2e line merge anymore.
- **The `/* v8 ignore */` pragmas STAY.** The old plan wanted to delete the pragmas in
  `move-editor.tsx` / `move-log.tsx` by *proving* E2E line-covers them via the merged report. Without a
  line-coverage report there is nothing to prove them with, and the pragmas' existing justification
  ("reachable only in a real browser; excluded from unit line coverage, exercised behaviorally by e2e")
  already stands and is documented in the QA skill. Leave them, and leave the defensive
  `move-composer.tsx` guards, untouched.

---

## 1. Branch & base (verify before acting)

- Develop on the existing feature branch **`claude/e2e-coverage-user-scenarios-ebpjcq`** (already checked out
  off `origin/main`). The tests being catalogued already live on `main`, so no special base is needed —
  the old plan's "base off the feature branch `claude/bomb-busters-tracker-app-j99fim`" note is **obsolete**.
- Commit with clear messages. **Do not open a PR unless the human explicitly asks.**
- If the branch's PR has already merged, restart the branch from `origin/main` and treat follow-up as a
  fresh change (standard project rule).

---

## 2. Repository context (assume no prior knowledge)

- **App:** `bombdog` — a phone-first companion web app for logging moves in the board game *Bomb Busters*
  (a pure move logger, no rules engine). Repo: `axross/bombdog`.
- **Stack:** Next.js 16 (App Router, Turbopack in dev) · React 19 · TypeScript (strict) · CSS Modules ·
  state via **zustand** persisted to **IndexedDB** through `idb-keyval`. Path alias `@/*` → `src/*`.
- **Tooling:** npm · Biome (lint + format) · Vitest + Testing Library (unit, jsdom) · **Playwright**
  (e2e, Chromium). Playwright `^1.61` — supports the `test(title, { tag }, fn)` object-options form,
  test-level `annotations`, and custom reporters.
- **E2E layout (verify — counts drift):**
  - `e2e/tests/smoke.test.ts` — ~5 boot/core-loop gates.
  - `e2e/tests/happy-path.test.ts` — ~12 main-use-case scenarios.
  - `e2e/tests/regressions.test.ts` — ~1 regression guard.
  - `e2e/helpers/tracker.ts` — composable helpers (`gotoApp`, `startTracking`, `startTrackingWith`,
    `logDualCut`, `logSoloCut`, `logDoubleDetector`, `logEquipment`, `pickTarget`, `selectWire`,
    `setOutcome`, …). `gotoApp` hides the Next dev-tools badge via
    `page.addStyleTag({ content: "nextjs-portal{display:none!important}" })` — **must remain**.
- **Config (verify):** `playwright.config.ts` — `testDir: "./e2e/tests"`, Chromium project,
  `webServer.command: "npm run dev"` on `http://localhost:3000`, honors
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. In the sandbox the browser is
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (do **not** run `playwright install`). Run e2e as:
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run test:e2e`.
- **The app's user-scenario universe** (source of the catalog denominator): configure a roster (2–5
  players, names, Captain) → log moves of four action types (dual cut, solo cut, double detector,
  equipment) with success / fail-with-reveal outcomes → watch the turn advance → undo/redo → edit a
  logged move in place → collapse/expand the composer → history persists across reload → reset returns to
  setup. This is a small, well-bounded surface, which is exactly why a hand-authored catalog is tractable.

---

## 3. Design decisions (locked — do not re-litigate)

These were confirmed with the human. Implement to them.

1. **Metric = scenario coverage, and *only* scenario coverage at the E2E layer.** No line instrumentation
   (§0.2).
2. **Denominator = a typed, authored scenario catalog** (a committed manifest). Coverage is
   `scenarios with ≥1 passing tagged test / total catalog scenarios`, reported overall and per priority.
3. **Tests declare coverage via tags** derived from the catalog (type-safe, so a typo can't silently
   invent or miss a scenario).
4. **Gate policy is phased:** ship **report-only** first (print the number + gaps, exit 0), then, once the
   catalog is agreed stable, flip on a **hard gate that fails the run if any `must` scenario is
   uncovered** (`must` coverage < 100%). `should` / `may` are always report-only.
5. **Deliverable for the current session:** this refined plan document only, committed to the branch. No
   code changes yet — a later session implements §5.

---

## 4. Chosen mechanism

A three-part, dependency-free design (Playwright + a small custom reporter + a check script):

1. **Catalog** — `e2e/scenarios.ts`: a typed array of scenario definitions plus a tag helper.
2. **Tags** — each `test(...)` carries one or more `@scn:<id>` tags produced from the catalog helper.
3. **Reporter + gate** — a custom Playwright reporter reads the catalog, collects the tags of *passing*
   tests, computes coverage, prints a summary, and writes a machine artifact. A separate check script
   reads that artifact and enforces the gate (phase 2). The reporter runs on every `npm run test:e2e`
   (near-zero cost, no instrumentation), so the default run stays fast.

### 4.1 Catalog shape (`e2e/scenarios.ts`)

```ts
export type Priority = "must" | "should" | "may";
export type Area = "setup" | "logging" | "session" | "history" | "persistence" | "lifecycle";

export interface Scenario {
  /** Stable, unique, dotted id — the tag payload. Never renamed casually (it's a contract). */
  id: string;
  /** The user's goal, phrased as a journey (not an implementation detail). */
  title: string;
  area: Area;
  priority: Priority;
}

export const SCENARIOS = [ /* … see §4.4 starter set … */ ] as const satisfies readonly Scenario[];

/** Build the Playwright tag for a scenario id. Tags MUST start with "@". */
export const scn = (id: string): `@scn:${string}` => `@scn:${id}`;

/** Optional: a typed map so tests reference ids by symbol, not string literal. */
export const SCN = Object.fromEntries(SCENARIOS.map((s) => [s.id, scn(s.id)]));
```

- Keep `id`s stable — they are the join key between catalog and tests. Renames must update both sides in
  the same commit.
- `title` is the human sentence for the report; `area` groups the report; `priority` drives the gate.

### 4.2 Tagging a test

```ts
import { scn } from "../scenarios";

test("configures a two-player game (the minimum)", { tag: scn("setup.min-players") }, async ({ page }) => {
  // …
});

// A single test may cover several scenarios — pass an array:
test("persists the full session across a reload",
  { tag: [scn("log.dual-cut.fail-reveal"), scn("log.solo-cut"), scn("persist.reload")] },
  async ({ page }) => { /* … */ });
```

- Multiple tests MAY cover the same scenario (fine — it stays "covered").
- A test tagged with an id **not** in the catalog is an **error** (fail fast in the reporter) — catches
  typos and stale tags.
- Prefer tagging the test that *asserts* the journey's outcome, not every test that merely passes through
  it, to keep the mapping honest.

### 4.3 Reporter + check script

- **Reporter** `e2e/reporters/scenario-coverage.ts` (a Playwright `Reporter`):
  - `onBegin`: load `SCENARIOS`; build `id → covered:false`.
  - `onTestEnd(test, result)`: for `result.status === "passed"`, read `test.tags`, strip the `@scn:`
    prefix, mark those ids covered. Collect any tag whose id is not in the catalog into an `unknownTags`
    set.
  - `onEnd`:
    - If `unknownTags` is non-empty → print them and signal failure (these are always errors, even in
      report-only phase).
    - Compute per-priority and overall `covered/total` and the list of **uncovered** scenarios (grouped by
      area, `must` first).
    - Print a readable table to the console.
    - Write a machine artifact `e2e/.scenario-coverage/summary.json`
      (`{ overall, byPriority, covered:[…], uncovered:[{id,title,area,priority}] }`) for the check script
      and for tracking.
  - Register it **alongside** the existing reporters in `playwright.config.ts` (don't replace `list`/`html`
    — append). Its cost is trivial, so it runs on the default `npm run test:e2e`.
- **Check script** `scripts/check-scenario-coverage.mjs`:
  - Read `e2e/.scenario-coverage/summary.json`.
  - Exit non-zero if `unknownTags` present (always), or — **phase 2 only** — if any `must` scenario is
    uncovered. Print exactly which scenarios failed the gate.
  - Keep gating in the script (not the reporter) so `npm run test:e2e` stays green/report-only while
    `npm run coverage:scenarios` enforces.

### 4.4 Starter catalog (derive the real one from the app + current tests; this is a seed, not gospel)

Enumerate the **full** universe, including journeys that currently have **no** test — that is the whole
point (the gap list must be real). Map each to existing tests where one exists. Suggested seed:

| id | title | area | priority | covered by (today) |
|---|---|---|---|---|
| `setup.default-start` | Start with the default roster and open the tracker | setup | must | smoke "starting a game opens…" |
| `setup.min-players` | Configure the two-player minimum | setup | should | happy-path "two-player" |
| `setup.max-players` | Configure the five-player maximum | setup | should | happy-path "five players" |
| `setup.custom-names` | Player names reach the composer's controls | setup | should | happy-path "five players" |
| `setup.choose-captain` | A chosen Captain takes the first turn | setup | should | happy-path "five players" |
| `log.dual-cut.success` | Log a successful dual cut | logging | must | smoke + happy-path |
| `log.dual-cut.fail-reveal` | A failed dual cut records the revealed wire | logging | must | happy-path "dual cut — fail" |
| `log.solo-cut` | Log a solo cut (no target/outcome) | logging | must | happy-path "solo cut" |
| `log.double-detector` | Log a double detector (blue wires only) | logging | should | happy-path "double detector" |
| `log.equipment` | Log an equipment action with a note | logging | should | happy-path "equipment" |
| `history.shows-moves` | Logged moves appear in the history (oldest→newest) | history | must | smoke "logging a move adds it" |
| `session.turn-advance` | The turn indicator advances to the next seat | session | must | happy-path "turn indicator advances" |
| `session.undo-redo` | Undo/redo walk the stack; a new move clears redo | session | should | happy-path "undo and redo" |
| `session.edit-move` | Edit a logged move in place | session | should | happy-path "edits a logged move" |
| `session.collapse` | Collapse and expand the composer | session | should | happy-path "collapses and expands" |
| `session.log-consecutive` | Log two moves back-to-back reusing the same target | session | should | regressions test |
| `persist.reload` | The full session survives a reload (IndexedDB) | persistence | must | smoke + happy-path "persists…" |
| `lifecycle.reset` | Reset returns to the setup screen | lifecycle | must | smoke "reset returns…" |

**Deliberately include some currently-UNTESTED journeys** so the first report shows genuine gaps rather
than a hollow 100% (confirm which are actually untested against the suite):

| id | title | area | priority | covered by (today) |
|---|---|---|---|---|
| `lifecycle.reset-cancel` | Dismissing the reset confirmation keeps the session | lifecycle | should | — (gap) |
| `session.edit-cancel` | Cancel an edit without changing the move | session | should | — (gap) |
| `log.dual-cut.fail-yellow` | A failed cut revealing the yellow wire is recorded | logging | may | partially (happy-path reload uses yellow) — verify |
| `log.solo-cut.yellow` | Solo-cut the yellow wire | logging | may | — (gap?) |

Right-size the final list to the app; don't pad it. Get the `must` set agreed with the human before
flipping the gate on (§3.4), because `must` = 100% is a hard contract.

### 4.5 Scripts to add (`package.json`)

- Keep `test:e2e` = `playwright test` (now also prints scenario coverage via the appended reporter —
  still fast, no gate).
- `coverage:scenarios` — run the e2e suite and then enforce the gate:
  `playwright test && node scripts/check-scenario-coverage.mjs` (phase 1: check only validates unknown
  tags; phase 2: also enforces `must` = 100%). Use a flag/env (e.g. `SCENARIO_GATE=must`) so flipping
  phase 1 → phase 2 is a one-line change, not a rewrite.

### 4.6 `.gitignore`

- Ignore the artifact dir `e2e/.scenario-coverage/`. (Optionally, if you want a *tracked* snapshot over
  time, generate a committed `e2e/SCENARIO-COVERAGE.md` deliberately — treat it like a snapshot: regenerate
  intentionally, review the diff. Decide with the human; default is untracked artifact + PR-reviewed
  numbers.)

---

## 5. Step-by-step implementation (for the later session)

1. **Author `e2e/scenarios.ts`** — the typed catalog (§4.1) + `scn`/`SCN` helpers. Derive the real
   scenario set from the app and the current suite (§4.4); include real gaps.
2. **Tag every existing test** with `scn(...)` (§4.2). One test may carry several tags. Verify each tag id
   exists in the catalog.
3. **Write the reporter** `e2e/reporters/scenario-coverage.ts` (§4.3); append it to `reporter` in
   `playwright.config.ts` (do not drop existing reporters).
4. **Write the check script** `scripts/check-scenario-coverage.mjs` (§4.3), gated by an env/flag so
   report-only → enforce is a one-liner.
5. **Add scripts** `coverage:scenarios`; leave `test:e2e` fast (§4.5). Update `.gitignore` (§4.6).
6. **Run the suite**, read the printed coverage + gap list, and fix obvious mismatches (missing tags,
   catalog ids with no title, etc.). Confirm the number is honest (gaps you know exist actually show up).
7. **Decide the `must` set with the human, then flip phase 2** (enable the gate). Confirm `coverage:scenarios`
   fails when a `must` scenario is deliberately un-tagged, and passes when restored.
8. **Update skills / docs** (§7).
9. **Full local gate** (§6) green; commit with clear messages. No PR unless asked.

> Adding coverage for the newly-surfaced gaps (e.g. `lifecycle.reset-cancel`, `session.edit-cancel`) is a
> **follow-up**, not part of wiring the metric — surfacing them is the metric doing its job. Note them for
> the human; don't silently expand scope.

---

## 6. Requirements / acceptance criteria (checklist)

- [ ] Develop on `claude/e2e-coverage-user-scenarios-ebpjcq`; no PR unless the human asks.
- [ ] **No** application-code instrumentation added; no `monocart`/`nyc`/`swc-plugin`/`COVERAGE` build; the
      `/* v8 ignore */` pragmas and the `move-composer.tsx` guards are untouched (§0.2).
- [ ] The Vitest unit coverage gate (`test:coverage`, ~95%) is unchanged and still passes.
- [ ] `e2e/scenarios.ts` exists as a typed catalog covering the app's real user journeys, **including**
      currently-untested ones, with `id` / `title` / `area` / `priority`.
- [ ] Every e2e test is tagged with `@scn:<id>` from the catalog; a stale/typo tag fails the run.
- [ ] `npm run test:e2e` still passes, **stays fast**, and now prints an overall + per-priority scenario
      coverage summary and a grouped list of uncovered scenarios.
- [ ] `npm run coverage:scenarios` produces the artifact and enforces the gate; **phase 2**: it fails when a
      `must` scenario is uncovered and passes when all `must` are covered (demonstrate both).
- [ ] The gap list is real (at least one genuinely uncovered scenario appears), proving the metric finds
      holes rather than reporting a hollow 100%.
- [ ] Skills updated (§7).
- [ ] Full local gate green: `npm run format`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`,
      `npm run build`, and the e2e suite
      (`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=… npm run test:e2e`), plus `npm run coverage:scenarios`.

---

## 7. Documentation / skills to update

The repo routes skills via `AGENTS.md` → `.agents/skills/**`. Update:

- **`.agents/skills/e2e-testing-guidelines/SKILL.md`** — add the scenario-coverage convention: the catalog
  lives in `e2e/scenarios.ts`; every test MUST be tagged with `@scn:<id>` from it; how to run and read
  `coverage:scenarios`; that a new user-facing journey MUST be added to the catalog (and, if `must`, must
  be covered before the gate passes). State plainly that this project tracks **scenario** coverage at the
  E2E layer, **not** E2E line coverage.
- **`.agents/skills/quality-assurance-guidelines/SKILL.md`** — under the existing "E2E Coverage" section,
  add the scenario-coverage evidence expectation (report the covered/total and any new gaps; a new
  `must` scenario is a blocker until covered). Do **not** introduce a "combined line coverage" note — that
  approach was dropped.
- **Optional ADR** `docs/adr/000X-e2e-scenario-coverage.md` — record the decision: scenario coverage over
  E2E line coverage, the typed-catalog-plus-tags mechanism, the phased gate, and why app instrumentation
  was rejected (noise, slowness, Turbopack/SWC-plugin risk, executed ≠ asserted).
- Keep the `AGENTS.md` skill index in sync if any skill file is added.

---

## 8. Risks & gotchas

- **Denominator is subjective.** The catalog is a human judgment call; an incomplete catalog inflates the
  percentage. Mitigate by reviewing the catalog in PRs and requiring new user-facing journeys to be added
  to it — the number is only as honest as the list. This is why the gate is **phased** and only `must`
  is hard-gated.
- **Executed ≠ asserted still applies.** A tagged test that passes through a journey without asserting its
  outcome overstates coverage. Tag the asserting test; review tags in code review.
- **Tag drift.** A renamed scenario id or a typo silently loses coverage — the reporter MUST fail on any
  `@scn:` tag not in the catalog (treat as an error in both phases).
- **Skipped/failed tests don't count as covering.** Only `passed` marks a scenario covered, so a broken
  test correctly drops its scenario from the covered set.
- **Keep the default e2e run fast and uninstrumented.** The reporter is pure bookkeeping; never add an
  instrumented build to the default path.
- **The dev-overlay hide trick** (`gotoApp` in `e2e/helpers/tracker.ts`) must remain.

---

## 9. Reference links

- Playwright test tags — https://playwright.dev/docs/test-annotations#tag-tests
- Playwright custom reporters — https://playwright.dev/docs/api/class-reporter
- Playwright `TestCase.tags` — https://playwright.dev/docs/api/class-testcase#test-case-tags
- Traceability / requirements-based test coverage (background) —
  https://en.wikipedia.org/wiki/Traceability_matrix

---

## 10. Suggested first moves ("do this")

1. Read `AGENTS.md` and the linked e2e + QA skills; read `package.json`, `playwright.config.ts`, the three
   e2e specs, and `e2e/helpers/tracker.ts`. Confirm the suite is green
   (`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=… npm run test:e2e`).
2. Draft `e2e/scenarios.ts` from the app + current tests (§4.4); list the real gaps.
3. Tag the tests; add the reporter + check script + `coverage:scenarios` script (§4.3–4.5).
4. Run report-only, sanity-check the number and gaps, agree the `must` set, then flip the gate to phase 2.
5. Update skills (§7), run the full gate (§6), commit with clear messages. **No PR unless asked.**

*End of document.*
