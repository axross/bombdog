import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useTrackerStore } from "@/lib/tracker-store";
import type { Player } from "@/lib/types";
import { MoveComposer } from "./move-composer";

const players: Player[] = [
	{ id: "a", name: "Alice" },
	{ id: "b", name: "Bob" },
	{ id: "c", name: "Carol" },
];

beforeEach(() => {
	useTrackerStore.setState({
		players,
		captainIndex: 0,
		moves: [],
		redoStack: [],
	});
});

afterEach(() => {
	useTrackerStore.setState({
		players: [],
		captainIndex: 0,
		moves: [],
		redoStack: [],
	});
});

/**
 * Open the composer sheet from the resting bar's Add move button.
 */
async function openSheet(user: ReturnType<typeof userEvent.setup>) {
	await user.click(screen.getByRole("button", { name: "Add move" }));
	// the sheet's form is now mounted.
	await screen.findByRole("button", { name: "Log move" });
}

describe("<MoveComposer>", () => {
	it("shows the resting bar with Add move and undo/redo, form hidden", () => {
		render(<MoveComposer />);
		expect(screen.getByRole("button", { name: "Add move" })).toBeVisible();
		expect(screen.getByRole("button", { name: /Undo/ })).toBeDisabled();
		expect(screen.getByRole("button", { name: /Redo/ })).toBeDisabled();
		// the form and Log move only exist once the sheet is opened.
		expect(
			screen.queryByRole("button", { name: "Log move" }),
		).not.toBeInTheDocument();
	});

	it("opens the sheet from Add move and closes it with Esc", async () => {
		const user = userEvent.setup();
		render(<MoveComposer />);

		await openSheet(user);
		expect(screen.getByRole("tab", { name: "Dual cut" })).toBeVisible();

		await user.keyboard("{Escape}");
		expect(
			screen.queryByRole("button", { name: "Log move" }),
		).not.toBeInTheDocument();
		// undo/redo stay reachable on the bar while the sheet is closed.
		expect(screen.getByRole("button", { name: /Undo/ })).toBeInTheDocument();
	});

	it("keeps Log move disabled until the action's fields are complete", async () => {
		const user = userEvent.setup();
		render(<MoveComposer />);

		await openSheet(user);
		expect(screen.getByRole("button", { name: "Log move" })).toBeDisabled();
	});

	it("logs a solo cut once a wire is chosen", async () => {
		const user = userEvent.setup();
		render(<MoveComposer />);

		await openSheet(user);
		await user.click(screen.getByRole("tab", { name: "Solo cut" }));
		// solo cut needs no target/outcome; the actor defaults to the Captain.
		await user.click(screen.getByRole("radio", { name: "Wire 7" }));

		const logButton = screen.getByRole("button", { name: "Log move" });
		expect(logButton).toBeEnabled();
		await user.click(logButton);

		const moves = useTrackerStore.getState().moves;
		expect(moves).toHaveLength(1);
		expect(moves[0]).toMatchObject({
			type: "solo-cut",
			actorId: "a",
			value: 7,
		});
	});

	it("shows the target selector only for targeted actions", async () => {
		const user = userEvent.setup();
		render(<MoveComposer />);

		await openSheet(user);
		// dual cut is the default and targets another player (segmented control).
		expect(
			screen.getByRole("radiogroup", { name: "Target" }),
		).toBeInTheDocument();

		await user.click(screen.getByRole("tab", { name: "Solo cut" }));
		expect(
			screen.queryByRole("radiogroup", { name: "Target" }),
		).not.toBeInTheDocument();
	});

	it("logs a detector move with its card, target, value, and outcome", async () => {
		const user = userEvent.setup();
		render(<MoveComposer />);

		await openSheet(user);
		await user.click(screen.getByRole("tab", { name: "Detectors" }));
		// the default card is the Double Detector; the actor defaults to the Captain.
		await user.click(screen.getByRole("radio", { name: "Bob" }));
		await user.click(screen.getByRole("button", { name: "Wire 7" }));
		await user.click(screen.getByRole("button", { name: "Success" }));

		const logButton = screen.getByRole("button", { name: "Log move" });
		expect(logButton).toBeEnabled();
		await user.click(logButton);

		const moves = useTrackerStore.getState().moves;
		expect(moves).toHaveLength(1);
		expect(moves[0]).toMatchObject({
			type: "detector",
			detector: "double",
			actorId: "a",
			targetId: "b",
			values: [7],
			outcome: "success",
		});
	});

	it("keeps the sheet open and resets the form after Log move", async () => {
		const user = userEvent.setup();
		render(<MoveComposer />);

		await openSheet(user);
		await user.click(screen.getByRole("tab", { name: "Solo cut" }));
		await user.click(screen.getByRole("radio", { name: "Wire 7" }));

		const logButton = screen.getByRole("button", { name: "Log move" });
		await user.click(logButton);

		// the move is recorded…
		expect(useTrackerStore.getState().moves).toHaveLength(1);
		// …and the sheet stays open with a reset form: Log move is back to disabled
		// (a fresh solo cut has no wire yet) and the previous wire is deselected.
		expect(screen.getByRole("button", { name: "Log move" })).toBeDisabled();
		expect(screen.getByRole("radio", { name: "Wire 7" })).not.toBeChecked();
	});
});
