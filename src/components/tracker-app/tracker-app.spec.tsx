import { render, screen, within } from "@testing-library/react";
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

	it("renders the tracker shell with the current actor once players exist", () => {
		seed({
			hasHydrated: true,
			players,
			captainIndex: 1,
			moves,
		});
		render(<TrackerApp />);

		const header = screen.getByTestId("header");
		expect(within(header).getByText("Bombdog")).toBeInTheDocument();
		expect(within(header).getByText("Turn")).toBeInTheDocument();
		// Last move was Alice (seat 0); rotation passes to Bob (seat 1).
		expect(within(header).getByText("Bob")).toBeInTheDocument();

		expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
		// Move history + composer are mounted.
		expect(screen.getByTestId("move-log")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Log move" }),
		).toBeInTheDocument();
	});

	it("triggers rehydration on mount", () => {
		seed({ hasHydrated: true, players, captainIndex: 0, moves });
		render(<TrackerApp />);

		expect(useTrackerStore.persist.rehydrate).toHaveBeenCalledTimes(1);
	});

	// The `currentActorId` falsy branch (the header omitting the Turn indicator)
	// is unreachable: nextActorId only returns undefined when players is empty,
	// but that case is handled by the earlier `players.length === 0` return, so
	// TrackerApp only evaluates it with a non-empty roster. Documented, not
	// covered.
});
