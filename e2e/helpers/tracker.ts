import { expect, type Locator, type Page } from "@playwright/test";

/** Complete the setup screen with the default players and open the tracker. */
export async function startTracking(page: Page): Promise<void> {
	await page.goto("/");
	await page.getByTestId("setup").getByTestId("start").click();
	await expect(page.getByTestId("composer")).toBeVisible();
}

/** The bottom-half move composer. */
export function composer(page: Page): Locator {
	return page.getByTestId("composer");
}

/** The top-half move history. */
export function moveLog(page: Page): Locator {
	return page.getByTestId("move-log");
}

/** A logged move row by its sequence number. */
export function moveRow(page: Page, seq: number): Locator {
	return moveLog(page).locator(`[data-testid="move"][data-seq="${seq}"]`);
}

/**
 * Open a SelectField (by its test id, scoped to the composer) and choose an
 * option. Options are Radix-portaled with the `option` role, so they are
 * targeted by accessible name.
 */
export async function chooseInComposer(
	page: Page,
	fieldTestId: string,
	optionName: string,
): Promise<void> {
	await composer(page).getByTestId(fieldTestId).click();
	await page.getByRole("option", { name: optionName, exact: true }).click();
}
