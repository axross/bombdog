import { expect, test } from "@playwright/test";
import {
	gotoApp,
	logDetector,
	logDualCut,
	logSoloCut,
	moveLog,
	openMovesTab,
	openStatusTab,
	placeInfoToken,
	startFromSetup,
	startTracking,
	statusPanel,
	statusRow,
} from "../helpers/tracker";

// The Status tab derives a deduction aid from the logged moves: per-value
// cut/uncut counts (out of the four copies of each blue value) and the players
// known to hold an uncut wire.

test.describe("status view", () => {
	test("shows only the active tab's panel, filling the content area", {
		tag: ["@scenario:status.tab-switch", "@area:status", "@priority:should"],
	}, async ({ page }) => {
		await startTracking(page);

		// Moves is default: the log is visible and the status panel is fully
		// hidden (Radix keeps it mounted with `hidden`, so it must not take space).
		await expect(moveLog(page)).toBeVisible();
		await expect(statusPanel(page)).toBeHidden();

		await openStatusTab(page);
		await expect(statusPanel(page)).toBeVisible();
		await expect(moveLog(page)).toBeHidden();

		// the active panel fills the tab area rather than half of it: its height
		// tracks its scroll container, so no dead space sits below it.
		const panelBox = await page.getByTestId("tab-panel-status").boundingBox();
		const innerBox = await statusPanel(page).boundingBox();
		expect(panelBox?.height).toBeGreaterThan(0);
		expect(innerBox?.height).toBeCloseTo(panelBox?.height ?? 0, 0);

		await openMovesTab(page);
		await expect(moveLog(page)).toBeVisible();
		await expect(statusPanel(page)).toBeHidden();
	});

	test("tallies cut vs uncut copies per value", {
		tag: ["@scenario:status.counts", "@area:status", "@priority:should"],
	}, async ({ page }) => {
		await startTracking(page);
		// a successful dual cut of 9 cuts two copies (actor + target).
		await logDualCut(page, { target: "Player 2", wire: 9, outcome: "success" });
		// a solo cut of 5 removes its last copies → fully cut.
		await logSoloCut(page, { wire: 5 });

		await openStatusTab(page);

		await expect(
			statusRow(page, 9).getByTestId("status-count"),
		).toHaveAttribute("data-cut", "2");
		await expect(
			statusRow(page, 9).getByTestId("status-count"),
		).toHaveAttribute("data-uncut", "2");
		await expect(
			statusRow(page, 5).getByTestId("status-count"),
		).toHaveAttribute("data-cut", "4");
		// an untouched value stays fully uncut.
		await expect(
			statusRow(page, 1).getByTestId("status-count"),
		).toHaveAttribute("data-cut", "0");
	});

	test("shows known holders and consumes them on a successful cut", {
		tag: ["@scenario:status.possession", "@area:status", "@priority:should"],
	}, async ({ page }) => {
		// Player 1 places a starting info token on a 3.
		await gotoApp(page);
		await placeInfoToken(page, 0, 3);
		await startFromSetup(page);

		// a failed dual cut reveals that Player 2 holds an 8.
		await logDualCut(page, {
			target: "Player 2",
			wire: 6,
			outcome: { reveal: 8 },
		});

		await openStatusTab(page);
		await expect(
			statusRow(page, 3).getByTestId("status-holder"),
		).toHaveAttribute("data-player", "Player 1");
		await expect(
			statusRow(page, 8).getByTestId("status-holder"),
		).toHaveAttribute("data-player", "Player 2");

		// a successful 3-cut against Player 1 consumes their known copy.
		await logDualCut(page, {
			actor: "Player 2",
			target: "Player 1",
			wire: 3,
			outcome: "success",
		});

		await openStatusTab(page);
		await expect(statusRow(page, 3).getByTestId("status-holder")).toHaveCount(
			0,
		);
	});

	test("records the actual value a successful X or Y Ray cut", {
		tag: [
			"@scenario:status.xy-ray-cut-value",
			"@area:status",
			"@priority:should",
		],
	}, async ({ page }) => {
		await startTracking(page);
		// the ray names 4 and 7; the wire turned out to be a 7.
		await logDetector(page, {
			card: "X or Y Ray (10)",
			target: "Player 2",
			values: [4, 7],
			outcome: "success",
			cutValue: 7,
		});

		await openStatusTab(page);
		// only the captured value is tallied, not the other named candidate.
		await expect(
			statusRow(page, 7).getByTestId("status-count"),
		).toHaveAttribute("data-cut", "2");
		await expect(
			statusRow(page, 4).getByTestId("status-count"),
		).toHaveAttribute("data-cut", "0");
	});
});
