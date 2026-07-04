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

type User = ReturnType<typeof userEvent.setup>;

/**
 * Open the composer sheet from the bar's Add move button, then wait for the
 * Radix-portaled form to mount (its Log move button is the ready signal).
 */
async function openComposer(user: User): Promise<void> {
	await user.click(screen.getByRole("button", { name: "Add move" }));
	await screen.findByRole("button", { name: "Log move" });
}

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

describe("<MoveComposer>", () => {
	it("starts closed: the bar shows undo/redo and Add move, with no form", () => {
		render(<MoveComposer />);

		// the bar's controls are present immediately; undo/redo start disabled.
		expect(screen.getByRole("button", { name: "Add move" })).toBeEnabled();
		expect(screen.getByRole("button", { name: /Undo/ })).toBeDisabled();
		expect(screen.getByRole("button", { name: /Redo/ })).toBeDisabled();
		// the form only exists once the sheet is opened.
		expect(
			screen.queryByRole("button", { name: "Log move" }),
		).not.toBeInTheDocument();
	});

	it("keeps Log move disabled until the action's fields are complete", async () => {
		const user = userEvent.setup();
		render(<MoveComposer />);
		await openComposer(user);

		expect(screen.getByRole("button", { name: "Log move" })).toBeDisabled();
	});

	it("logs a solo cut once a wire is chosen", async () => {
		const user = userEvent.setup();
		render(<MoveComposer />);
		await openComposer(user);

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
		await openComposer(user);

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
		await openComposer(user);

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

	it("returns to the Dual cut tab after logging a non-dual-cut move", async () => {
		const user = userEvent.setup();
		render(<MoveComposer />);
		await openComposer(user);

		// switch to Solo cut and log a move — Solo cut hides the Target control.
		await user.click(screen.getByRole("tab", { name: "Solo cut" }));
		expect(
			screen.queryByRole("radiogroup", { name: "Target" }),
		).not.toBeInTheDocument();
		await user.click(screen.getByRole("radio", { name: "Wire 7" }));
		await user.click(screen.getByRole("button", { name: "Log move" }));

		// the composer resets to Dual cut, so the Target control reappears and the
		// Dual cut tab is the selected one.
		expect(screen.getByRole("tab", { name: "Dual cut" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(
			screen.getByRole("radiogroup", { name: "Target" }),
		).toBeInTheDocument();
	});

	it("keeps the sheet open after logging so the next move can be entered", async () => {
		const user = userEvent.setup();
		render(<MoveComposer />);
		await openComposer(user);

		await user.click(screen.getByRole("tab", { name: "Solo cut" }));
		await user.click(screen.getByRole("radio", { name: "Wire 7" }));
		await user.click(screen.getByRole("button", { name: "Log move" }));

		// the move is recorded and the sheet stays open (its form is still mounted).
		expect(useTrackerStore.getState().moves).toHaveLength(1);
		expect(
			screen.getByRole("button", { name: "Log move" }),
		).toBeInTheDocument();
	});
});
