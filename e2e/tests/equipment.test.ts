import { expect, test } from "@playwright/test";
import {
	closeComposer,
	logDualCut,
	logEquipment,
	moveRow,
	openMovesTab,
	openStatusTab,
	startTracking,
	statusRow,
} from "../helpers/tracker";

// the structured equipment cards: a Post-it reveals one wire of its target and
// a General Radar reveals who holds an announced value. both feed the Status
// view's possession column, unlike the free-text Misc cards.

test.describe("structured equipment", () => {
	test("a Post-it counts its target as a holder until the wire is cut", {
		tag: [
			"@scenario:log.equipment.post-it",
			"@area:logging",
			"@priority:should",
		],
	}, async ({ page }) => {
		await startTracking(page);

		await test.step("Log a Post-it revealing Player 2's 7", async () => {
			await logEquipment(page, {
				equipment: "Post-it (4)",
				target: "Player 2",
				wire: 7,
			});
			await closeComposer(page);

			// the row reads actor → target with the revealed wire's chip.
			const row = moveRow(page, 1);
			await expect(row).toContainText("Player 1");
			await expect(row).toContainText("Player 2");
			await expect(row).toContainText("Post-it (4)");
			await expect(row.getByRole("img", { name: "Wire 7" })).toBeVisible();
		});

		await test.step("Status counts Player 2 as a known 7 holder", async () => {
			await openStatusTab(page);
			await expect(
				statusRow(page, 7).getByTestId("status-holder"),
			).toHaveAttribute("data-player", "Player 2");
			await expect(
				statusRow(page, 7).getByTestId("status-count"),
			).toHaveAttribute("data-revealed", "1");
		});

		await test.step("A successful 7-cut consumes the revealed copy", async () => {
			await openMovesTab(page);
			await logDualCut(page, {
				target: "Player 2",
				wire: 7,
				outcome: "success",
			});
			await closeComposer(page);

			await openStatusTab(page);
			await expect(statusRow(page, 7).getByTestId("status-holder")).toHaveCount(
				0,
			);
			await expect(
				statusRow(page, 7).getByTestId("status-count"),
			).toHaveAttribute("data-cut", "2");
		});
	});

	test("a General Radar counts every declared holder — or no one", {
		tag: ["@scenario:log.equipment.radar", "@area:logging", "@priority:should"],
	}, async ({ page }) => {
		await startTracking(page);

		await test.step("Log a radar for 4 that two players declared", async () => {
			await logEquipment(page, {
				equipment: "General Radar (8)",
				wire: 4,
				holders: ["Player 2", "Player 3"],
			});
			await closeComposer(page);

			const row = moveRow(page, 1);
			await expect(row).toContainText("General Radar (8)");
			await expect(row.getByRole("img", { name: "Wire 4" })).toBeVisible();
			await expect(row.getByTestId("equipment-holders")).toHaveText(
				"Player 2, Player 3",
			);
		});

		await test.step("Status counts both declared holders of the 4", async () => {
			await openStatusTab(page);
			const holders = statusRow(page, 4).getByTestId("status-holder");
			await expect(holders).toHaveCount(2);
			await expect(holders.nth(0)).toHaveAttribute("data-player", "Player 2");
			await expect(holders.nth(1)).toHaveAttribute("data-player", "Player 3");
			await expect(
				statusRow(page, 4).getByTestId("status-count"),
			).toHaveAttribute("data-revealed", "2");
		});

		await test.step("Log a radar for 6 that no one declared", async () => {
			await openMovesTab(page);
			await logEquipment(page, {
				equipment: "General Radar (8)",
				wire: 6,
				holders: [],
			});
			await closeComposer(page);

			await expect(
				moveRow(page, 2).getByTestId("equipment-holders"),
			).toHaveText("no one");
		});

		await test.step("Status records no possession for the empty radar", async () => {
			await openStatusTab(page);
			await expect(statusRow(page, 6).getByTestId("status-holder")).toHaveCount(
				0,
			);
			await expect(
				statusRow(page, 6).getByTestId("status-count"),
			).toHaveAttribute("data-revealed", "0");
		});
	});
});
