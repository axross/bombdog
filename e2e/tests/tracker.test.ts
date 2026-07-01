import { expect, test } from "@playwright/test";
import {
	chooseInComposer,
	composer,
	moveLog,
	moveRow,
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
		await chooseInComposer(page, "target", "Player 2");
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

	await test.step("Edit move #1: flip the outcome to fail", async () => {
		await moveRow(page, 1).getByTestId("edit").click();
		const editor = page.getByTestId("move-editor");
		await editor.getByTestId("outcome-fail").click();
		await editor.getByTestId("save").click();
		await expect(moveRow(page, 1).getByTestId("badge")).toHaveAttribute(
			"data-outcome",
			"fail",
		);
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
		await expect(moveRow(page, 1).getByTestId("badge")).toHaveAttribute(
			"data-outcome",
			"fail",
		);
	});

	await test.step("Reset clears everything and returns to setup", async () => {
		await page.getByTestId("reset").click();
		await page.getByTestId("reset-dialog").getByTestId("reset-confirm").click();
		await expect(page.getByTestId("setup").getByTestId("start")).toBeVisible();
	});
});

// Regression: after logging a move the target Select must reset with the rest
// of the form. It used to flip to uncontrolled mode and keep a stale value, so
// "Log move" stayed disabled for the next move until the target was re-toggled.
test("re-enables Log move for the next dual cut without re-toggling target", async ({
	page,
}) => {
	await test.step("Start tracking", async () => {
		await startTracking(page);
	});

	await test.step("Log a first dual cut (Player 1 → Player 2)", async () => {
		await chooseInComposer(page, "target", "Player 2");
		await composer(page).getByTestId("wire-9").click();
		await composer(page).getByTestId("outcome-success").click();
		await composer(page).getByTestId("log-move").click();
		await expect(moveRow(page, 1)).toBeVisible();
	});

	await test.step("Reset actor to Player 1 and pick the same target again", async () => {
		await chooseInComposer(page, "acting", "Player 1");
		await chooseInComposer(page, "target", "Player 2");
		await composer(page).getByTestId("wire-3").click();
		await composer(page).getByTestId("outcome-success").click();
	});

	await test.step("Log move is enabled without re-toggling the target", async () => {
		await expect(composer(page).getByTestId("log-move")).toBeEnabled();
		await composer(page).getByTestId("log-move").click();
		await expect(moveRow(page, 2)).toBeVisible();
	});
});
