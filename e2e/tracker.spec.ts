import { expect, type Locator, type Page, test } from "@playwright/test";

async function pickOption(
	page: Page,
	scope: Locator,
	field: string,
	option: string,
) {
	await scope.getByRole("combobox", { name: field }).click();
	await page.getByRole("option", { name: option, exact: true }).click();
}

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
	await composer.getByRole("tab", { name: "Solo cut" }).click();
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

// Regression: after logging a move the target Select must reset with the rest
// of the form. It used to flip to uncontrolled mode and keep a stale value, so
// "Log move" stayed disabled for the next move until the target was re-toggled.
test("re-enables Log move for the next dual cut without re-toggling target", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Start tracking" }).click();

	const log = page.getByRole("region", { name: "Move history" });
	const composer = page.getByRole("form", { name: "Log a move" });

	// Move 1: Player 1 → Player 2.
	await pickOption(page, composer, "Target", "Player 2");
	await composer.getByRole("radio", { name: "Wire 9" }).click();
	await composer.getByRole("radio", { name: /Success/ }).click();
	await composer.getByRole("button", { name: "Log move" }).click();
	await expect(log.getByText("#1")).toBeVisible();

	// Move 2: reset the actor to Player 1 (so Player 2 is a normal target again)
	// and pick the same target as before. With the old bug this left the button
	// disabled because the Select still held the previous, uncommitted value.
	await pickOption(page, composer, "Acting", "Player 1");
	await pickOption(page, composer, "Target", "Player 2");
	await composer.getByRole("radio", { name: "Wire 3" }).click();
	await composer.getByRole("radio", { name: /Success/ }).click();

	await expect(
		composer.getByRole("button", { name: "Log move" }),
	).toBeEnabled();
	await composer.getByRole("button", { name: "Log move" }).click();
	await expect(log.getByText("#2")).toBeVisible();
});
