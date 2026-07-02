import { expect, test } from "@playwright/test";
import {
	filterDialog,
	header,
	logDetector,
	logDualCut,
	logSoloCut,
	moveRow,
	openFilter,
	startTracking,
} from "../helpers/tracker";

// move-log filter: a header button opens a dialog that hides move types
// (successful dual cuts and/or solo cuts) from the displayed history without
// touching the underlying log.

test.describe("move-log filter", () => {
	// seed a history with one of each move the filter can touch plus an
	// unaffected one:
	// #1 successful dual cut, #2 failed dual cut, #3 solo cut, #4 detector.
	test.beforeEach(async ({ page }) => {
		await startTracking(page);
		await logDualCut(page, { target: "Player 2", wire: 9, outcome: "success" });
		await logDualCut(page, {
			target: "Player 1",
			wire: 4,
			outcome: { reveal: 8 },
		});
		await logSoloCut(page, { wire: 5 });
		await logDetector(page, {
			target: "Player 2",
			values: [6],
			outcome: "success",
		});
		await expect(moveRow(page, 4)).toBeVisible();
	});

	test("excludes successful dual cuts while keeping failed ones", {
		tag: [
			"@scenario:history.filter.exclude-dual-cut",
			"@area:history",
			"@priority:should",
		],
	}, async ({ page }) => {
		await openFilter(page);
		await filterDialog(page).getByTestId("filter-exclude-dual-cut").click();
		await filterDialog(page).getByTestId("filter-done").click();

		// the successful dual cut (#1) is hidden; the failed one (#2) and the solo
		// cut (#3) remain.
		await expect(moveRow(page, 1)).toHaveCount(0);
		await expect(moveRow(page, 2)).toBeVisible();
		await expect(moveRow(page, 3)).toBeVisible();
	});

	test("excludes solo cuts", {
		tag: [
			"@scenario:history.filter.exclude-solo-cut",
			"@area:history",
			"@priority:should",
		],
	}, async ({ page }) => {
		await openFilter(page);
		await filterDialog(page).getByTestId("filter-exclude-solo-cut").click();
		await filterDialog(page).getByTestId("filter-done").click();

		await expect(moveRow(page, 3)).toHaveCount(0);
		await expect(moveRow(page, 1)).toBeVisible();
		await expect(moveRow(page, 2)).toBeVisible();
	});

	test("the shortcut excludes both, and reset restores everything", {
		tag: [
			"@scenario:history.filter.exclude-both",
			"@scenario:history.filter.reset",
			"@area:history",
			"@priority:should",
		],
	}, async ({ page }) => {
		await openFilter(page);
		await filterDialog(page).getByTestId("filter-exclude-both").click();
		await filterDialog(page).getByTestId("filter-done").click();

		// both a successful dual cut (#1) and the solo cut (#3) drop out; the
		// failed dual cut (#2) and the successful detector (#4) — which the
		// filter never touches — stay visible.
		await expect(moveRow(page, 1)).toHaveCount(0);
		await expect(moveRow(page, 3)).toHaveCount(0);
		await expect(moveRow(page, 2)).toBeVisible();
		await expect(moveRow(page, 4)).toBeVisible();
		// the active filter is flagged on the header trigger.
		await expect(header(page).getByTestId("filter-active")).toBeVisible();

		await openFilter(page);
		await filterDialog(page).getByTestId("filter-reset").click();
		await filterDialog(page).getByTestId("filter-done").click();

		// everything returns and the active flag clears.
		await expect(moveRow(page, 1)).toBeVisible();
		await expect(moveRow(page, 3)).toBeVisible();
		await expect(header(page).getByTestId("filter-active")).toHaveCount(0);
	});
});
