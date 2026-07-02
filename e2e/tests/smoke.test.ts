import { expect, test } from "@playwright/test";
import {
	composer,
	gotoApp,
	logDualCut,
	moveLog,
	moveRow,
	startTracking,
	startTrackingWith,
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

	test("reset returns to the setup screen with the roster carried over", async ({
		page,
	}) => {
		await startTrackingWith(page, {
			names: ["Alice", "Bob", "Carol"],
			captainIndex: 1,
		});

		await page.getByTestId("reset").click();
		await page.getByTestId("reset-dialog").getByTestId("reset-confirm").click();

		const setup = page.getByTestId("setup");
		await expect(setup.getByTestId("start")).toBeVisible();
		// The previous player count, names, and Captain are pre-filled.
		await expect(setup.getByText("3")).toBeVisible();
		await expect(
			setup.getByRole("textbox", { name: "Name of player 1" }),
		).toHaveValue("Alice");
		await expect(
			setup.getByRole("textbox", { name: "Name of player 3" }),
		).toHaveValue("Carol");
		await expect(
			setup.getByRole("radio", { name: "Make player 2 the Captain" }),
		).toBeChecked();
	});
});
