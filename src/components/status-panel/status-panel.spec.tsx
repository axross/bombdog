import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useTrackerStore } from "@/lib/tracker-store";
import type { Move, Player } from "@/lib/types";
import { StatusPanel } from "./status-panel";

const players: Player[] = [
	{ id: "a", name: "Alice" },
	{ id: "b", name: "Bob" },
	{ id: "c", name: "Carol" },
];

function reset() {
	useTrackerStore.setState({
		players: [],
		captainIndex: 0,
		moves: [],
		infoTokens: {},
		redoStack: [],
		previousPlayers: [],
		previousCaptainIndex: 0,
	});
}

beforeEach(reset);
afterEach(reset);

/**
 * The wire-count tile for a given blue value.
 */
function tileFor(value: number): HTMLElement {
	const tile = screen
		.getAllByTestId("status-wire")
		.find((el) => el.getAttribute("data-value") === String(value));
	if (!tile) throw new Error(`no wire tile for ${value}`);
	return tile;
}

/**
 * The possession card for a given player name.
 */
function cardFor(name: string): HTMLElement {
	const card = screen
		.getAllByTestId("status-player")
		.find((el) => el.getAttribute("data-player") === name);
	if (!card) throw new Error(`no player card for ${name}`);
	return card;
}

/**
 * A card's chip for a given wire value ("yellow" or a blue number).
 */
function cellFor(card: HTMLElement, value: number | "yellow"): HTMLElement {
	const cell = within(card)
		.getAllByTestId("status-cell")
		.find((el) => el.getAttribute("data-value") === String(value));
	if (!cell) throw new Error(`no cell for ${value}`);
	return cell;
}

const dualCut9: Move = {
	id: "m1",
	seq: 1,
	at: 1,
	type: "dual-cut",
	actorId: "a",
	targetId: "b",
	value: 9,
	outcome: "success",
};

describe("<StatusPanel>", () => {
	describe("wire-count strip", () => {
		it("renders a tile per blue value 1–12, all uncut with no moves", () => {
			useTrackerStore.setState({ players });

			render(<StatusPanel />);

			const tiles = screen.getAllByTestId("status-wire");
			expect(tiles).toHaveLength(12);
			expect(tiles.map((t) => t.getAttribute("data-value"))).toEqual([
				"1",
				"2",
				"3",
				"4",
				"5",
				"6",
				"7",
				"8",
				"9",
				"10",
				"11",
				"12",
			]);
			for (const tile of tiles) {
				expect(tile).toHaveAttribute("data-state", "uncut");
			}
		});

		it("marks a pair-cut value half-cut, with its two surviving squares first", () => {
			useTrackerStore.setState({ players, moves: [dualCut9] });

			render(<StatusPanel />);

			const tile = tileFor(9);
			expect(tile).toHaveAttribute("data-state", "half-cut");
			expect(tile).toHaveAttribute("data-cut", "2");
			expect(tile).toHaveAttribute("data-uncut", "2");
			// the counts are announced, not conveyed by the squares alone.
			expect(within(tile).getByRole("img")).toHaveAccessibleName(
				"Wire 9: 2 of 4 cut",
			);
			// squares fill row-major: the in-play pair stays ahead of the cut pair.
			const fills = Array.from(tile.querySelectorAll("[data-fill]")).map((el) =>
				el.getAttribute("data-fill"),
			);
			expect(fills).toEqual(["in-play", "in-play", "cut", "cut"]);
		});

		it("marks a solo-cut value fully cut with every square hollow", () => {
			const solo5: Move = {
				id: "m1",
				seq: 1,
				at: 1,
				type: "solo-cut",
				actorId: "a",
				value: 5,
			};
			useTrackerStore.setState({ players, moves: [solo5] });

			render(<StatusPanel />);

			const tile = tileFor(5);
			expect(tile).toHaveAttribute("data-state", "full-cut");
			expect(within(tile).getByRole("img")).toHaveAccessibleName(
				"Wire 5: 4 of 4 cut",
			);
			const fills = Array.from(tile.querySelectorAll("[data-fill]")).map((el) =>
				el.getAttribute("data-fill"),
			);
			expect(fills).toEqual(["cut", "cut", "cut", "cut"]);
		});
	});

	describe("player possession cards", () => {
		it("renders a card per player in seat order, each with all 13 values", () => {
			useTrackerStore.setState({ players });

			render(<StatusPanel />);

			const cards = screen.getAllByTestId("status-player");
			expect(cards.map((c) => c.getAttribute("data-player"))).toEqual([
				"Alice",
				"Bob",
				"Carol",
			]);
			const values = within(cards[0])
				.getAllByTestId("status-cell")
				.map((el) => el.getAttribute("data-value"));
			expect(values).toEqual([
				"1",
				"2",
				"3",
				"4",
				"5",
				"6",
				"7",
				"8",
				"9",
				"10",
				"11",
				"12",
				"yellow",
			]);
		});

		it("summarises a player with nothing known as having no known wires", () => {
			useTrackerStore.setState({ players });

			render(<StatusPanel />);

			const card = cardFor("Alice");
			expect(card).toHaveTextContent("no known wires");
			for (const cell of within(card).getAllByTestId("status-cell")) {
				expect(cell).toHaveAttribute("data-held", "false");
			}
		});

		it("marks an info-token holder's value held and tallies it", () => {
			useTrackerStore.setState({ players, infoTokens: { c: 3 } });

			render(<StatusPanel />);

			const card = cardFor("Carol");
			expect(card).toHaveTextContent("1 known wire");
			const cell = cellFor(card, 3);
			expect(cell).toHaveAttribute("data-held", "true");
			expect(cell).toHaveAccessibleName("Wire 3: held");
			// no other value lights up, and no other player inherits the token.
			expect(cellFor(card, 4)).toHaveAttribute("data-held", "false");
			expect(cellFor(cardFor("Alice"), 3)).toHaveAttribute(
				"data-held",
				"false",
			);
		});

		it("marks both wires a failed cut reveals, pluralising the tally", () => {
			const failed: Move = {
				id: "m1",
				seq: 1,
				at: 1,
				type: "dual-cut",
				actorId: "a",
				targetId: "b",
				value: 6,
				outcome: "fail",
				revealed: 8,
			};
			useTrackerStore.setState({
				players,
				moves: [failed],
				infoTokens: { a: 2 },
			});

			render(<StatusPanel />);

			// Alice named the 6 (she must hold one) on top of her token's 2.
			const alice = cardFor("Alice");
			expect(alice).toHaveTextContent("2 known wires");
			expect(cellFor(alice, 6)).toHaveAttribute("data-held", "true");
			// Bob's pointed-at wire turned out to be an 8.
			expect(cellFor(cardFor("Bob"), 8)).toHaveAttribute("data-held", "true");
		});

		it("marks a yellow holder revealed by a failed cut", () => {
			const failedYellow: Move = {
				id: "m1",
				seq: 1,
				at: 1,
				type: "dual-cut",
				actorId: "a",
				targetId: "b",
				value: 2,
				outcome: "fail",
				revealed: "yellow",
			};
			useTrackerStore.setState({ players, moves: [failedYellow] });

			render(<StatusPanel />);

			const cell = cellFor(cardFor("Bob"), "yellow");
			expect(cell).toHaveAttribute("data-held", "true");
			expect(cell).toHaveAccessibleName("Yellow wire: held");
		});
	});
});
