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

/** The status row for a given blue value. */
function rowFor(value: number): HTMLElement {
	const row = screen
		.getAllByTestId("status-row")
		.find((el) => el.getAttribute("data-value") === String(value));
	if (!row) throw new Error(`no status row for ${value}`);
	return row;
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
	it("renders a row per blue value 1–12", () => {
		useTrackerStore.setState({ players });

		render(<StatusPanel />);

		const rows = screen.getAllByTestId("status-row");
		expect(rows).toHaveLength(12);
		expect(rows.map((r) => r.getAttribute("data-value"))).toEqual([
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
	});

	it("shows the cut count a successful dual cut produces", () => {
		useTrackerStore.setState({ players, moves: [dualCut9] });

		render(<StatusPanel />);

		const count = within(rowFor(9)).getByTestId("status-count");
		expect(count).toHaveAttribute("data-cut", "2");
		expect(count).toHaveAttribute("data-revealed", "0");
		expect(count).toHaveAttribute("data-uncut", "2");
		// the counts are announced, not conveyed by the pips alone.
		expect(count).toHaveAccessibleName("2 of 4 cut, 0 revealed and uncut");
		// two pips read as cut, the rest as hidden (no revealed copies here).
		const fills = Array.from(count.querySelectorAll("[data-fill]")).map((el) =>
			el.getAttribute("data-fill"),
		);
		expect(fills).toEqual(["cut", "cut", "hidden", "hidden"]);
	});

	it("shows a starting-info-token holder and its revealed pip", () => {
		useTrackerStore.setState({ players, infoTokens: { c: 3 } });

		render(<StatusPanel />);

		const row = rowFor(3);
		expect(within(row).getByTestId("status-holder")).toHaveAttribute(
			"data-player",
			"Carol",
		);
		// the token is an uncut-but-revealed copy: one revealed pip, none cut.
		const count = within(row).getByTestId("status-count");
		expect(count).toHaveAttribute("data-cut", "0");
		expect(count).toHaveAttribute("data-revealed", "1");
	});

	it("omits the yellow line until a yellow holder is known", () => {
		useTrackerStore.setState({ players, moves: [dualCut9] });

		render(<StatusPanel />);
		expect(screen.queryByTestId("status-yellow")).not.toBeInTheDocument();
	});

	it("lists yellow holders revealed by a failed cut", () => {
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

		const yellow = screen.getByTestId("status-yellow");
		expect(within(yellow).getByTestId("status-holder")).toHaveAttribute(
			"data-player",
			"Bob",
		);
	});
});
