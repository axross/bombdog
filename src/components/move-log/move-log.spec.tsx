import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useTrackerStore } from "@/lib/tracker-store";
import type { Move, Player } from "@/lib/types";
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
		render(<MoveLog />);
		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(screen.getByText("Radar")).toBeInTheDocument();
		expect(screen.getByText(/success/)).toBeInTheDocument();
		expect(screen.getByLabelText("Wire 9")).toBeInTheDocument();
	});

	it("exposes an edit control per move", () => {
		render(<MoveLog />);
		expect(
			screen.getByRole("button", { name: "Edit move #1" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Edit move #2" }),
		).toBeInTheDocument();
	});

	it("shows an empty state when there are no moves", () => {
		seed([]);
		render(<MoveLog />);
		expect(screen.getByText(/No moves yet/)).toBeInTheDocument();
	});
});
