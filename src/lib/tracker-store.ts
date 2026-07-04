// ephemeral tracker state (zustand), synced to IndexedDB via `persist`.
//
// the store holds the live, in-memory copy of the game log. actions mutate it
// synchronously; the `persist` middleware mirrors the persisted slice
// (players / captainIndex / moves) to IndexedDB on every change and rehydrates
// it on load. the `redoStack` is intentionally kept out of persistence so a
// reload starts with clean redo history.

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { idbStorage, STORAGE_KEY } from "./idb-storage";
import type {
	BlueWireValue,
	Move,
	MoveDraft,
	Player,
	TrackerState,
} from "./types";

/**
 * The live tracker store: the persisted {@link TrackerState} plus the ephemeral
 * client-only state (redo history, hydration flag, carried-over roster) and the
 * actions that mutate them.
 */
interface TrackerStore extends TrackerState {
	/**
	 * Moves removed by undo, awaiting redo. Never persisted.
	 */
	redoStack: Move[];
	/**
	 * True once IndexedDB rehydration has completed (client-only).
	 */
	hasHydrated: boolean;
	/**
	 * The roster from the game most recently cleared by `reset`, kept so the
	 * setup screen can pre-fill the next game's player count, names, and Captain.
	 */
	previousPlayers: Player[];
	previousCaptainIndex: number;

	/**
	 * Set the roster and Captain seat for a new game, plus the starting info
	 * tokens each player placed (keyed by player id; empty when the phase was
	 * skipped). Captured atomically so the tracker opens with the tokens already
	 * recorded.
	 */
	configurePlayers: (
		players: Player[],
		captainIndex: number,
		infoTokens?: Record<string, BlueWireValue>,
	) => void;
	/**
	 * Move the Captain to a different seat.
	 */
	setCaptain: (captainIndex: number) => void;
	/**
	 * Log a new move from a draft, clearing the redo history.
	 */
	addMove: (draft: MoveDraft) => void;
	/**
	 * Correct an existing move's fields in place; its `type` cannot change.
	 */
	updateMove: (id: string, draft: MoveDraft) => void;
	/**
	 * Delete a logged move by id. Unlike `undoLastMove`, this removes an
	 * arbitrary move outright rather than pushing it onto the redo stack, so the
	 * redo history is cleared to keep it consistent with the new move list.
	 */
	removeMove: (id: string) => void;
	/**
	 * Remove the most recent move, pushing it onto the redo stack.
	 */
	undoLastMove: () => void;
	/**
	 * Re-apply the most recently undone move.
	 */
	redoMove: () => void;
	/**
	 * Clear the current game, carrying its roster over to the setup screen.
	 */
	reset: () => void;
}

const EMPTY_STATE: TrackerState = {
	players: [],
	captainIndex: 0,
	moves: [],
	infoTokens: {},
};

/**
 * Generate a unique id for a new move.
 *
 * @remarks
 * Prefers `crypto.randomUUID`; when it is unavailable (older runtimes or
 * non-secure contexts) it falls back to a timestamp-plus-random string.
 */
