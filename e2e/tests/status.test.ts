import { expect, test } from "@playwright/test";
import {
	closeComposer,
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
	statusCell,
	statusPanel,
	statusPlayer,
	statusWire,
} from "../helpers/tracker";

// The Status tab derives a deduction aid from the logged moves, in two
// fact-based sections: a wire-count strip (per blue value: uncut, half-cut, or
// fully cut, out of four copies) and per-player possession cards marking the
// values each player is known to hold.

test.describe("status view", () => {
	test("shows only the active tab's panel, filling the content area", {
		tag: ["@scenario:status.tab-switch", "@area:status", "@priority:should"],
	}, async ({ page }) => {
		await startTracking(page);

		await test.step("Moves is default: only the log shows, status is hidden", async () => {
			// Radix keeps the status panel mounted with `hidden`, so it must take
			// no layout space.
			await expect(moveLog(page)).toBeVisible();
			await expect(statusPanel(page)).toBeHidden();
		});

		await test.step("Status fills the content area, hiding the log", async () => {
			await openStatusTab(page);
			await expect(statusPanel(page)).toBeVisible();
			await expect(moveLog(page)).toBeHidden();

			// the active panel fills the tab area rather than half of it: the inner
			// section tracks its panel's height, so no dead space sits below it.
			const panelBox = await page.getByTestId("tab-panel-status").boundingBox();
			const innerBox = await statusPanel(page).boundingBox();
			expect(panelBox?.height).toBeGreaterThan(0);
			expect(innerBox?.height).toBeCloseTo(panelBox?.height ?? 0, 0);
		});

		await test.step("Switching back to Moves hides status again", async () => {
			await openMovesTab(page);
			await expect(moveLog(page)).toBeVisible();
			await expect(statusPanel(page)).toBeHidden();
		});
	});

	test("tallies each value's cut state on its wire tile", {
		tag: ["@scenario:status.counts", "@area:status", "@priority:should"],
	}, async ({ page }) => {
		await startTracking(page);
		// a successful dual cut of 9 cuts two copies (actor + target) → half-cut.
		await logDualCut(page, { target: "Player 2", wire: 9, outcome: "success" });
		// a solo cut of 5 removes its last copies → fully cut.
		await logSoloCut(page, { wire: 5 });

		// dismiss the composer sheet so the tab bar is reachable.
		await closeComposer(page);
		await openStatusTab(page);

		await expect(statusWire(page, 9)).toHaveAttribute("data-state", "half-cut");
		await expect(statusWire(page, 9)).toHaveAttribute("data-cut", "2");
		await expect(statusWire(page, 5)).toHaveAttribute("data-state", "full-cut");
		await expect(statusWire(page, 5)).toHaveAttribute("data-cut", "4");
		// an untouched value stays fully uncut.
		await expect(statusWire(page, 1)).toHaveAttribute("data-state", "uncut");
		await expect(statusWire(page, 1)).toHaveAttribute("data-cut", "0");
	});

	test("marks known holders on player cards and consumes them on a successful cut", {
		tag: ["@scenario:status.possession", "@area:status", "@priority:should"],
	}, async ({ page }) => {
		await test.step("Reveal two holders (info token + failed cut)", async () => {
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

			await closeComposer(page);
			await openStatusTab(page);
			// the failed cut reveals BOTH wires: Player 1 (the actor) still holds the
			// 6 they named on top of their token's 3, and Player 2 (the target) holds
			// the 8 it turned out to be.
			const p1 = statusPlayer(page, "Player 1");
			await expect(p1).toContainText("2 known wires");
			await expect(statusCell(p1, 3)).toHaveAttribute("data-held", "true");
			await expect(statusCell(p1, 6)).toHaveAttribute("data-held", "true");
			const p2 = statusPlayer(page, "Player 2");
			await expect(statusCell(p2, 8)).toHaveAttribute("data-held", "true");
			// nothing is known about the untouched players.
			await expect(statusPlayer(page, "Player 3")).toContainText(
				"no known wires",
			);
		});

		await test.step("A successful 3-cut consumes Player 1's known copy", async () => {
			await logDualCut(page, {
				actor: "Player 2",
				target: "Player 1",
				wire: 3,
				outcome: "success",
			});

			await closeComposer(page);
			await openStatusTab(page);
			const p1 = statusPlayer(page, "Player 1");
			await expect(statusCell(p1, 3)).toHaveAttribute("data-held", "false");
			await expect(p1).toContainText("1 known wire");
			// consuming the copy moves it from possession to the cut tally.
			await expect(statusWire(page, 3)).toHaveAttribute(
				"data-state",
				"half-cut",
			);
		});
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

		await closeComposer(page);
		await openStatusTab(page);
		// only the captured value is tallied, not the other named candidate.
		await expect(statusWire(page, 7)).toHaveAttribute("data-cut", "2");
		await expect(statusWire(page, 4)).toHaveAttribute("data-cut", "0");
	});

	test("marks a yellow holder on the player card's yellow chip", {
		tag: ["@scenario:status.yellow", "@area:status", "@priority:should"],
	}, async ({ page }) => {
		await startTracking(page);
		// a failed cut whose wire turns out to be yellow: Player 2 holds a yellow.
		await logDualCut(page, {
			target: "Player 2",
			wire: 2,
			outcome: { reveal: "yellow" },
		});

		await closeComposer(page);
		await openStatusTab(page);
		const p2 = statusPlayer(page, "Player 2");
		await expect(statusCell(p2, "yellow")).toHaveAttribute("data-held", "true");
		await expect(
			statusCell(statusPlayer(page, "Player 1"), "yellow"),
		).toHaveAttribute("data-held", "false");
	});
});
