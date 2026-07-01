import { expect, test } from "@playwright/test";
import {
	composer,
	gotoApp,
	logDualCut,
	moveLog,
	moveRow,
	startTracking,
} from "../helpers/tracker";

// Smoke tests: a handful of shallow checks that the app boots and its core
// loop (set up → log → persist → reset) is wired end to end. They are the
// first gate — if any fails, deeper happy-path tests aren't worth running.

test.describe("smoke", () => {
	test("boots to the setup screen", async ({ page }) => {
		await gotoApp(page);
		await expect(page.getByRole("heading", { name: "Bombdog" })).toBeVisible();
		await expect(page.getByTestId("setup").getByTestId("start")).toBeVisible();
	});

	test("starting a game opens the tracker with an empty history", async ({
		page,
	}) => {
		await startTracking(page);
		await expect(composer(page)).toBeVisible();
		await expect(moveLog(page).getByText(/No moves yet/)).toBeVisible();
	});

	test("logging a move adds it to the history", async ({ page }) => {
		await startTracking(page);
		await logDualCut(page, {
			target: "Player 2",
			wire: 9,
			outcome: "success",
		});
		await expect(moveRow(page, 1)).toBeVisible();
	});

	test("logged state survives a reload", async ({ page }) => {
		await startTracking(page);
		await logDualCut(page, {
			target: "Player 2",
			wire: 9,
			outcome: "success",
		});
		await expect(moveRow(page, 1)).toBeVisible();

		await page.reload();
		// IndexedDB rehydrates the move after the reload.
		await expect(moveRow(page, 1)).toBeVisible();
	});

	test("reset returns to the setup screen", async ({ page }) => {
		await startTracking(page);
		await page.getByTestId("reset").click();
		await page.getByTestId("reset-dialog").getByTestId("reset-confirm").click();
		await expect(page.getByTestId("setup").getByTestId("start")).toBeVisible();
	});
});
