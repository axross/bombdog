import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTrackerStore } from "@/lib/tracker-store";
import type { Move, Player } from "@/lib/types";
import { TrackerApp } from "./tracker-app";

const players: Player[] = [
	{ id: "a", name: "Alice" },
	{ id: "b", name: "Bob" },
	{ id: "c", name: "Carol" },
];

const moves: Move[] = [
	{
		id: "m1",
		seq: 1,
		at: 1,
		actorId: "a",
		type: "solo-cut",
		value: 7,
	},
];

/**
 * Seed the tracker store with a state snapshot, filling any unset fields with empty defaults.
 */
function seed(
	overrides: Partial<{
		players: Player[];
		captainIndex: number;
		moves: Move[];
		hasHydrated: boolean;
	}>,
): void {
	useTrackerStore.setState({
		players: [],
		captainIndex: 0,
		moves: [],
		redoStack: [],
		hasHydrated: false,
		...overrides,
	});
}

beforeEach(() => {
	// TrackerApp kicks off rehydration in a useEffect, which would overwrite the
	// seeded state; stub it so the seeded snapshot is what renders.
	vi.spyOn(useTrackerStore.persist, "rehydrate").mockResolvedValue(
		undefined as never,
	);
});

afterEach(() => {
	useTrackerStore.setState({
		players: [],
		captainIndex: 0,
		moves: [],
		redoStack: [],
		hasHydrated: false,
	});
	vi.restoreAllMocks();
});

describe("<TrackerApp>", () => {
	it("shows the loading state before hydration completes", () => {
		seed({ hasHydrated: false });
		render(<TrackerApp />);

		const loading = screen.getByTestId("loading");
		expect(loading).toHaveAttribute("aria-busy", "true");
		expect(screen.getByText("Loading…")).toBeInTheDocument();
		expect(screen.queryByTestId("app")).not.toBeInTheDocument();
	});

	it("renders the setup screen once hydrated with no players", () => {
		seed({ hasHydrated: true, players: [] });
		render(<TrackerApp />);

		expect(
			screen.getByRole("button", { name: "Start tracking" }),
		).toBeInTheDocument();
		expect(screen.queryByTestId("app")).not.toBeInTheDocument();
	});

	it("renders the tracker shell with the header controls once players exist", () => {
		seed({
			hasHydrated: true,
			players,
			captainIndex: 1,
			moves,
		});
		render(<TrackerApp />);

		const header = screen.getByTestId("header");
		expect(within(header).getByText("Bombdog")).toBeInTheDocument();
		expect(
			within(header).getByRole("button", { name: "Reset" }),
		).toBeInTheDocument();
		// the filter now rides the tab bar (Moves view), not the header.
		expect(within(header).queryByTestId("filter")).not.toBeInTheDocument();
		expect(screen.getByTestId("filter")).toBeInTheDocument();
		// the Moves view is default: move history + the composer bar are mounted;
		// the composer starts closed, so its resting-state control is Add move.
		expect(screen.getByTestId("move-log")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Add move" }),
		).toBeInTheDocument();
	});

	it("switches to the Status view and hides the move filter there", async () => {
		const user = userEvent.setup();
		seed({ hasHydrated: true, players, captainIndex: 1, moves });
		render(<TrackerApp />);

		// default view is Moves.
		expect(screen.getByTestId("move-log")).toBeInTheDocument();
		expect(screen.queryByTestId("status-panel")).not.toBeInTheDocument();

		await user.click(screen.getByTestId("tab-status"));

		expect(screen.getByTestId("status-panel")).toBeInTheDocument();
		expect(screen.queryByTestId("move-log")).not.toBeInTheDocument();
		// the filter only makes sense for the move list, so it's gone on Status.
		expect(screen.queryByTestId("filter")).not.toBeInTheDocument();
	});

	it("triggers rehydration on mount", () => {
		seed({ hasHydrated: true, players, captainIndex: 0, moves });
		render(<TrackerApp />);

		expect(useTrackerStore.persist.rehydrate).toHaveBeenCalledTimes(1);
	});
});
