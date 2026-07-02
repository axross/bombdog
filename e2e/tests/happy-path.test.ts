import { expect, test } from "@playwright/test";
import {
	composer,
	logDoubleDetector,
	logDualCut,
	logEquipment,
	logSoloCut,
	moveLog,
	moveRow,
	pickTarget,
	selectWire,
	startTracking,
	startTrackingWith,
} from "../helpers/tracker";

// Happy-path coverage of the main use cases a player runs through a session:
// configuring a roster, logging each of the four action types, watching the
// suggested actor advance, undo/redo, editing a logged move, and collapsing the
// composer.

test.describe("setup", () => {
	test("configures a two-player game (the minimum)", async ({ page }) => {
		await startTrackingWith(page, { names: ["Uno", "Dos"] });
		await expect(composer(page)).toBeVisible();
		// The Captain (seat 1) takes the first turn, so the composer suggests Uno.
		await expect(composer(page).getByTestId("acting")).toContainText("Uno");
	});

	test("configures five players with names and a chosen Captain", async ({
		page,
	}) => {
		await startTrackingWith(page, {
			names: ["Ada", "Bo", "Cy", "Di", "Ed"],
			captainIndex: 2,
		});
		// The chosen Captain (Cy, seat 3) acts first, so the composer suggests Cy.
		await expect(composer(page).getByTestId("acting")).toContainText("Cy");
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

		await test.step("Compose the cut and verify Log move is blocked until the reveal", async () => {
			await pickTarget(page, "Player 2");
			await selectWire(page, 9);
			await composer(page).getByTestId("outcome-fail").click();
			// A fail can't be logged until the actual wire value is recorded.
			await expect(composer(page).getByTestId("log-move")).toBeDisabled();
		});

		await test.step("Record the actual wire (8) in the popup", async () => {
			await page.getByTestId("reveal-dialog").getByTestId("reveal-8").click();
			await expect(page.getByTestId("reveal-dialog")).toBeHidden();
			// The chosen value is echoed on the Fail button and unblocks logging.
			await expect(composer(page).getByTestId("outcome-fail")).toContainText(
				"(8)",
			);
			await expect(composer(page).getByTestId("log-move")).toBeEnabled();
		});

		await test.step("Log it and verify the revealed value in the history", async () => {
			await composer(page).getByTestId("log-move").click();
			const badge = moveRow(page, 1).getByTestId("badge");
			await expect(badge).toHaveAttribute("data-outcome", "fail");
			await expect(badge).toHaveAttribute("data-revealed", "8");
		});
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
	test("the composer's suggested actor advances to the next seat after a move", async ({
		page,
	}) => {
		await startTracking(page);
		// Captain (Player 1) starts, so the composer suggests Player 1.
		await expect(composer(page).getByTestId("acting")).toContainText(
			"Player 1",
		);

		await logDualCut(page, { target: "Player 2", wire: 4, outcome: "success" });
		// Play passes clockwise, so the composer now suggests Player 2.
		await expect(composer(page).getByTestId("acting")).toContainText(
			"Player 2",
		);
	});

	test("undo and redo walk the move stack; a new move clears redo", async ({
		page,
	}) => {
		await startTracking(page);

		await test.step("Log two moves", async () => {
			await logDualCut(page, {
				target: "Player 2",
				wire: 9,
				outcome: "success",
			});
			await logSoloCut(page, { wire: 5 });
			await expect(moveRow(page, 2)).toBeVisible();
		});

		await test.step("Undo both back to empty", async () => {
			await composer(page).getByTestId("undo").click();
			await composer(page).getByTestId("undo").click();
			await expect(moveLog(page).getByText(/No moves yet/)).toBeVisible();
		});

		await test.step("Redo and verify only the first move returns", async () => {
			await composer(page).getByTestId("redo").click();
			await expect(moveRow(page, 1)).toBeVisible();
			await expect(moveRow(page, 2)).toHaveCount(0);
		});

		await test.step("Log a fresh move and verify redo is cleared", async () => {
			await logSoloCut(page, { wire: 7 });
			await expect(moveRow(page, 2)).toBeVisible();
			await expect(composer(page).getByTestId("redo")).toBeDisabled();
		});
	});

	test("edits a logged move in place", async ({ page }) => {
		await startTracking(page);

		await test.step("Log a successful dual cut", async () => {
			await logDualCut(page, {
				target: "Player 2",
				wire: 9,
				outcome: "success",
			});
			await expect(moveRow(page, 1).getByTestId("badge")).toHaveAttribute(
				"data-outcome",
				"success",
			);
		});

		await test.step("Edit it to a failed cut revealing wire 8", async () => {
			await moveRow(page, 1).getByTestId("edit").click();
			const editor = page.getByTestId("move-editor");
			await editor.getByTestId("outcome-fail").click();
			await page.getByTestId("reveal-dialog").getByTestId("reveal-8").click();
			await editor.getByTestId("save").click();

			const badge = moveRow(page, 1).getByTestId("badge");
			await expect(badge).toHaveAttribute("data-outcome", "fail");
			await expect(badge).toHaveAttribute("data-revealed", "8");
		});
	});

	test("collapses and expands the composer", async ({ page }) => {
		await startTracking(page);

		await test.step("Collapse and verify the form and Log move hide while undo/redo stay", async () => {
			await expect(composer(page).getByTestId("acting")).toBeVisible();
			await composer(page).getByTestId("toggle-composer").click();
			await expect(composer(page).getByTestId("acting")).toBeHidden();
			await expect(composer(page).getByTestId("undo")).toBeVisible();
			await expect(composer(page).getByTestId("log-move")).toBeHidden();
		});

		await test.step("Expand and verify the form and Log move return", async () => {
			await composer(page).getByTestId("toggle-composer").click();
			await expect(composer(page).getByTestId("acting")).toBeVisible();
			await expect(composer(page).getByTestId("log-move")).toBeVisible();
		});
	});

	test("persists the full session across a reload", async ({ page }) => {
		await startTracking(page);

		await test.step("Log a failed cut and a solo cut", async () => {
			await logDualCut(page, {
				target: "Player 2",
				wire: 9,
				outcome: { reveal: "yellow" },
			});
			await logSoloCut(page, { wire: 5 });
		});

		await test.step("Reload and confirm both moves rehydrate from IndexedDB", async () => {
			await page.reload();
			await expect(moveRow(page, 1).getByTestId("badge")).toHaveAttribute(
				"data-revealed",
				"Y",
			);
			await expect(moveRow(page, 2)).toBeVisible();
		});
	});
});
