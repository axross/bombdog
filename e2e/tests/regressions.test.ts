import { expect, test } from "@playwright/test";
import {
	composer,
	logDualCut,
	logMove,
	moveRow,
	pickTarget,
	selectWire,
	setActor,
	setOutcome,
	startTracking,
} from "../helpers/tracker";

// regression: logging a move must reset the whole composer — including the
// target segmented control — so the next move can be entered and logged without
// re-toggling any field. (a controlled-Select bug once left Log move disabled
// until the target was re-tapped.)
test("re-enables Log move for the next dual cut without re-toggling target", {
	tag: [
		"@scenario:session.log-consecutive",
		"@area:session",
		"@priority:should",
	],
}, async ({ page }) => {
	await startTracking(page);

	await test.step("Log a first dual cut (Player 1 → Player 2)", async () => {
		await logDualCut(page, { target: "Player 2", wire: 9, outcome: "success" });
		await expect(moveRow(page, 1)).toBeVisible();
	});

	await test.step("Compose a second move reusing the same target", async () => {
		await setActor(page, "Player 1");
		await pickTarget(page, "Player 2");
		await selectWire(page, 3);
		await setOutcome(page, "success");
	});

	await test.step("Verify Log move is enabled without re-toggling the target", async () => {
		await expect(composer(page).getByTestId("log-move")).toBeEnabled();
		await composer(page).getByTestId("log-move").click();
		await expect(moveRow(page, 2)).toBeVisible();
	});
});

// pressing Log move with an incomplete move must flag the missing fields (rather
// than log nothing silently), and each field's flag must clear as it is filled.
test("flags incomplete composer fields on Log move, then logs once complete", {
	tag: ["@scenario:log.invalid-highlight", "@area:logging", "@priority:should"],
}, async ({ page }) => {
	await startTracking(page);
	const target = composer(page).getByTestId("highlight-target");
	const wire = composer(page).getByTestId("highlight-wire");
	const outcome = composer(page).getByTestId("highlight-outcome");

	await test.step("Press Log move with an empty dual cut", async () => {
		await logMove(page);
		// nothing is logged…
		await expect(moveRow(page, 1)).toBeHidden();
		// …and the incomplete fields are flagged (the actor defaults to the Captain).
		await expect(target).toHaveAttribute("data-invalid", "true");
		await expect(wire).toHaveAttribute("data-invalid", "true");
		await expect(outcome).toHaveAttribute("data-invalid", "true");
	});

	await test.step("Filling a field clears its own flag", async () => {
		await pickTarget(page, "Player 2");
		await expect(target).not.toHaveAttribute("data-invalid", "true");
		await expect(wire).toHaveAttribute("data-invalid", "true");
	});

	await test.step("Completing the move logs it", async () => {
		await selectWire(page, 9);
		await setOutcome(page, "success");
		await logMove(page);
		await expect(moveRow(page, 1)).toBeVisible();
	});
});
