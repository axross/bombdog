/**
 * E2E **scenario coverage** catalog.
 *
 * This is the denominator for the project's E2E coverage metric. Coverage here
 * is *which real user journeys the Playwright suite exercises* — **not** lines
 * of application code executed. Each entry is a journey a player can take.
 *
 * Tests declare coverage with ordinary, greppable Playwright **tags**:
 *
 * - `@scenario:<id>` — the join key: which catalog journey this test covers
 *   (a test MAY carry several).
 * - `@area:<area>` and `@priority:<priority>` — facet tags for filtering runs
 *   (`--grep @priority:must`, `--grep @area:persistence`) and grouping the
 *   report. The reporter validates them against the catalog so they can't drift.
 * - `@smoke` — an optional selection facet marking the fast pre-gate subset.
 *
 * A scenario counts as covered when at least one **passing** test carries its
 * `@scenario:<id>` tag.
 *
 * The catalog is authored by hand on purpose: it must include journeys that
 * currently have **no** test so the coverage report surfaces real gaps rather
 * than a hollow 100%. Add a new user-facing journey here when you add one to the
 * app; if it is a `must`, it blocks the gate until a test covers it.
 *
 * @see .agents/skills/e2e-testing-guidelines/SKILL.md for the tagging convention.
 */

/**
 * Gate weight of a scenario. `must` is hard-gated at 100% by
 * `scripts/check-scenario-coverage.mjs`; `should`/`may` are report-only.
 */
export const PRIORITIES = ["must", "should", "may"] as const;
export type Priority = (typeof PRIORITIES)[number];

/**
 * The area a scenario belongs to; groups the coverage report and is a facet tag.
 */
export const AREAS = [
	"setup",
	"logging",
	"session",
	"history",
	"persistence",
	"lifecycle",
] as const;
export type Area = (typeof AREAS)[number];

/**
 * A single authored user journey.
 */
export interface Scenario {
	/**
	 * Stable, unique, dotted id — the payload of the `@scenario:<id>` tag and the
	 * join key between this catalog and the tests. It is a contract: renaming it
	 * means updating every tag that references it in the same commit.
	 */
	id: string;
	/**
	 * The user's goal phrased as a journey, not an implementation detail. Shown
	 * verbatim in the coverage report.
	 */
	title: string;
	area: Area;
	priority: Priority;
}

/**
 * The authored catalog. Derived from the app's surface and the current e2e
 * suite, and deliberately including currently-untested journeys (see the
 * entries marked "gap" below) so the report shows genuine holes.
 */
