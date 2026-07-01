import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTrackerStore } from "@/lib/tracker-store";
import type { DualCutMove, Move, Player } from "@/lib/types";
import { MoveEditor } from "./move-editor";

const players: Player[] = [
	{ id: "a", name: "Alice" },
	{ id: "b", name: "Bob" },
	{ id: "c", name: "Carol" },
];

const dualCut: DualCutMove = {
	id: "m1",
	seq: 3,
	at: 100,
	type: "dual-cut",
	actorId: "a",
	targetId: "b",
	value: 9,
	outcome: "success",
};

function seed(moves: Move[]) {
	useTrackerStore.setState({
		players,
		captainIndex: 0,
		moves,
		redoStack: [],
		hasHydrated: true,
	});
}

beforeEach(() => {
	seed([{ ...dualCut }]);
});

afterEach(() => {
	useTrackerStore.setState({
		players: [],
		captainIndex: 0,
		moves: [],
		redoStack: [],
		hasHydrated: false,
	});
});

describe("<MoveEditor>", () => {
	it("titles the dialog with the move's sequence number", () => {
		render(<MoveEditor move={dualCut} players={players} onClose={vi.fn()} />);
		expect(screen.getByText("Edit move #3")).toBeInTheDocument();
	});

	it("prefills the move's fields", () => {
		render(<MoveEditor move={dualCut} players={players} onClose={vi.fn()} />);

		// Fixed action type shown as a static header (no tabs in edit mode).
		expect(screen.getByText("Dual cut")).toBeInTheDocument();
		expect(screen.queryByRole("tab")).not.toBeInTheDocument();
		// The prefilled wire value is checked.
		expect(screen.getByRole("radio", { name: "Wire 9" })).toHaveAttribute(
			"aria-checked",
			"true",
		);
	});

	it("saves an edited field to the store and starts closing", () => {
		const onClose = vi.fn();
		render(<MoveEditor move={dualCut} players={players} onClose={onClose} />);

		// Change the wire from 9 to 5, then save.
		fireEvent.click(screen.getByRole("radio", { name: "Wire 5" }));
		fireEvent.click(screen.getByTestId("save"));

		// The store is mutated in place (same id/seq, new value).
		const updated = useTrackerStore.getState().moves[0] as DualCutMove;
		expect(updated.value).toBe(5);
		expect(updated.id).toBe("m1");
		expect(updated.seq).toBe(3);

		// Saving triggers the close: the dialog content is torn down. Radix defers
		// the parent's onClose to the content's exit animationEnd, which never
		// fires under jsdom (no CSS animations), so the observable signal here is
		// that the dialog is gone.
		expect(screen.queryByTestId("move-editor")).not.toBeInTheDocument();
	});

	it("closes on Cancel without mutating the move", () => {
		const onClose = vi.fn();
		render(<MoveEditor move={dualCut} players={players} onClose={onClose} />);

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		// The move is unchanged.
		const after = useTrackerStore.getState().moves[0] as DualCutMove;
		expect(after.value).toBe(9);
		// Cancelling starts the close (content torn down, no store write).
		expect(screen.queryByTestId("move-editor")).not.toBeInTheDocument();
	});

	it("enables Save when the prefilled draft is valid", () => {
		render(<MoveEditor move={dualCut} players={players} onClose={vi.fn()} />);
		expect(screen.getByTestId("save")).toBeEnabled();
	});

	it("disables Save while a required field is missing", () => {
		// A move missing its target yields an invalid draft, disabling Save.
		const incomplete: DualCutMove = {
			...dualCut,
			targetId: "",
		};
		seed([{ ...incomplete }]);
		render(
			<MoveEditor move={incomplete} players={players} onClose={vi.fn()} />,
		);

		expect(screen.getByTestId("save")).toBeDisabled();
	});

	it("does not close while open when an animationEnd fires", () => {
		const onClose = vi.fn();
		render(<MoveEditor move={dualCut} players={players} onClose={onClose} />);

		// An animationEnd while still open (e.g. the entrance animation) must not
		// trigger onClose. The exit-animation close path is covered by e2e.
		fireEvent.animationEnd(screen.getByTestId("move-editor"));
		expect(onClose).not.toHaveBeenCalled();
	});
});
