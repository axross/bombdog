// Ephemeral tracker state (zustand), synced to IndexedDB via `persist`.
//
// The store holds the live, in-memory copy of the game log. Actions mutate it
// synchronously; the `persist` middleware mirrors the persisted slice
// (players / captainIndex / moves) to IndexedDB on every change and rehydrates
// it on load. The `redoStack` is intentionally kept out of persistence so a
// reload starts with clean redo history.

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { idbStorage, STORAGE_KEY } from "./idb-storage";
import type { Move, MoveDraft, Player, TrackerState } from "./types";

interface TrackerStore extends TrackerState {
	/** Moves removed by undo, awaiting redo. Never persisted. */
	redoStack: Move[];
	/** True once IndexedDB rehydration has completed (client-only). */
	hasHydrated: boolean;
	/**
	 * The roster from the game most recently cleared by `reset`, kept so the
	 * setup screen can pre-fill the next game's player count, names, and Captain.
	 */
	previousPlayers: Player[];
	previousCaptainIndex: number;

	configurePlayers: (players: Player[], captainIndex: number) => void;
	setCaptain: (captainIndex: number) => void;
	addMove: (draft: MoveDraft) => void;
	updateMove: (id: string, draft: MoveDraft) => void;
	undoLastMove: () => void;
	redoMove: () => void;
	reset: () => void;
}

const EMPTY_STATE: TrackerState = {
	players: [],
	captainIndex: 0,
	moves: [],
};

function createId(): string {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return `m_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function nextSeq(moves: Move[]): number {
	return moves.reduce((max, move) => Math.max(max, move.seq), 0) + 1;
}

/** Build a persisted `Move` from an editable draft plus generated fields. */
function draftToMove(
	draft: MoveDraft,
	id: string,
	seq: number,
	at: number,
): Move {
	return { ...draft, id, seq, at } as Move;
}

export const useTrackerStore = create<TrackerStore>()(
	persist(
		(set, get) => ({
			...EMPTY_STATE,
			redoStack: [],
			hasHydrated: false,
			previousPlayers: [],
			previousCaptainIndex: 0,

			configurePlayers: (players, captainIndex) => {
				set({ players, captainIndex });
			},

			setCaptain: (captainIndex) => {
				set({ captainIndex });
			},

			addMove: (draft) => {
				const { moves } = get();
				const move = draftToMove(draft, createId(), nextSeq(moves), Date.now());
				// A new action invalidates the redo history.
				set({ moves: [...moves, move], redoStack: [] });
			},

			updateMove: (id, draft) => {
				const { moves } = get();
				const next = moves.map((move) => {
					if (move.id !== id) return move;
					// Editing corrects fields, never the action kind.
					if (move.type !== draft.type) return move;
					return draftToMove(draft, move.id, move.seq, Date.now());
				});
				set({ moves: next, redoStack: [] });
			},

			undoLastMove: () => {
				const { moves, redoStack } = get();
				if (moves.length === 0) return;
				const last = moves[moves.length - 1];
				set({
					moves: moves.slice(0, -1),
					redoStack: [...redoStack, last],
				});
			},

			redoMove: () => {
				const { moves, redoStack } = get();
				if (redoStack.length === 0) return;
				const move = redoStack[redoStack.length - 1];
				set({
					moves: [...moves, move],
					redoStack: redoStack.slice(0, -1),
				});
			},

			reset: () => {
				// Carry the roster over to the setup screen so the next game keeps
				// the same player count, names, and Captain without re-entry.
				const { players, captainIndex } = get();
				set({
					...EMPTY_STATE,
					redoStack: [],
					previousPlayers: players,
					previousCaptainIndex: captainIndex,
				});
			},
		}),
		{
			name: STORAGE_KEY,
			storage: createJSONStorage(() => idbStorage),
			version: 1,
			// Persist the durable game state plus the carried-over roster (so a
			// reset survives a reload); keep redo history ephemeral.
			partialize: (state) => ({
				players: state.players,
				captainIndex: state.captainIndex,
				moves: state.moves,
				previousPlayers: state.previousPlayers,
				previousCaptainIndex: state.previousCaptainIndex,
			}),
			// Hydration is triggered manually on the client (see TrackerApp) to
			// avoid a server/client render mismatch.
			skipHydration: true,
			onRehydrateStorage: () => () => {
				useTrackerStore.setState({ hasHydrated: true });
			},
		},
	),
);
