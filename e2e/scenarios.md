# E2E Scenario Catalog

This table is the **denominator** for the project's E2E scenario-coverage metric:
*which real user journeys the Playwright suite exercises* — **not** lines of
application code executed. It is authored by hand and reviewed in PRs.

Each e2e test declares the journey(s) it covers with plain-string Playwright
tags: `@scenario:<id>` (the join key to the `ID` column below), plus the matching
`@area:<area>` and `@priority:<priority>` facet tags, plus an optional `@smoke`
selection facet. A journey counts as **covered** when at least one *passing* test
carries its `@scenario:<id>` tag. The reporter
(`e2e/reporters/scenario-coverage.ts`) parses this table, so:

- Keep the `ID` stable — it is the contract between this catalog and the tests.
  Renaming one means updating every `@scenario:` tag that references it in the
  same commit.
- `Priority` MUST be one of `must` / `should` / `may`. `must` is hard-gated at
  100% by `npm run coverage:scenarios`; `should` / `may` are report-only.
- **Include genuinely-untested journeys** (there is intentionally no "covered"
  column) so the report surfaces real gaps rather than a hollow 100%. Today
  `session.edit-cancel` and `lifecycle.reset-cancel` have no test — that is the
  metric doing its job, and writing those tests is follow-up work.

| ID | Title | Area | Priority |
| --- | --- | --- | --- |
| setup.boots | The app boots to the setup screen | setup | must |
| setup.default-start | Start with the default roster and open the tracker | setup | must |
| setup.min-players | Configure the two-player minimum | setup | should |
| setup.max-players | Configure the five-player maximum | setup | should |
| setup.custom-names | Custom player names reach the composer's controls | setup | should |
| setup.choose-captain | A chosen Captain takes the first turn | setup | should |
| setup.name-select-on-focus | Focusing a seat name selects its whole value for quick replacement | setup | should |
| setup.info-tokens | Place starting info tokens and see them in the tracker's Starting info strip | setup | should |
| setup.skip-info-tokens | Skip the starting info token phase at setup | setup | should |
| log.dual-cut.success | Log a successful dual cut | logging | must |
| log.dual-cut.fail-reveal | A failed dual cut records the revealed wire | logging | must |
| log.dual-cut.fail-yellow | A failed dual cut revealing the yellow wire is recorded | logging | may |
| log.dual-cut.self-target | Log a dual cut whose target is the acting player, chosen from the ⋯ overflow menu | logging | may |
| log.solo-cut | Log a solo cut (no target, no outcome) | logging | must |
| log.unknown-wire | Log a cut against a "?" (unknown) wire value | logging | should |
| log.double-detector | Log a double detector (blue wires only) | logging | should |
| log.detector.xy-ray | Log an X or Y Ray naming two values against one wire | logging | should |
| log.detector.super | Log a super detector pointed at a whole stand | logging | may |
| log.equipment | Log an equipment action with a note | logging | should |
| session.turn-advance | The turn indicator advances to the next seat after a cut | session | must |
| session.equipment-no-advance | Logging equipment keeps the turn on the same actor | session | should |
| session.off-turn-equipment | Off-turn equipment returns the suggestion to the turn-holder | session | should |
| session.undo-redo | Undo/redo walk the move stack; a new move clears redo | session | should |
| session.edit-move | Edit a logged move in place | session | should |
| session.edit-cancel | Cancel an edit leaves the logged move unchanged | session | should |
| session.delete-move | Delete a logged move from its edit panel | session | should |
| session.composer-sheet | Open the composer sheet from the bar and dismiss it back to the bar (staying open after logging) | session | should |
| session.log-consecutive | Log two moves back-to-back reusing the same target | session | should |
| session.reset-to-dual-cut | Logging a move returns the composer's action tab to Dual cut | session | should |
| history.shows-moves | Logged moves appear in the history | history | must |
| history.filter.exclude-dual-cut | The filter hides successful dual cuts while keeping failed ones | history | should |
| history.filter.exclude-solo-cut | The filter hides solo cuts | history | should |
| history.filter.exclude-both | The filter shortcut hides both successful dual cuts and solo cuts | history | should |
| history.filter.reset | Resetting the filter restores every hidden move | history | should |
| persist.reload | The session survives a reload (IndexedDB rehydration) | persistence | must |
| lifecycle.reset | Reset returns to the setup screen with the roster carried over | lifecycle | must |
| lifecycle.reset-cancel | Dismissing the reset confirmation keeps the session | lifecycle | should |
