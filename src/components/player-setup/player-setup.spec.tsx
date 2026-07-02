import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTrackerStore } from "@/lib/tracker-store";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/types";
import { PlayerSetup } from "./player-setup";

beforeEach(() => {
	useTrackerStore.setState({
		players: [],
		captainIndex: 0,
		moves: [],
		redoStack: [],
		previousPlayers: [],
		previousCaptainIndex: 0,
	});
});

afterEach(() => {
	// runs even if a test throws mid-way, so a stubbed global can't leak into
	// the next test in this worker.
	vi.unstubAllGlobals();
	useTrackerStore.setState({
		players: [],
		captainIndex: 0,
		moves: [],
		redoStack: [],
		previousPlayers: [],
		previousCaptainIndex: 0,
	});
});

function seatRows(): HTMLElement[] {
	// each seat exposes a "Make player N the Captain" radio; use its inputs to
	// scope name/radio queries per row.
	return screen.getAllByRole("radio");
}

describe("<PlayerSetup>", () => {
	it("renders with the default player count and named seats", () => {
		render(<PlayerSetup />);

		// default count is 4.
		expect(screen.getByText("4")).toBeInTheDocument();
		expect(seatRows()).toHaveLength(4);
		expect(
			screen.getByRole("textbox", { name: "Name of player 1" }),
		).toHaveValue("Player 1");
		expect(
			screen.getByRole("textbox", { name: "Name of player 4" }),
		).toHaveValue("Player 4");
	});

	it("increments and decrements the count, clamped at the bounds", async () => {
		const user = userEvent.setup();
		render(<PlayerSetup />);

		const add = screen.getByRole("button", { name: "Add a player" });
		const remove = screen.getByRole("button", { name: "Remove a player" });

		// from 4 up to MAX_PLAYERS (5); the add button then disables.
		await user.click(add);
		expect(screen.getByText(String(MAX_PLAYERS))).toBeInTheDocument();
		expect(seatRows()).toHaveLength(MAX_PLAYERS);
		expect(add).toBeDisabled();

		// back down to MIN_PLAYERS (2); the remove button then disables.
		await user.click(remove);
		await user.click(remove);
		await user.click(remove);
		expect(screen.getByText(String(MIN_PLAYERS))).toBeInTheDocument();
		expect(seatRows()).toHaveLength(MIN_PLAYERS);
		expect(remove).toBeDisabled();
	});

	it("lets the player names be edited", async () => {
		const user = userEvent.setup();
		render(<PlayerSetup />);

		const input = screen.getByRole("textbox", { name: "Name of player 1" });
		await user.clear(input);
		await user.type(input, "Zoe");
		expect(input).toHaveValue("Zoe");
	});

	it("selects the whole name when a seat input gains keyboard focus", async () => {
		render(<PlayerSetup />);

		const input = screen.getByRole<HTMLInputElement>("textbox", {
			name: "Name of player 1",
		});
		// focus without a mouse — the reliable path the feature targets, with no
		// mouseup to fight; the onFocus handler should select the whole value.
		input.focus();
		expect(input).toHaveFocus();

		// the entire default value is selected, so the next keystroke replaces it.
		expect(input.selectionStart).toBe(0);
		expect(input.selectionEnd).toBe("Player 1".length);
	});

	it("selects the whole name when a seat input is clicked", async () => {
		const user = userEvent.setup();
		render(<PlayerSetup />);

		const input = screen.getByRole<HTMLInputElement>("textbox", {
			name: "Name of player 1",
		});
		await user.click(input);

		// clicking focuses the input, and onFocus selects the whole value, so the
		// next keystroke replaces it.
		expect(input.selectionStart).toBe(0);
		expect(input.selectionEnd).toBe("Player 1".length);
	});

	it("selects a Captain and re-clamps it when the count drops below the seat", async () => {
		const user = userEvent.setup();
		render(<PlayerSetup />);

		// make the highest seat (player 4, index 3) the Captain.
		await user.click(
			screen.getByRole("radio", { name: "Make player 4 the Captain" }),
		);
		expect(
			screen.getByRole("radio", { name: "Make player 4 the Captain" }),
		).toBeChecked();

		// drop the count to 3 — seat index 3 no longer exists, so the Captain
		// re-clamps down to the new highest seat (index 2 → player 3).
		await user.click(screen.getByRole("button", { name: "Remove a player" }));
		expect(
			screen.getByRole("radio", { name: "Make player 3 the Captain" }),
		).toBeChecked();

		await user.click(screen.getByRole("button", { name: "Start tracking" }));
		expect(useTrackerStore.getState().captainIndex).toBe(2);
	});

	it("configures players on Start, storing count, captain, and trimmed names", async () => {
		const user = userEvent.setup();
		render(<PlayerSetup />);

		await user.click(
			screen.getByRole("radio", { name: "Make player 2 the Captain" }),
		);
		await user.click(screen.getByRole("button", { name: "Start tracking" }));

		const state = useTrackerStore.getState();
		expect(state.players).toHaveLength(4);
		expect(state.players.map((p) => p.name)).toEqual([
			"Player 1",
			"Player 2",
			"Player 3",
			"Player 4",
		]);
		expect(state.captainIndex).toBe(1);
	});

	it("falls back to 'Player N' when a name is left blank", async () => {
		const user = userEvent.setup();
		render(<PlayerSetup />);

		const input = screen.getByRole("textbox", { name: "Name of player 2" });
		await user.clear(input);
		await user.click(screen.getByRole("button", { name: "Start tracking" }));

		const state = useTrackerStore.getState();
		expect(state.players[1].name).toBe("Player 2");
	});

	it("pre-fills the count, names, and Captain carried over from a reset", () => {
		useTrackerStore.setState({
			previousPlayers: [
				{ id: "a", name: "Alice" },
				{ id: "b", name: "Bob" },
				{ id: "c", name: "Carol" },
			],
			previousCaptainIndex: 2,
		});

		render(<PlayerSetup />);

		expect(screen.getByText("3")).toBeInTheDocument();
		expect(seatRows()).toHaveLength(3);
		expect(
			screen.getByRole("textbox", { name: "Name of player 1" }),
		).toHaveValue("Alice");
		expect(
			screen.getByRole("textbox", { name: "Name of player 3" }),
		).toHaveValue("Carol");
		expect(
			screen.getByRole("radio", { name: "Make player 3 the Captain" }),
		).toBeChecked();
	});

	it("still generates seat ids when crypto.randomUUID is unavailable", async () => {
		// exercises the makeId() fallback used in browsers without randomUUID.
		vi.stubGlobal("crypto", { randomUUID: undefined });
		const user = userEvent.setup();
		render(<PlayerSetup />);

		await user.click(screen.getByRole("button", { name: "Start tracking" }));

		const { players } = useTrackerStore.getState();
		expect(players).toHaveLength(4);
		expect(new Set(players.map((p) => p.id)).size).toBe(4);
		for (const p of players) expect(p.id).toMatch(/^p_/);
		// restoration happens in afterEach so it survives an early assertion failure.
	});
});
