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

describe("<MoveComposer>", () => {
	it("keeps Log move disabled until the action's fields are complete", () => {
		render(<MoveComposer />);
		expect(screen.getByRole("button", { name: "Log move" })).toBeDisabled();
		expect(screen.getByRole("button", { name: /Undo/ })).toBeDisabled();
		expect(screen.getByRole("button", { name: /Redo/ })).toBeDisabled();
	});

	it("logs a solo cut once a wire is chosen", async () => {
		const user = userEvent.setup();
		render(<MoveComposer />);

		await user.click(screen.getByRole("tab", { name: "Solo cut" }));
		// Solo cut needs no target/outcome; the actor defaults to the Captain.
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

		// Dual cut is the default and targets another player (segmented control).
		expect(
			screen.getByRole("radiogroup", { name: "Target" }),
		).toBeInTheDocument();

		await user.click(screen.getByRole("tab", { name: "Solo cut" }));
		expect(
			screen.queryByRole("radiogroup", { name: "Target" }),
		).not.toBeInTheDocument();
	});

	it("drops an incompatible Yellow wire when switching to Double detector", async () => {
		const user = userEvent.setup();
		render(<MoveComposer />);

		// Pick Yellow on a dual cut, then switch to the blue-only detector.
		await user.click(screen.getByRole("radio", { name: "Yellow wire" }));
		expect(screen.getByRole("radio", { name: "Yellow wire" })).toBeChecked();

		await user.click(screen.getByRole("tab", { name: "Double detector" }));
		// The detector offers no Yellow, and the incompatible selection is cleared
		// (so no blue wire is pre-checked either).
		expect(
			screen.queryByRole("radio", { name: "Yellow wire" }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("radio", { name: "Wire 5" })).not.toBeChecked();
	});

	it("collapses and expands the composer via the toggle", async () => {
		const user = userEvent.setup();
		render(<MoveComposer />);

		const collapse = screen.getByRole("button", { name: "Collapse composer" });
		expect(collapse).toHaveAttribute("aria-expanded", "true");

		await user.click(collapse);
		const expand = screen.getByRole("button", { name: "Expand composer" });
		expect(expand).toHaveAttribute("aria-expanded", "false");
		// While collapsed the Log move button is removed from the a11y tree (inert).
		expect(screen.getByRole("button", { name: "Log move" })).toHaveAttribute(
			"inert",
		);

		await user.click(expand);
		expect(
			screen.getByRole("button", { name: "Collapse composer" }),
		).toHaveAttribute("aria-expanded", "true");
	});
});
