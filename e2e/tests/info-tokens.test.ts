import { expect, test } from "@playwright/test";
import {
	editInfoToken,
	gotoApp,
	openStartingInfoEditor,
	placeInfoToken,
	saveStartingInfo,
	skipInfoTokens,
	startFromSetup,
	startingInfo,
} from "../helpers/tracker";

// starting info tokens: at game start (in most missions) each player marks one
// of their blue wires with an info token, revealing it. these tests cover
// capturing them at setup, showing them in the tracker, and skipping the phase.

test.describe("starting info tokens", () => {
	test("places starting info tokens and shows them in the tracker", {
		tag: ["@scenario:setup.info-tokens", "@area:setup", "@priority:should"],
	}, async ({ page }) => {
		await gotoApp(page);
		// default roster (Player 1…4); seat 0 marks wire 9, seat 2 marks wire 4.
		await placeInfoToken(page, 0, 9);
		await placeInfoToken(page, 2, 4);
		await startFromSetup(page);

		const strip = startingInfo(page);
		await expect(strip).toBeVisible();
		await expect(strip.getByTestId("starting-info-token")).toHaveCount(2);
		await expect(
			strip
				.locator('[data-player="Player 1"]')
				.getByRole("img", { name: "Wire 9" }),
		).toBeVisible();
		await expect(
			strip
				.locator('[data-player="Player 3"]')
				.getByRole("img", { name: "Wire 4" }),
		).toBeVisible();

		// the tokens persist across a reload (IndexedDB rehydration).
		await page.reload();
		await expect(
			startingInfo(page).getByTestId("starting-info-token"),
		).toHaveCount(2);
	});

	test("edits a starting info token from the tracker", {
		tag: [
			"@scenario:session.edit-info-tokens",
			"@area:session",
			"@priority:should",
		],
	}, async ({ page }) => {
		await gotoApp(page);
		// seat 0 marks wire 9, seat 2 marks wire 4.
		await placeInfoToken(page, 0, 9);
		await placeInfoToken(page, 2, 4);
		await startFromSetup(page);

		const strip = startingInfo(page);
		const player1 = strip.locator('[data-player="Player 1"]');
		await expect(player1.getByRole("img", { name: "Wire 9" })).toBeVisible();

		// correct Player 1's token from 9 to 2; Player 3's stays untouched.
		await openStartingInfoEditor(page);
		await editInfoToken(page, "Player 1", 2);
		await saveStartingInfo(page);

		await expect(player1.getByRole("img", { name: "Wire 2" })).toBeVisible();
		await expect(
			strip
				.locator('[data-player="Player 3"]')
				.getByRole("img", { name: "Wire 4" }),
		).toBeVisible();

		// the correction persists across a reload (IndexedDB rehydration).
		await page.reload();
		await expect(
			startingInfo(page)
				.locator('[data-player="Player 1"]')
				.getByRole("img", { name: "Wire 2" }),
		).toBeVisible();
	});

	test("skips the starting info token phase", {
		tag: [
			"@scenario:setup.skip-info-tokens",
			"@area:setup",
			"@priority:should",
		],
	}, async ({ page }) => {
		await gotoApp(page);
		// ticking skip removes the per-player pads.
		await skipInfoTokens(page);
		await expect(page.getByTestId("info-token-0")).toHaveCount(0);
		await startFromSetup(page);

		// no starting-info strip when the phase was skipped.
		await expect(startingInfo(page)).toHaveCount(0);
	});
});
