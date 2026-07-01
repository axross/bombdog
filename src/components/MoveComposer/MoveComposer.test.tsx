import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useTrackerStore } from "@/lib/trackerStore";
import type { Player } from "@/lib/types";
import { MoveComposer } from "./MoveComposer";

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

describe("MoveComposer", () => {
	it("keeps Log move disabled until the action's fields are complete", () => {
		render(<MoveComposer />);
		expect(screen.getByRole("button", { name: "Log move" })).toBeDisabled();
		expect(screen.getByRole("button", { name: /Undo/ })).toBeDisabled();
		expect(screen.getByRole("button", { name: /Redo/ })).toBeDisabled();
	});

	it("logs a solo cut once a wire is chosen", async () => {
		const user = userEvent.setup();
		render(<MoveComposer />);

		await user.click(screen.getByRole("radio", { name: "Solo cut" }));
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

		// Dual cut is the default and targets another player.
		expect(
			screen.getByRole("combobox", { name: "Target" }),
		).toBeInTheDocument();

		await user.click(screen.getByRole("radio", { name: "Solo cut" }));
		expect(
			screen.queryByRole("combobox", { name: "Target" }),
		).not.toBeInTheDocument();
	});
});
