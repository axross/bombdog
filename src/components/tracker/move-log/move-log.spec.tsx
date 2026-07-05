import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useTrackerStore } from "@/lib/tracker-store";
import {
	EMPTY_MOVE_FILTER,
	GENERAL_RADAR_EQUIPMENT,
	type Move,
	type Player,
	POST_IT_EQUIPMENT,
} from "@/lib/types";
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
		// a successful dual cut takes the green (success) left-edge accent.
		expect(
			screen.getByTestId("move-log").querySelector('[data-seq="1"]'),
		).toHaveAttribute("data-accent", "success");
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
				type: "detector",
				detector: "double",
				actorId: "b",
				targetId: "a",
				values: [6],
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
			{
				id: "5",
				seq: 5,
				at: 5,
				type: "detector",
				detector: "x-or-y-ray",
				actorId: "a",
				targetId: "b",
				values: [3, 11],
				outcome: "success",
			},
		]);
		render(<MoveLog filter={EMPTY_MOVE_FILTER} />);

		expect(screen.getByText("Solo cut")).toBeInTheDocument();
		// the yellow wire renders its dedicated chip.
		expect(screen.getByLabelText("Yellow wire")).toBeInTheDocument();
		// each detector names the specific card used.
		expect(screen.getByText("Double Detector")).toBeInTheDocument();
		expect(screen.getByText("X or Y Ray (10)")).toBeInTheDocument();
		// a failed detector shows the revealed "?" (unknown) on its badge…
		expect(screen.getByText(/fail \(\?\)/)).toBeInTheDocument();
		// …and a failed dual cut shows the numeric revealed value.
		expect(screen.getByText(/fail \(8\)/)).toBeInTheDocument();
		// the X or Y Ray names two values, so both chips render.
		expect(screen.getByLabelText("Wire 3")).toBeInTheDocument();
		expect(screen.getByLabelText("Wire 11")).toBeInTheDocument();
		// the equipment/misc action is labelled "Misc" on its row…
		expect(screen.getByText("Misc")).toBeInTheDocument();
		// …and equipment notes are appended after an em dash.
		expect(screen.getByText(/seat 3 is empty/)).toBeInTheDocument();

		// each row carries an outcome-coloured accent category on its left edge:
		// green (success) for the always-safe solo cut and the successful X or Y
		// Ray, red (fail) for the failed detector and failed dual cut, and neutral
		// (gray) for the non-detector equipment move. Located via data-seq.
		const accentBySeq = (seq: number) =>
			screen.getByTestId("move-log").querySelector(`[data-seq="${seq}"]`);
		expect(accentBySeq(1)).toHaveAttribute("data-accent", "success"); // solo cut
		expect(accentBySeq(2)).toHaveAttribute("data-accent", "fail"); // detector fail
		expect(accentBySeq(3)).toHaveAttribute("data-accent", "fail"); // dual-cut fail
		expect(accentBySeq(4)).toHaveAttribute("data-accent", "neutral"); // equipment
		expect(accentBySeq(5)).toHaveAttribute("data-accent", "success"); // detector success
	});

	it("shows the actual cut value on a successful X or Y Ray badge", () => {
		seed([
			{
				id: "1",
				seq: 1,
				at: 1,
				type: "detector",
				detector: "x-or-y-ray",
				actorId: "a",
				targetId: "b",
				values: [3, 11],
				outcome: "success",
				cutValue: 11,
			},
		]);
		render(<MoveLog filter={EMPTY_MOVE_FILTER} />);

		const badge = screen.getByTestId("badge");
		expect(badge).toHaveTextContent("success (11)");
		expect(badge).toHaveAttribute("data-cut", "11");
	});

	it('renders a "?" chip for a wire cut with an unknown value', () => {
		seed([
			{
				id: "1",
				seq: 1,
				at: 1,
				type: "solo-cut",
				actorId: "a",
				value: "unknown",
			},
		]);
		render(<MoveLog filter={EMPTY_MOVE_FILTER} />);

		expect(screen.getByLabelText("Unknown wire")).toHaveTextContent("?");
	});

	it("renders a Post-it row with its target and revealed wire", () => {
		seed([
			{
				id: "1",
				seq: 1,
				at: 1,
				type: "equipment",
				actorId: "a",
				equipment: POST_IT_EQUIPMENT,
				targetId: "b",
				value: 7,
			},
		]);
		render(<MoveLog filter={EMPTY_MOVE_FILTER} />);

		// the headline shows actor → target, like a dual cut.
		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(screen.getByText("Bob")).toBeInTheDocument();
		expect(screen.getByText(POST_IT_EQUIPMENT)).toBeInTheDocument();
		expect(screen.getByLabelText("Wire 7")).toBeInTheDocument();
		// no radar holders on a Post-it row.
		expect(screen.queryByTestId("equipment-holders")).not.toBeInTheDocument();
	});

	it("renders a General Radar row with its value and holder names", () => {
		seed([
			{
				id: "1",
				seq: 1,
				at: 1,
				type: "equipment",
				actorId: "a",
				equipment: GENERAL_RADAR_EQUIPMENT,
				value: 4,
				holderIds: ["a", "b"],
			},
		]);
		render(<MoveLog filter={EMPTY_MOVE_FILTER} />);

		expect(screen.getByText(GENERAL_RADAR_EQUIPMENT)).toBeInTheDocument();
		expect(screen.getByLabelText("Wire 4")).toBeInTheDocument();
		expect(screen.getByTestId("equipment-holders")).toHaveTextContent(
			"Alice, Bob",
		);
	});

	it('renders "no one" when a General Radar found no holders', () => {
		seed([
			{
				id: "1",
				seq: 1,
				at: 1,
				type: "equipment",
				actorId: "a",
				equipment: GENERAL_RADAR_EQUIPMENT,
				value: 4,
				holderIds: [],
			},
		]);
		render(<MoveLog filter={EMPTY_MOVE_FILTER} />);

		expect(screen.getByTestId("equipment-holders")).toHaveTextContent("no one");
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

		// both moves are excluded, so the filtered-empty state shows instead.
		expect(screen.queryByTestId("move")).not.toBeInTheDocument();
		expect(screen.getByTestId("filtered-empty")).toBeInTheDocument();
	});
});
