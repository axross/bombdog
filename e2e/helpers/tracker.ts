import { expect, type Locator, type Page } from "@playwright/test";

/**
 * A wire the pad can select: a blue number, the yellow wire, or "?" (unknown).
 */
export type Wire = number | "yellow" | "unknown";
/**
 * A revealed actual value recorded when a cut fails.
 */
export type Revealed = number | "yellow" | "unknown";

/**
 * Navigate to the app and neutralise the Next.js dev-tools badge. Served by
 * `npm run dev`, that badge sits bottom-left inside a `<nextjs-portal>` and
 * intercepts pointer events on the composer's bottom controls (collapse /
 * undo / redo). Hiding it makes those clicks land reliably; it is a no-op
 * against a production build where the badge is absent.
 */
export async function gotoApp(page: Page): Promise<void> {
	await page.goto("/");
	await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
}

/**
 * Complete the setup screen with the default players and open the tracker.
 */
export async function startTracking(page: Page): Promise<void> {
	await gotoApp(page);
	await page.getByTestId("setup").getByTestId("start").click();
	await expect(composer(page)).toBeVisible();
}

/**
 * Drive the setup screen with a specific roster and Captain, then open the
 * tracker. `names` sets the player count (one entry per seat, min 2 / max 5);
 * `captainIndex` is the zero-based seat that holds the Captain (default 0).
 *
 * @throws if `names` is outside the supported 2–5 player range.
 */
export async function startTrackingWith(
	page: Page,
	{ names, captainIndex = 0 }: { names: string[]; captainIndex?: number },
): Promise<void> {
	// the roster must fit the stepper's range (MIN_PLAYERS 2 … MAX_PLAYERS 5);
	// outside it the Add/Remove button is disabled and the loop below would hang
	// until timeout, so fail fast with a clear message instead.
	const target = names.length;
	if (target < 2 || target > 5) {
		throw new Error(`startTrackingWith needs 2–5 names, got ${target}`);
	}

	await gotoApp(page);
	const setup = page.getByTestId("setup");
	for (let n = 4; n < target; n++) {
		await setup.getByRole("button", { name: "Add a player" }).click();
	}
	for (let n = 4; n > target; n--) {
		await setup.getByRole("button", { name: "Remove a player" }).click();
	}

	for (const [i, name] of names.entries()) {
		const input = setup.getByRole("textbox", {
			name: `Name of player ${i + 1}`,
		});
		await input.fill(name);
	}

	await setup
		.getByRole("radio", { name: `Make player ${captainIndex + 1} the Captain` })
		.click();

	await setup.getByTestId("start").click();
	await expect(composer(page)).toBeVisible();
}

/**
 * The bottom-half move composer.
 */
export function composer(page: Page): Locator {
	return page.getByTestId("composer");
}

/**
 * The top-half move history.
 */
export function moveLog(page: Page): Locator {
	return page.getByTestId("move-log");
}

/**
 * A logged move row by its sequence number.
 */
export function moveRow(page: Page, seq: number): Locator {
	return moveLog(page).locator(`[data-testid="move"][data-seq="${seq}"]`);
}

/**
 * Open the move-log filter dialog from its header trigger.
 */
export async function openFilter(page: Page): Promise<void> {
	await header(page).getByTestId("filter").click();
	await expect(page.getByTestId("filter-dialog")).toBeVisible();
}

/**
 * The move-log filter dialog.
 */
export function filterDialog(page: Page): Locator {
	return page.getByTestId("filter-dialog");
}

/**
 * The app header, which carries the brand, the filter trigger, and Reset.
 */
export function header(page: Page): Locator {
	return page.getByTestId("header");
}

/**
 * Open a SelectField (by its test id, scoped to the composer) and choose an
 * option. Options are Radix-portaled with the `option` role, so they are
 * targeted by accessible name.
 */
export async function chooseInComposer(
	page: Page,
	fieldTestId: string,
	optionName: string,
): Promise<void> {
	await composer(page).getByTestId(fieldTestId).click();
	await page.getByRole("option", { name: optionName, exact: true }).click();
}

/**
 * Set the acting player from the "Acting" dropdown.
 */
export async function setActor(page: Page, playerName: string): Promise<void> {
	await chooseInComposer(page, "acting", playerName);
}

/**
 * Pick a target player. Non-self players are one tap on the segmented control;
 * the acting player (self-target) is folded into the trailing ⋯ overflow menu,
 * so when there is no segmented button for the name, open the menu and choose
 * its `"<name> (self)"` item instead.
 */