export const SCENARIOS = [
	// setup ————————————————————————————————————————————————————————————————
	{
		id: "setup.boots",
		title: "The app boots to the setup screen",
		area: "setup",
		priority: "must",
	},
	{
		id: "setup.default-start",
		title: "Start with the default roster and open the tracker",
		area: "setup",
		priority: "must",
	},
	{
		id: "setup.min-players",
		title: "Configure the two-player minimum",
		area: "setup",
		priority: "should",
	},
	{
		id: "setup.max-players",
		title: "Configure the five-player maximum",
		area: "setup",
		priority: "should",
	},
	{
		id: "setup.custom-names",
		title: "Custom player names reach the composer's controls",
		area: "setup",
		priority: "should",
	},
	{
		id: "setup.choose-captain",
		title: "A chosen Captain takes the first turn",
		area: "setup",
		priority: "should",
	},

	// logging ——————————————————————————————————————————————————————————————
	{
		id: "log.dual-cut.success",
		title: "Log a successful dual cut",
		area: "logging",
		priority: "must",
	},
	{
		id: "log.dual-cut.fail-reveal",
		title: "A failed dual cut records the revealed wire",
		area: "logging",
		priority: "must",
	},
	{
		id: "log.dual-cut.fail-yellow",
		title: "A failed dual cut revealing the yellow wire is recorded",
		area: "logging",
		priority: "may",
	},
	{
		id: "log.solo-cut",
		title: "Log a solo cut (no target, no outcome)",
		area: "logging",
		priority: "must",
	},
	{
		id: "log.unknown-wire",
		title: 'Log a cut against a "?" (unknown) wire value',
		area: "logging",
		priority: "should",
	},
	{
		id: "log.double-detector",
		title: "Log a double detector (blue wires only)",
		area: "logging",
		priority: "should",
	},
	{
		id: "log.detector.xy-ray",
		title: "Log an X or Y Ray naming two values against one wire",
		area: "logging",
		priority: "should",
	},
	{
		id: "log.detector.super",
		title: "Log a super detector pointed at a whole stand",
		area: "logging",
		priority: "may",
	},
	{
		id: "log.equipment",
		title: "Log an equipment action with a note",
		area: "logging",
		priority: "should",
	},

	// session ——————————————————————————————————————————————————————————————
	{
		id: "session.turn-advance",
		title: "The turn indicator advances to the next seat after a cut",
		area: "session",
		priority: "must",
	},
	{
		id: "session.equipment-no-advance",
		title: "Logging equipment keeps the turn on the same actor",
		area: "session",
		priority: "should",
	},
	{
		id: "session.off-turn-equipment",
		title: "Off-turn equipment returns the suggestion to the turn-holder",
		area: "session",
		priority: "should",
	},
	{
		id: "session.undo-redo",
		title: "Undo/redo walk the move stack; a new move clears redo",
		area: "session",
		priority: "should",
	},
	{
		id: "session.edit-move",
		title: "Edit a logged move in place",
		area: "session",
		priority: "should",
	},
	{
		// gap: no test dismisses the editor without saving.
		id: "session.edit-cancel",
		title: "Cancel an edit leaves the logged move unchanged",
		area: "session",
		priority: "should",
	},
	{
		id: "session.collapse",
		title: "Collapse and expand the composer",
		area: "session",
		priority: "should",
	},
	{
		id: "session.log-consecutive",
		title: "Log two moves back-to-back reusing the same target",
		area: "session",
		priority: "should",
	},

	// history ——————————————————————————————————————————————————————————————
	{
		id: "history.shows-moves",
		title: "Logged moves appear in the history",
		area: "history",
		priority: "must",
	},
	{
		id: "history.filter.exclude-dual-cut",
		title: "The filter hides successful dual cuts while keeping failed ones",
		area: "history",
		priority: "should",
	},
	{
		id: "history.filter.exclude-solo-cut",
		title: "The filter hides solo cuts",
		area: "history",
		priority: "should",
	},
	{
		id: "history.filter.exclude-both",
		title: "The filter shortcut hides both successful dual cuts and solo cuts",
		area: "history",
		priority: "should",
	},
	{
		id: "history.filter.reset",
		title: "Resetting the filter restores every hidden move",
		area: "history",
		priority: "should",
	},

	// persistence ——————————————————————————————————————————————————————————
	{
		id: "persist.reload",
		title: "The session survives a reload (IndexedDB rehydration)",
		area: "persistence",
		priority: "must",
	},

	// lifecycle ————————————————————————————————————————————————————————————
	{
		id: "lifecycle.reset",
		title: "Reset returns to the setup screen with the roster carried over",
		area: "lifecycle",
		priority: "must",
	},
	{
		// gap: no test dismisses the reset confirmation.
		id: "lifecycle.reset-cancel",
		title: "Dismissing the reset confirmation keeps the session",
		area: "lifecycle",
		priority: "should",
	},
] as const satisfies readonly Scenario[];

/**
 * Tag prefixes, shared by the tests (as plain-string tags) and the reporter.
 *
 * Tests are tagged with plain string literals — there are no builder helpers.
 * A typo is caught at run time by the reporter, which fails the run on any
 * `@scenario:` id not in the catalog and on any `@area:`/`@priority:` facet tag
 * that disagrees with the catalog for the scenario(s) a test covers:
 *
 * ```ts
 * test("...", {
 *   tag: ["@scenario:log.solo-cut", "@area:logging", "@priority:must"],
 * }, fn);
 * ```
 *
 * The fast pre-gate subset additionally carries the plain `@smoke` selection
 * facet (not tied to a scenario), so `--grep @smoke` runs just those tests.
 */
export const SCENARIO_TAG_PREFIX = "@scenario:";
export const AREA_TAG_PREFIX = "@area:";
export const PRIORITY_TAG_PREFIX = "@priority:";