function createId(): string {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return `m_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/**
 * The next sequence number, one past the highest `seq` among existing moves.
 */
function nextSeq(moves: Move[]): number {
	return moves.reduce((max, move) => Math.max(max, move.seq), 0) + 1;
}

/**
 * Build a persisted `Move` from an editable draft plus generated fields.
 */
function draftToMove(
	draft: MoveDraft,
	id: string,
	seq: number,
	at: number,
): Move {
	return { ...draft, id, seq, at } as Move;
}

/**
 * Detector cards that were logged as free-text equipment before they became
 * first-class detector actions (they were removed from `EQUIPMENT_OPTIONS`).
 * Legacy equipment moves carrying these labels are dropped on migration: they
 * lack the target, value, and outcome a detector move needs, so they can't be
 * converted — only discarded.
 */
const REMOVED_DETECTOR_EQUIPMENT = new Set([
	"Triple Detector (3)",
	"Super Detector (5)",
	"X or Y Ray (10)",
]);

/**
 * Whether a persisted move is a pre-v2 equipment log of a now-detector card.
 */
function isRemovedDetectorEquipment(move: unknown): boolean {
	return (
		!!move &&
		typeof move === "object" &&
		(move as { type?: unknown }).type === "equipment" &&
		REMOVED_DETECTOR_EQUIPMENT.has(
			(move as { equipment?: unknown }).equipment as string,
		)
	);
}

/**
 * Rewrite a pre-v2 "double-detector" move into the unified "detector" shape.
 */
function rewriteLegacyDoubleDetector(move: unknown): unknown {
	if (
		!move ||
		typeof move !== "object" ||
		(move as { type?: unknown }).type !== "double-detector"
	) {
		return move;
	}
	const { value, ...rest } = move as { value?: unknown } & Record<
		string,
		unknown
	>;
	return {
		...rest,
		type: "detector",
		detector: "double",
		values: value === undefined ? [] : [value],
	};
}

export const useTrackerStore = create<TrackerStore>()(
	persist(
		(set, get) => ({
			...EMPTY_STATE,
			redoStack: [],
			hasHydrated: false,
			previousPlayers: [],
			previousCaptainIndex: 0,

			configurePlayers: (players, captainIndex, infoTokens = {}) => {
				set({ players, captainIndex, infoTokens });
			},

			setCaptain: (captainIndex) => {
				set({ captainIndex });
			},

			addMove: (draft) => {
				const { moves } = get();
				const move = draftToMove(draft, createId(), nextSeq(moves), Date.now());
				// a new action invalidates the redo history.
				set({ moves: [...moves, move], redoStack: [] });
			},

			updateMove: (id, draft) => {
				const { moves } = get();
				const next = moves.map((move) => {
					if (move.id !== id) return move;
					// editing corrects fields, never the action kind.
					if (move.type !== draft.type) return move;
					return draftToMove(draft, move.id, move.seq, Date.now());
				});
				set({ moves: next, redoStack: [] });
			},

			removeMove: (id) => {
				const { moves } = get();
				const next = moves.filter((move) => move.id !== id);
				// no-op on an unknown id: skip the needless redo-stack wipe.
				if (next.length === moves.length) return;
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
				// carry the roster over to the setup screen so the next game keeps
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
			version: 3,
			// v1 → v2, detectors became first-class. two fixups on persisted moves:
			//   1. rewrite the standalone "double-detector" move into the unified
			//      "detector" shape (a `detector` kind plus a `values` array).
			//   2. drop equipment moves that logged a detector card as free text
			//      (Triple/Super/X or Y Ray) — those cards are now the Detectors
			//      action and can't be reconstructed from an equipment note.
			migrate: (persisted, version) => {
				if (version < 2 && persisted && typeof persisted === "object") {
					const state = persisted as { moves?: unknown };
					if (Array.isArray(state.moves)) {
						state.moves = state.moves
							.filter((move) => !isRemovedDetectorEquipment(move))
							.map(rewriteLegacyDoubleDetector);
					}
				}
				// v2 -> v3: starting info tokens were added. default the new field to
				// an empty record so a pre-v3 game loads as "no starting info tokens".
				if (version < 3 && persisted && typeof persisted === "object") {
					const state = persisted as { infoTokens?: unknown };
					if (
						typeof state.infoTokens !== "object" ||
						state.infoTokens === null
					) {
						state.infoTokens = {};
					}
				}
				return persisted as TrackerStore;
			},
			// persist the durable game state plus the carried-over roster (so a
			// reset survives a reload); keep redo history ephemeral.
			partialize: (state) => ({
				players: state.players,
				captainIndex: state.captainIndex,
				moves: state.moves,
				infoTokens: state.infoTokens,
				previousPlayers: state.previousPlayers,
				previousCaptainIndex: state.previousCaptainIndex,
			}),
			// hydration is triggered manually on the client (see TrackerApp) to
			// avoid a server/client render mismatch.
			skipHydration: true,
			onRehydrateStorage: () => () => {
				useTrackerStore.setState({ hasHydrated: true });
			},
		},
	),
);
