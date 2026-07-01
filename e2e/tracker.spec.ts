import { expect, test } from "@playwright/test";

// Full round-trip: configure → log → edit → undo/redo → persist across reload →
// reset. The reload assertion is the headline: state must survive in IndexedDB.
test("logs, edits, undoes/redoes, persists across reload, and resets", async ({
	page,
}) => {
	await page.goto("/");

	// --- Setup (defaults: 3 players, Player 1 is Captain) ---
	await page.getByRole("button", { name: "Start tracking" }).click();

	const log = page.getByRole("region", { name: "Move history" });
	const composer = page.getByRole("form", { name: "Log a move" });
	await expect(log.getByText(/No moves yet/)).toBeVisible();

	// --- Log a dual cut (Player 1 → Player 2, wire 9, success) ---
	await composer.getByRole("combobox", { name: "Target" }).click();
	await page.getByRole("option", { name: "Player 2" }).click();
	await composer.getByRole("radio", { name: "Wire 9" }).click();
	await composer.getByRole("radio", { name: /Success/ }).click();
	await composer.getByRole("button", { name: "Log move" }).click();

	await expect(log.getByText("#1")).toBeVisible();
	await expect(log.getByText(/success/)).toBeVisible();

	// --- Edit move #1: flip the outcome to fail ---
	await log.getByRole("button", { name: "Edit move #1" }).click();
	const dialog = page.getByRole("dialog", { name: /Edit move #1/ });
	await dialog.getByRole("radio", { name: /Fail/ }).click();
	await dialog.getByRole("button", { name: "Save" }).click();
	await expect(log.getByText(/fail/)).toBeVisible();

	// --- Log a second move (solo cut, wire 5) ---
	await composer.getByRole("radio", { name: "Solo cut" }).click();
	await composer.getByRole("radio", { name: "Wire 5" }).click();
	await composer.getByRole("button", { name: "Log move" }).click();
	await expect(log.getByText("#2")).toBeVisible();

	// --- Undo twice (empty), then redo once (dual cut back) ---
	await composer.getByRole("button", { name: /Undo/ }).click();
	await composer.getByRole("button", { name: /Undo/ }).click();
	await expect(log.getByText(/No moves yet/)).toBeVisible();

	await composer.getByRole("button", { name: /Redo/ }).click();
	await expect(log.getByText("#1")).toBeVisible();
	await expect(log.getByText(/fail/)).toBeVisible();

	// --- Reload: state must persist from IndexedDB ---
	await page.reload();
	const logAfter = page.getByRole("region", { name: "Move history" });
	await expect(logAfter.getByText("#1")).toBeVisible();
	await expect(logAfter.getByText(/fail/)).toBeVisible();

	// --- Reset: clears everything and returns to setup ---
	await page.getByRole("button", { name: "Reset" }).click();
	const resetDialog = page.getByRole("alertdialog");
	await resetDialog.getByRole("button", { name: "Reset" }).click();
	await expect(
		page.getByRole("button", { name: "Start tracking" }),
	).toBeVisible();
});
