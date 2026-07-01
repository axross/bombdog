import { expect, test } from "@playwright/test";
import {
	chooseInComposer,
	composer,
	moveLog,
	moveRow,
	pickTarget,
	startTracking,
} from "../helpers/tracker";

// Full round-trip: configure → log → edit → undo/redo → persist across reload →
// reset. The reload assertion is the headline: state must survive in IndexedDB.
test("logs, edits, undoes/redoes, persists across reload, and resets", async ({
	page,
}) => {
	await test.step("Start tracking with default players", async () => {
		await startTracking(page);
		await expect(moveLog(page).getByText(/No moves yet/)).toBeVisible();
	});

	await test.step("Log a dual cut (Player 1 → Player 2, wire 9, success)", async () => {
		await pickTarget(page, "Player 2");
		await composer(page).getByTestId("wire-9").click();
		await composer(page).getByTestId("outcome-success").click();
		await composer(page).getByTestId("log-move").click();
	});

	await test.step("Verify the move appears with a success outcome", async () => {
		await expect(moveRow(page, 1)).toBeVisible();
		await expect(moveRow(page, 1).getByTestId("badge")).toHaveAttribute(
			"data-outcome",
			"success",
		);
	});

	await test.step("Edit move #1: flip to fail and record actual wire 8", async () => {
		await moveRow(page, 1).getByTestId("edit").click();
		const editor = page.getByTestId("move-editor");
		await editor.getByTestId("outcome-fail").click();
		// The fail opens a dialog to pick the wire's actual value.
		await page.getByTestId("reveal-dialog").getByTestId("reveal-8").click();
		await editor.getByTestId("save").click();
		const badge = moveRow(page, 1).getByTestId("badge");
		await expect(badge).toHaveAttribute("data-outcome", "fail");
		await expect(badge).toHaveAttribute("data-revealed", "8");
	});

	await test.step("Log a second move (solo cut, wire 5)", async () => {
		await composer(page).getByTestId("tab-solo-cut").click();
		await composer(page).getByTestId("wire-5").click();
		await composer(page).getByTestId("log-move").click();
		await expect(moveRow(page, 2)).toBeVisible();
	});

	await test.step("Undo twice → empty, then redo once → move #1 back", async () => {
		await composer(page).getByTestId("undo").click();
		await composer(page).getByTestId("undo").click();
		await expect(moveLog(page).getByText(/No moves yet/)).toBeVisible();

		await composer(page).getByTestId("redo").click();
		await expect(moveRow(page, 1)).toBeVisible();
		await expect(moveRow(page, 1).getByTestId("badge")).toHaveAttribute(
			"data-outcome",
			"fail",
		);
	});

	await test.step("Reload: state must persist from IndexedDB", async () => {
		await page.reload();
		await expect(moveRow(page, 1)).toBeVisible();
		const badge = moveRow(page, 1).getByTestId("badge");
		await expect(badge).toHaveAttribute("data-outcome", "fail");
		await expect(badge).toHaveAttribute("data-revealed", "8");
	});

	await test.step("Reset clears everything and returns to setup", async () => {
		await page.getByTestId("reset").click();
		await page.getByTestId("reset-dialog").getByTestId("reset-confirm").click();
		await expect(page.getByTestId("setup").getByTestId("start")).toBeVisible();
	});
});

// Regression: logging a move must reset the whole composer (including the target
// segmented control) so the next move can be entered and logged cleanly.
test("re-enables Log move for the next dual cut without re-toggling target", async ({
	page,
}) => {
	await test.step("Start tracking", async () => {
		await startTracking(page);
	});

	await test.step("Log a first dual cut (Player 1 → Player 2)", async () => {
		await pickTarget(page, "Player 2");
		await composer(page).getByTestId("wire-9").click();
		await composer(page).getByTestId("outcome-success").click();
		await composer(page).getByTestId("log-move").click();
		await expect(moveRow(page, 1)).toBeVisible();
	});

	await test.step("Reset actor to Player 1 and pick the same target again", async () => {
		await chooseInComposer(page, "acting", "Player 1");
		await pickTarget(page, "Player 2");
		await composer(page).getByTestId("wire-3").click();
		await composer(page).getByTestId("outcome-success").click();
	});

	await test.step("Log move is enabled without re-toggling the target", async () => {
		await expect(composer(page).getByTestId("log-move")).toBeEnabled();
		await composer(page).getByTestId("log-move").click();
		await expect(moveRow(page, 2)).toBeVisible();
	});
});

// Failing a cut records the wire's actual value via a popup.
test("records the revealed wire when a cut fails", async ({ page }) => {
	await test.step("Start tracking", async () => {
		await startTracking(page);
	});

	await test.step("Log a dual cut and mark it failed", async () => {
		await pickTarget(page, "Player 2");
		await composer(page).getByTestId("wire-9").click();
		// Fail is disabled for logging until the actual wire is chosen.
		await expect(composer(page).getByTestId("log-move")).toBeDisabled();
		await composer(page).getByTestId("outcome-fail").click();
	});

	await test.step("Pick the actual wire (Yellow) in the popup", async () => {
		await page
			.getByTestId("reveal-dialog")
			.getByTestId("reveal-yellow")
			.click();
		// The dialog closes and the choice shows on the Fail button.
		await expect(page.getByTestId("reveal-dialog")).toBeHidden();
		await expect(composer(page).getByTestId("outcome-fail")).toContainText(
			"(Y)",
		);
	});

	await test.step("Log the move and see the revealed value in the history", async () => {
		await composer(page).getByTestId("log-move").click();
		const badge = moveRow(page, 1).getByTestId("badge");
		await expect(badge).toHaveAttribute("data-outcome", "fail");
		await expect(badge).toHaveAttribute("data-revealed", "Y");
	});
});

// The composer can collapse to give the move history a larger view area.
test("collapses and expands the composer", async ({ page }) => {
	await test.step("Start tracking", async () => {
		await startTracking(page);
	});

	await test.step("Collapse hides the form inputs", async () => {
		await expect(composer(page).getByTestId("acting")).toBeVisible();
		await composer(page).getByTestId("toggle-composer").click();
		await expect(composer(page).getByTestId("acting")).toBeHidden();
		// Undo/redo stay available; Log move hides along with the form.
		await expect(composer(page).getByTestId("undo")).toBeVisible();
		await expect(composer(page).getByTestId("log-move")).toBeHidden();
	});

	await test.step("Expand restores the form and Log move", async () => {
		await composer(page).getByTestId("toggle-composer").click();
		await expect(composer(page).getByTestId("acting")).toBeVisible();
		await expect(composer(page).getByTestId("log-move")).toBeVisible();
	});
});
