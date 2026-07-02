import { expect, test } from "@playwright/test";
import {
	composer,
	logDetector,
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

// happy-path coverage of the main use cases a player runs through a session:
// configuring a roster, logging each of the four action types, watching the
// suggested actor advance, undo/redo, editing a logged move, and collapsing the
// composer.

test.describe("setup", () => {
	test("configures a two-player game (the minimum)", {
		tag: ["@scenario:setup.min-players", "@area:setup", "@priority:should"],
	}, async ({ page }) => {
		await startTrackingWith(page, { names: ["Uno", "Dos"] });
		await expect(composer(page)).toBeVisible();
		// the Captain (seat 1) takes the first turn, so the composer suggests Uno.
		await expect(composer(page).getByTestId("acting")).toContainText("Uno");
	});

	test("configures five players with names and a chosen Captain", {
		tag: [
			"@scenario:setup.max-players",
			"@scenario:setup.custom-names",
			"@scenario:setup.choose-captain",
			"@area:setup",
			"@priority:should",
		],
	}, async ({ page }) => {
		await startTrackingWith(page, {
			names: ["Ada", "Bo", "Cy", "Di", "Ed"],
			captainIndex: 2,
		});
		// the chosen Captain (Cy, seat 3) acts first, so the composer suggests Cy.
		await expect(composer(page).getByTestId("acting")).toContainText("Cy");
		// the custom names reached the composer's target control.
		await expect(
			composer(page).getByTestId("target").getByRole("radio", { name: "Ada" }),
		).toBeVisible();
		// the fifth seat (Ed) reached the composer too — the five-player maximum,
		// which a smaller roster would not show.
		await expect(
			composer(page).getByTestId("target").getByRole("radio", { name: "Ed" }),
		).toBeVisible();
	});
});

test.describe("logging each action type", () => {
	test("dual cut — success", {
		tag: ["@scenario:log.dual-cut.success", "@area:logging", "@priority:must"],
	}, async ({ page }) => {
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

	test("dual cut — fail records the actual wire", {
		tag: [
			"@scenario:log.dual-cut.fail-reveal",
			"@area:logging",
			"@priority:must",
		],
	}, async ({ page }) => {
		await startTracking(page);

		await test.step("Compose the cut and verify Log move is blocked until the reveal", async () => {
			await pickTarget(page, "Player 2");
			await selectWire(page, 9);
			await composer(page).getByTestId("outcome-fail").click();
			// a fail can't be logged until the actual wire value is recorded.
			await expect(composer(page).getByTestId("log-move")).toBeDisabled();
		});

		await test.step("Record the actual wire (8) in the popup", async () => {
			await page.getByTestId("reveal-dialog").getByTestId("reveal-8").click();
			await expect(page.getByTestId("reveal-dialog")).toBeHidden();
			// the chosen value is echoed on the Fail button and unblocks logging.
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

	test("solo cut — no target or outcome", {
		tag: ["@scenario:log.solo-cut", "@area:logging", "@priority:must"],
	}, async ({ page }) => {
		await startTracking(page);
		await logSoloCut(page, { wire: 5 });

		const row = moveRow(page, 1);
		await expect(row).toContainText("Solo cut");
		await expect(row.getByRole("img", { name: "Wire 5" })).toBeVisible();
		// solo cut has no success/fail badge.
		await expect(row.getByTestId("badge")).toHaveCount(0);
	});

	test('cut — logs a "?" (unknown) wire value', {
		tag: ["@scenario:log.unknown-wire", "@area:logging", "@priority:should"],
	}, async ({ page }) => {
		await startTracking(page);
		// the cut pads offer "?" for a wire whose value is unknown.
		await logSoloCut(page, { wire: "unknown" });

		const row = moveRow(page, 1);
		await expect(row).toContainText("Solo cut");
		await expect(row.getByRole("img", { name: "Unknown wire" })).toHaveText(
			"?",
		);
	});

	test("double detector — targeted, blue wires only", {
		tag: ["@scenario:log.double-detector", "@area:logging", "@priority:should"],
	}, async ({ page }) => {
		await startTracking(page);
		await composer(page).getByTestId("tab-detector").click();
		// detectors read blue values only: no Yellow option is offered.
		await expect(composer(page).getByTestId("wire-yellow")).toHaveCount(0);

		await logDetector(page, {
			target: "Player 2",
			values: [6],
			outcome: "success",
		});
		const row = moveRow(page, 1);
		// the default detector card names itself in the log.
		await expect(row).toContainText("Double Detector");
		await expect(row.getByRole("img", { name: "Wire 6" })).toBeVisible();
		await expect(row.getByTestId("badge")).toHaveAttribute(
			"data-outcome",
			"success",
		);
	});

	test("X or Y Ray — names two values against one wire", {
		tag: ["@scenario:log.detector.xy-ray", "@area:logging", "@priority:should"],
	}, async ({ page }) => {
		await startTracking(page);
		await logDetector(page, {
			card: "X or Y Ray (10)",
			target: "Player 2",
			values: [3, 11],
			outcome: "success",
		});

		const row = moveRow(page, 1);
		await expect(row).toContainText("X or Y Ray (10)");
		// both named values render as chips.
		await expect(row.getByRole("img", { name: "Wire 3" })).toBeVisible();
		await expect(row.getByRole("img", { name: "Wire 11" })).toBeVisible();
	});

	test("super detector — points at a whole stand", {
		tag: ["@scenario:log.detector.super", "@area:logging", "@priority:may"],
	}, async ({ page }) => {
		await startTracking(page);
		await composer(page).getByTestId("tab-detector").click();

		await logDetector(page, {
			card: "Super Detector (5)",
			target: "Player 2",
			values: [8],
			outcome: { reveal: 2 },
		});

		const row = moveRow(page, 1);
		await expect(row).toContainText("Super Detector (5)");
		const badge = row.getByTestId("badge");
		await expect(badge).toHaveAttribute("data-outcome", "fail");
		await expect(badge).toHaveAttribute("data-revealed", "2");
	});

	test("equipment — with a note", {
		tag: ["@scenario:log.equipment", "@area:logging", "@priority:should"],
	}, async ({ page }) => {
		await startTracking(page);
		await logEquipment(page, {
			equipment: "Rewinder (6)",
			note: "checked seat 4",
		});

		const row = moveRow(page, 1);
		await expect(row).toContainText("Rewinder (6)");
		await expect(row).toContainText("checked seat 4");
	});
});

test.describe("session flow", () => {
	test("the composer's suggested actor advances to the next seat after a move", {
		tag: ["@scenario:session.turn-advance", "@area:session", "@priority:must"],
	}, async ({ page }) => {
		await startTracking(page);
		// Captain (Player 1) starts, so the composer suggests Player 1.
		await expect(composer(page).getByTestId("acting")).toContainText(
			"Player 1",
		);

		await logDualCut(page, { target: "Player 2", wire: 4, outcome: "success" });
		// play passes clockwise, so the composer now suggests Player 2.
		await expect(composer(page).getByTestId("acting")).toContainText(
			"Player 2",
		);
	});

	test("logging equipment keeps the turn on the same actor", {
		tag: [
			"@scenario:session.equipment-no-advance",
			"@area:session",
			"@priority:should",
		],
	}, async ({ page }) => {
		await startTracking(page);
		// Captain (Player 1) starts a cut, passing the turn to Player 2.
		await logDualCut(page, { target: "Player 2", wire: 4, outcome: "success" });
		await expect(composer(page).getByTestId("acting")).toContainText(
			"Player 2",
		);

		// Player 2 uses equipment: it doesn't end the turn, so it stays on Player 2.
		await logEquipment(page, { equipment: "Post-it (4)" });
		await expect(composer(page).getByTestId("acting")).toContainText(
			"Player 2",
		);

		// the next cut finally passes the turn on to Player 3.
		await logDualCut(page, { target: "Player 1", wire: 7, outcome: "success" });
		await expect(composer(page).getByTestId("acting")).toContainText(
			"Player 3",
		);
	});

	test("off-turn equipment returns the suggestion to the turn-holder", {
		tag: [
			"@scenario:session.off-turn-equipment",
			"@area:session",
			"@priority:should",
		],
	}, async ({ page }) => {
		await startTracking(page);
		// Captain (Player 1) cuts, so the turn belongs to Player 2.
		await logDualCut(page, { target: "Player 2", wire: 4, outcome: "success" });
		await expect(composer(page).getByTestId("acting")).toContainText(
			"Player 2",
		);

		// Player 4 fires equipment off-turn (overriding the Acting dropdown). it
		// doesn't take the turn, so the suggestion snaps back to Player 2 — not to
		// Player 4 and not clockwise from it.
		await logEquipment(page, { actor: "Player 4", equipment: "Post-it (4)" });
		await expect(composer(page).getByTestId("acting")).toContainText(
			"Player 2",
		);
	});

	test("undo and redo walk the move stack; a new move clears redo", {
		tag: ["@scenario:session.undo-redo", "@area:session", "@priority:should"],
	}, async ({ page }) => {
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

	test("edits a logged move in place", {
		tag: ["@scenario:session.edit-move", "@area:session", "@priority:should"],
	}, async ({ page }) => {
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

	test("deletes a logged move from its edit panel", {
		tag: ["@scenario:session.delete-move", "@area:session", "@priority:should"],
	}, async ({ page }) => {
		await startTracking(page);

		await test.step("Log two solo cuts", async () => {
			await logSoloCut(page, { wire: 5 });
			await logSoloCut(page, { wire: 7 });
			await expect(moveRow(page, 1)).toBeVisible();
			await expect(moveRow(page, 2)).toBeVisible();
		});

		await test.step("Delete the first move from its edit panel", async () => {
			await moveRow(page, 1).getByTestId("edit").click();
			const editor = page.getByTestId("move-editor");
			await editor.getByTestId("delete").click();

			// the editor closes and the deleted row is gone; the other move remains.
			await expect(editor).toBeHidden();
			await expect(moveRow(page, 1)).toHaveCount(0);
			await expect(moveRow(page, 2)).toBeVisible();
		});
	});

	test("collapses and expands the composer", {
		tag: ["@scenario:session.collapse", "@area:session", "@priority:should"],
	}, async ({ page }) => {
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

	test("persists the full session across a reload", {
		tag: [
			"@scenario:persist.reload",
			"@scenario:log.dual-cut.fail-yellow",
			"@area:persistence",
			"@area:logging",
			"@priority:must",
			"@priority:may",
		],
	}, async ({ page }) => {
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
