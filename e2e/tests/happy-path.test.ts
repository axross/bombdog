import { expect, test } from "@playwright/test";
import {
	composer,
	header,
	logDoubleDetector,
	logDualCut,
	logEquipment,
	logSoloCut,
	moveLog,
	moveRow,
	startTracking,
	startTrackingWith,
} from "../helpers/tracker";

// Happy-path coverage of the main use cases a player runs through a session:
// configuring a roster, logging each of the four action types, watching the
// turn advance, undo/redo, editing a logged move, and collapsing the composer.

test.describe("setup", () => {
	test("configures a two-player game (the minimum)", async ({ page }) => {
		await startTrackingWith(page, { names: ["Uno", "Dos"] });
		await expect(composer(page)).toBeVisible();
		// The Captain (seat 1) takes the first turn.
		await expect(header(page)).toContainText("Uno");
	});

	test("configures five players with names and a chosen Captain", async ({
		page,
	}) => {
		await startTrackingWith(page, {
			names: ["Ada", "Bo", "Cy", "Di", "Ed"],
			captainIndex: 2,
		});
		// The chosen Captain (Cy, seat 3) acts first.
		await expect(header(page)).toContainText("Cy");
		// The custom names reached the composer's target control.
		await expect(
			composer(page).getByTestId("target").getByRole("radio", { name: "Ada" }),
		).toBeVisible();
	});
});

test.describe("logging each action type", () => {
	test("dual cut — success", async ({ page }) => {
		await startTracking(page);
		await logDualCut(page, { target: "Player 2", wire: 9, outcome: "success" });

		const row = moveRow(page, 1);
		await expect(row).toContainText("Player 1");
		await expect(row).toContainText("Player 2");
		await expect(row.getByTestId("badge")).toHaveAttribute(
			"data-outcome",
			"success",
		);
		await expect(row.getByRole("img", { name: "Wire 9" })).toBeVisible();
	});

	test("dual cut — fail records the actual wire", async ({ page }) => {
		await startTracking(page);
		await logDualCut(page, {
			target: "Player 2",
			wire: 9,
			outcome: { reveal: 8 },
		});

		const badge = moveRow(page, 1).getByTestId("badge");
		await expect(badge).toHaveAttribute("data-outcome", "fail");
		await expect(badge).toHaveAttribute("data-revealed", "8");
	});

	test("solo cut — no target or outcome", async ({ page }) => {
		await startTracking(page);
		await logSoloCut(page, { wire: 5 });

		const row = moveRow(page, 1);
		await expect(row).toContainText("Solo cut");
		await expect(row.getByRole("img", { name: "Wire 5" })).toBeVisible();
		// Solo cut has no success/fail badge.
		await expect(row.getByTestId("badge")).toHaveCount(0);
	});

	test("double detector — targeted, blue wires only", async ({ page }) => {
		await startTracking(page);
		await composer(page).getByTestId("tab-double-detector").click();
		// Detectors read blue values only: no Yellow option is offered.
		await expect(composer(page).getByTestId("wire-yellow")).toHaveCount(0);

		await logDoubleDetector(page, {
			target: "Player 2",
			wire: 6,
			outcome: "success",
		});
		const row = moveRow(page, 1);
		await expect(row).toContainText("Double detector");
		await expect(row.getByTestId("badge")).toHaveAttribute(
			"data-outcome",
			"success",
		);
	});

	test("equipment — with a note", async ({ page }) => {
		await startTracking(page);
		await logEquipment(page, {
			equipment: "Triple Detector (3)",
			note: "checked seat 4",
		});

		const row = moveRow(page, 1);
		await expect(row).toContainText("Triple Detector (3)");
		await expect(row).toContainText("checked seat 4");
	});
});

test.describe("session flow", () => {
	test("the turn indicator advances to the next seat after a move", async ({
		page,
	}) => {
		await startTracking(page);
		// Captain (Player 1) starts.
		await expect(header(page)).toContainText("Player 1");

		await logDualCut(page, { target: "Player 2", wire: 4, outcome: "success" });
		// Play passes clockwise to Player 2.
		await expect(header(page)).toContainText("Player 2");
	});

	test("undo and redo walk the move stack; a new move clears redo", async ({
		page,
	}) => {
		await startTracking(page);
		await logDualCut(page, { target: "Player 2", wire: 9, outcome: "success" });
		await logSoloCut(page, { wire: 5 });
		await expect(moveRow(page, 2)).toBeVisible();

		// Undo both moves back to empty.
		await composer(page).getByTestId("undo").click();
		await composer(page).getByTestId("undo").click();
		await expect(moveLog(page).getByText(/No moves yet/)).toBeVisible();

		// Redo restores the first move.
		await composer(page).getByTestId("redo").click();
		await expect(moveRow(page, 1)).toBeVisible();
		await expect(moveRow(page, 2)).toHaveCount(0);

		// Logging a fresh move invalidates the remaining redo history.
		await logSoloCut(page, { wire: 7 });
		await expect(moveRow(page, 2)).toBeVisible();
		await expect(composer(page).getByTestId("redo")).toBeDisabled();
	});

	test("edits a logged move in place", async ({ page }) => {
		await startTracking(page);
		await logDualCut(page, { target: "Player 2", wire: 9, outcome: "success" });
		await expect(moveRow(page, 1).getByTestId("badge")).toHaveAttribute(
			"data-outcome",
			"success",
		);

		await moveRow(page, 1).getByTestId("edit").click();
		const editor = page.getByTestId("move-editor");
		await editor.getByTestId("outcome-fail").click();
		await page.getByTestId("reveal-dialog").getByTestId("reveal-8").click();
		await editor.getByTestId("save").click();

		const badge = moveRow(page, 1).getByTestId("badge");
		await expect(badge).toHaveAttribute("data-outcome", "fail");
		await expect(badge).toHaveAttribute("data-revealed", "8");
	});

	test("collapses and expands the composer", async ({ page }) => {
		await startTracking(page);
		await expect(composer(page).getByTestId("acting")).toBeVisible();

		await composer(page).getByTestId("toggle-composer").click();
		await expect(composer(page).getByTestId("acting")).toBeHidden();
		// Undo/redo stay; Log move hides with the form.
		await expect(composer(page).getByTestId("undo")).toBeVisible();
		await expect(composer(page).getByTestId("log-move")).toBeHidden();

		await composer(page).getByTestId("toggle-composer").click();
		await expect(composer(page).getByTestId("acting")).toBeVisible();
		await expect(composer(page).getByTestId("log-move")).toBeVisible();
	});

	test("persists the full session across a reload", async ({ page }) => {
		await startTracking(page);
		await logDualCut(page, {
			target: "Player 2",
			wire: 9,
			outcome: { reveal: "yellow" },
		});
		await logSoloCut(page, { wire: 5 });

		await page.reload();
		await expect(moveRow(page, 1).getByTestId("badge")).toHaveAttribute(
			"data-revealed",
			"Y",
		);
		await expect(moveRow(page, 2)).toBeVisible();
	});
});
