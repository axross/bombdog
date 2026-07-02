import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useTrackerStore } from "@/lib/tracker-store";
import { EMPTY_MOVE_FILTER, type Move, type Player } from "@/lib/types";
import { MoveLog } from "./move-log";

const players: Player[] = [
	{ id: "a", name: "Alice" },
	{ id: "b", name: "Bob" },
];

const moves: Move[] = [
	{
		id: "1",
		seq: 1,
		at: 1,
		type: "dual-cut",
		actorId: "a",
		targetId: "b",
		value: 9,
		outcome: "success",
	},
	{
		id: "2",
		seq: 2,
		at: 2,
		type: "equipment",
		actorId: "b",
		equipment: "Radar",
	},
];

function seed(withMoves: Move[]) {
	useTrackerStore.setState({
		players,
		captainIndex: 0,
		moves: withMoves,
		redoStack: [],
	});
}

afterEach(() => {
	useTrackerStore.setState({
		players: [],
		captainIndex: 0,
		moves: [],
		redoStack: [],
	});
});

describe("<MoveLog>", () => {
	beforeEach(() => seed(moves));

	it("renders each logged move with actors and an accessible outcome", () => {
		render(<MoveLog filter={EMPTY_MOVE_FILTER} />);
		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(screen.getByText("Radar")).toBeInTheDocument();
		expect(screen.getByText(/success/)).toBeInTheDocument();
		expect(screen.getByLabelText("Wire 9")).toBeInTheDocument();
	});

	it("exposes an edit control per move", () => {
		render(<MoveLog filter={EMPTY_MOVE_FILTER} />);
		expect(
			screen.getByRole("button", { name: "Edit move #1" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Edit move #2" }),
		).toBeInTheDocument();
	});

	it("shows an empty state when there are no moves", () => {
		seed([]);
		render(<MoveLog filter={EMPTY_MOVE_FILTER} />);
		expect(screen.getByText(/No moves yet/)).toBeInTheDocument();
	});

	it("renders the detail of every action type", () => {
		seed([
			{
				id: "1",
				seq: 1,
				at: 1,
				type: "solo-cut",
				actorId: "a",
				value: "yellow",
			},
			{
				id: "2",
				seq: 2,
				at: 2,
				type: "double-detector",
				actorId: "b",
				targetId: "a",
				value: 6,
				outcome: "fail",
				revealed: "unknown",
			},
			{
				id: "3",
				seq: 3,
				at: 3,
				type: "dual-cut",
				actorId: "a",
				targetId: "b",
				value: 4,
				outcome: "fail",
				revealed: 8,
			},
			{
				id: "4",
				seq: 4,
				at: 4,
				type: "equipment",
				actorId: "b",
				equipment: "Radar",
				note: "seat 3 is empty",
			},
		]);
		render(<MoveLog filter={EMPTY_MOVE_FILTER} />);

		expect(screen.getByText("Solo cut")).toBeInTheDocument();
		// The Yellow wire renders its dedicated chip.
		expect(screen.getByLabelText("Yellow wire")).toBeInTheDocument();
		expect(screen.getByText("Double detector")).toBeInTheDocument();
		// A failed detector shows the revealed "?" (unknown) on its badge…
		expect(screen.getByText(/fail \(\?\)/)).toBeInTheDocument();
		// …and a failed dual cut shows the numeric revealed value.
		expect(screen.getByText(/fail \(8\)/)).toBeInTheDocument();
		// Equipment notes are appended after an em dash.
		expect(screen.getByText(/seat 3 is empty/)).toBeInTheDocument();
	});

	it("opens the move editor when an edit control is used", async () => {
		const user = userEvent.setup();
		render(<MoveLog filter={EMPTY_MOVE_FILTER} />);

		await user.click(screen.getByRole("button", { name: "Edit move #1" }));
		expect(screen.getByTestId("move-editor")).toBeInTheDocument();
		expect(screen.getByText("Edit move #1")).toBeInTheDocument();
	});

	it("hides moves excluded by the filter prop", () => {
		seed([
			{
				id: "1",
				seq: 1,
				at: 1,
				type: "dual-cut",
				actorId: "a",
				targetId: "b",
				value: 9,
				outcome: "success",
			},
			{ id: "2", seq: 2, at: 2, type: "solo-cut", actorId: "b", value: 5 },
		]);
		render(
			<MoveLog
				filter={{ excludeSuccessfulDualCut: true, excludeSoloCut: true }}
			/>,
		);

		// Both moves are excluded, so the filtered-empty state shows instead.
		expect(screen.queryByTestId("move")).not.toBeInTheDocument();
		expect(screen.getByTestId("filtered-empty")).toBeInTheDocument();
	});
});
