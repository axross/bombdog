import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTrackerStore } from "@/lib/tracker-store";
import type { BlueWireValue, Player } from "@/lib/types";
import { type EditableToken, StartingInfoEditor } from "./starting-info-editor";

const players: Player[] = [
	{ id: "a", name: "Alice" },
	{ id: "b", name: "Bob" },
	{ id: "c", name: "Carol" },
];

const tokens: EditableToken[] = [
	{ player: players[0], value: 9 },
	{ player: players[2], value: 4 },
];

/**
 * Seed the store with a game whose info tokens match the editor's `tokens`.
 */
function seed(infoTokens: Record<string, BlueWireValue>) {
	useTrackerStore.setState({
		players,
		captainIndex: 0,
		moves: [],
		infoTokens,
		redoStack: [],
		hasHydrated: true,
	});
}

beforeEach(() => {
	seed({ a: 9, c: 4 });
});

afterEach(() => {
	useTrackerStore.setState({
		players: [],
		captainIndex: 0,
		moves: [],
		infoTokens: {},
		redoStack: [],
		hasHydrated: false,
	});
});

/**
 * The WirePad row for a given player name, scoped so the shared `Wire N`
 * controls stay unambiguous across rows.
 */
function row(playerName: string) {
	return within(
		screen
			.getByTestId("starting-info-editor")
			.querySelector<HTMLElement>(`[data-player="${playerName}"]`) ??
			document.body,
	);
}

describe("<StartingInfoEditor>", () => {
	it("renders a pre-selected pad per tokened player, in the given order", () => {
		render(<StartingInfoEditor tokens={tokens} onClose={vi.fn()} />);

		const rows = screen.getAllByTestId("edit-info-token");
		expect(rows).toHaveLength(2);
		expect(rows[0]).toHaveAttribute("data-player", "Alice");
		expect(rows[1]).toHaveAttribute("data-player", "Carol");

		// each pad is pre-selected to its player's current value.
		expect(row("Alice").getByRole("radio", { name: "Wire 9" })).toHaveAttribute(
			"aria-checked",
			"true",
		);
		expect(row("Carol").getByRole("radio", { name: "Wire 4" })).toHaveAttribute(
			"aria-checked",
			"true",
		);
	});

	it("saves a changed value to the store and starts closing", () => {
		render(<StartingInfoEditor tokens={tokens} onClose={vi.fn()} />);

		fireEvent.click(row("Alice").getByRole("radio", { name: "Wire 2" }));
		fireEvent.click(screen.getByTestId("save-starting-info"));

		// only the edited token changed; the untouched one is preserved.
		expect(useTrackerStore.getState().infoTokens).toEqual({ a: 2, c: 4 });
		// saving starts the close: the dialog content is torn down (Radix defers
		// onClose to the exit animation, which jsdom never fires).
		expect(
			screen.queryByTestId("starting-info-editor"),
		).not.toBeInTheDocument();
	});

	it("closes on Cancel without mutating any token", () => {
		render(<StartingInfoEditor tokens={tokens} onClose={vi.fn()} />);

		fireEvent.click(row("Alice").getByRole("radio", { name: "Wire 2" }));
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		expect(useTrackerStore.getState().infoTokens).toEqual({ a: 9, c: 4 });
		expect(
			screen.queryByTestId("starting-info-editor"),
		).not.toBeInTheDocument();
	});

	it("does not close while open when an animationEnd fires", () => {
		const onClose = vi.fn();
		render(<StartingInfoEditor tokens={tokens} onClose={onClose} />);

		// an animationEnd while still open (e.g. the entrance animation) must not
		// trigger onClose. the exit-animation close path is covered by e2e.
		fireEvent.animationEnd(screen.getByTestId("starting-info-editor"));
		expect(onClose).not.toHaveBeenCalled();
	});
});
