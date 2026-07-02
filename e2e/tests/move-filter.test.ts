import { expect, test } from "@playwright/test";
import {
	filterDialog,
	logDoubleDetector,
	logDualCut,
	logSoloCut,
	moveLog,
	moveRow,
	openFilter,
	startTracking,
} from "../helpers/tracker";

// Move-log filter: a fixed toolbar button opens a dialog that hides move types
// (successful dual cuts and/or solo cuts) from the displayed history without
// touching the underlying log.

test.describe("move-log filter", () => {
	// Seed a history with one of each move the filter can touch plus an
	// unaffected one:
	// #1 successful dual cut, #2 failed dual cut, #3 solo cut, #4 double detector.
	test.beforeEach(async ({ page }) => {
		await startTracking(page);
		await logDualCut(page, { target: "Player 2", wire: 9, outcome: "success" });
		await logDualCut(page, {
			target: "Player 1",
			wire: 4,
			outcome: { reveal: 8 },
		});
		await logSoloCut(page, { wire: 5 });
		await logDoubleDetector(page, {
			target: "Player 2",
			wire: 6,
			outcome: "success",
		});
		await expect(moveRow(page, 4)).toBeVisible();
	});

	test("excludes successful dual cuts while keeping failed ones", async ({
		page,
	}) => {
		await openFilter(page);
		await filterDialog(page).getByTestId("filter-exclude-dual-cut").click();
		await filterDialog(page).getByTestId("filter-done").click();

		// The successful dual cut (#1) is hidden; the failed one (#2) and the solo
		// cut (#3) remain.
		await expect(moveRow(page, 1)).toHaveCount(0);
		await expect(moveRow(page, 2)).toBeVisible();
		await expect(moveRow(page, 3)).toBeVisible();
	});

	test("excludes solo cuts", async ({ page }) => {
		await openFilter(page);
		await filterDialog(page).getByTestId("filter-exclude-solo-cut").click();
		await filterDialog(page).getByTestId("filter-done").click();

		await expect(moveRow(page, 3)).toHaveCount(0);
		await expect(moveRow(page, 1)).toBeVisible();
		await expect(moveRow(page, 2)).toBeVisible();
	});

	test("the shortcut excludes both, and reset restores everything", async ({
		page,
	}) => {
		await openFilter(page);
		await filterDialog(page).getByTestId("filter-exclude-both").click();
		await filterDialog(page).getByTestId("filter-done").click();

		// Both a successful dual cut (#1) and the solo cut (#3) drop out; the
		// failed dual cut (#2) and the successful double detector (#4) — which the
		// filter never touches — stay visible.
		await expect(moveRow(page, 1)).toHaveCount(0);
		await expect(moveRow(page, 3)).toHaveCount(0);
		await expect(moveRow(page, 2)).toBeVisible();
		await expect(moveRow(page, 4)).toBeVisible();
		// The active filter is flagged on the toolbar trigger.
		await expect(moveLog(page).getByTestId("filter-active")).toBeVisible();

		await openFilter(page);
		await filterDialog(page).getByTestId("filter-reset").click();
		await filterDialog(page).getByTestId("filter-done").click();

		// Everything returns and the active flag clears.
		await expect(moveRow(page, 1)).toBeVisible();
		await expect(moveRow(page, 3)).toBeVisible();
		await expect(moveLog(page).getByTestId("filter-active")).toHaveCount(0);
	});
});
