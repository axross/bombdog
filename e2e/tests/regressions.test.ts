import { expect, test } from "@playwright/test";
import {
	composer,
	logDualCut,
	moveRow,
	pickTarget,
	selectWire,
	setActor,
	setOutcome,
	startTracking,
} from "../helpers/tracker";
import { scn } from "../scenarios";

// regression: logging a move must reset the whole composer — including the
// target segmented control — so the next move can be entered and logged without
// re-toggling any field. (a controlled-Select bug once left Log move disabled
// until the target was re-tapped.)
test("re-enables Log move for the next dual cut without re-toggling target", {
	tag: scn("session.log-consecutive"),
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