export async function pickTarget(
	page: Page,
	playerName: string,
): Promise<void> {
	const target = composer(page).getByTestId("target");
	const segmented = target.getByRole("radio", {
		name: playerName,
		exact: true,
	});
	if ((await segmented.count()) > 0) {
		await segmented.click();
		return;
	}

	// self-target: reached through the ⋯ overflow menu (portaled to the body).
	await target.getByRole("button", { name: "Other targets" }).click();
	await page
		.getByRole("menuitemradio", { name: `${playerName} (self)`, exact: true })
		.click();
}

const wireTestId = (wire: Wire) =>
	wire === "yellow"
		? "wire-yellow"
		: wire === "unknown"
			? "wire-unknown"
			: `wire-${wire}`;
const revealTestId = (value: Revealed) =>
	value === "yellow"
		? "reveal-yellow"
		: value === "unknown"
			? "reveal-unknown"
			: `reveal-${value}`;

/**
 * Tap a wire on the composer's wire pad.
 */
export async function selectWire(page: Page, wire: Wire): Promise<void> {
	await composer(page).getByTestId(wireTestId(wire)).click();
}

/**
 * Set the outcome. `success` taps Success; a `reveal` value taps Fail and then
 * records the actual wire in the popup that opens.
 */
export async function setOutcome(
	page: Page,
	outcome: "success" | { reveal: Revealed },
): Promise<void> {
	if (outcome === "success") {
		await composer(page).getByTestId("outcome-success").click();
		return;
	}
	await composer(page).getByTestId("outcome-fail").click();
	await page
		.getByTestId("reveal-dialog")
		.getByTestId(revealTestId(outcome.reveal))
		.click();
	await expect(page.getByTestId("reveal-dialog")).toBeHidden();
}

/**
 * Submit the composed move.
 */
export async function logMove(page: Page): Promise<void> {
	await composer(page).getByTestId("log-move").click();
}

/**
 * Inputs for a dual cut: an optional acting player override, plus the target, wire, and outcome.
 */
interface CutOptions {
	actor?: string;
	target: string;
	wire: Wire;
	outcome: "success" | { reveal: Revealed };
}

/**
 * Compose and log a dual cut.
 */
export async function logDualCut(page: Page, opts: CutOptions): Promise<void> {
	await composer(page).getByTestId("tab-dual-cut").click();
	if (opts.actor) await setActor(page, opts.actor);
	await pickTarget(page, opts.target);
	await selectWire(page, opts.wire);
	await setOutcome(page, opts.outcome);
	await logMove(page);
}

/**
 * Inputs for a detector action: an optional actor and card override, plus the target, blue values, and outcome.
 */
interface DetectorOptions {
	actor?: string;
	/**
	 * The detector card label (e.g. "Triple Detector (3)"); omit for the Double Detector default.
	 */
	card?: string;
	target: string;
	/**
	 * Named blue values: one for double/triple/super, two for the X or Y Ray.
	 */
	values: Wire[];
	outcome: "success" | { reveal: Revealed };
}

/**
 * Compose and log a detector action (blue wires only, no yellow).
 */
export async function logDetector(
	page: Page,
	opts: DetectorOptions,
): Promise<void> {
	await composer(page).getByTestId("tab-detector").click();
	if (opts.actor) await setActor(page, opts.actor);
	if (opts.card) await chooseInComposer(page, "detector", opts.card);
	await pickTarget(page, opts.target);
	for (const value of opts.values) await selectWire(page, value);
	await setOutcome(page, opts.outcome);
	await logMove(page);
}

/**
 * Compose and log a solo cut (no target, no outcome).
 */
export async function logSoloCut(
	page: Page,
	{ actor, wire }: { actor?: string; wire: Wire },
): Promise<void> {
	await composer(page).getByTestId("tab-solo-cut").click();
	if (actor) await setActor(page, actor);
	await selectWire(page, wire);
	await logMove(page);
}

/**
 * Compose and log an equipment action, optionally with a note.
 */
export async function logEquipment(
	page: Page,
	{
		actor,
		equipment,
		note,
	}: { actor?: string; equipment: string; note?: string },
): Promise<void> {
	await composer(page).getByTestId("tab-equipment").click();
	if (actor) await setActor(page, actor);
	await chooseInComposer(page, "equipment", equipment);
	if (note) {
		await composer(page)
			.getByRole("textbox", { name: "Note (optional)" })
			.fill(note);
	}
	await logMove(page);
}
