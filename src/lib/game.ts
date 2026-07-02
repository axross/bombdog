// Pure, UI-agnostic helpers for the tracker. Kept separate from the store so
// they are trivially unit-testable and reusable across components.

import type {
	Move,
	MoveFilter,
	Player,
	RevealedWire,
	WireValue,
} from "./types";

/** Resolve a player's display name, tolerant of unknown ids. */
export function getPlayerName(players: Player[], id: string): string {
	return players.find((p) => p.id === id)?.name ?? "Unknown";
}

/** Human-readable label for a wire value ("9" or "Yellow"). */
export function formatWire(value: WireValue): string {
	return value === "yellow" ? "Yellow" : String(value);
}

/** Compact label for a revealed wire ("9", "Y", or "?"). */
export function formatRevealed(value: RevealedWire): string {
	if (value === "unknown") return "?";
	if (value === "yellow") return "Y";
	return String(value);
}

/**
 * Order players for the Target dropdown: everyone except the acting player
 * first, then the actor last. Self-targeting is legal (some mission rules allow
 * a self-dual-cut) but rare, so it is de-prioritised rather than removed.
 */
export function targetPlayerOrder(
	players: Player[],
	actorId: string,
): Player[] {
	return [
		...players.filter((p) => p.id !== actorId),
		...players.filter((p) => p.id === actorId),
	];
}

/** Whether a move survives the log filter (`true` = shown, `false` = hidden). */
export function isMoveVisible(move: Move, filter: MoveFilter): boolean {
	if (
		filter.excludeSuccessfulDualCut &&
		move.type === "dual-cut" &&
		move.outcome === "success"
	) {
		return false;
	}
	if (filter.excludeSoloCut && move.type === "solo-cut") {
		return false;
	}
	return true;
}

/** Apply the log filter, preserving the original move order. */
export function filterMoves(moves: Move[], filter: MoveFilter): Move[] {
	// Common case: nothing excluded — return the input untouched, no allocation.
	if (!isFilterActive(filter)) return moves;
	return moves.filter((move) => isMoveVisible(move, filter));
}

/** True when the filter excludes at least one move type. */
export function isFilterActive(filter: MoveFilter): boolean {
	return filter.excludeSuccessfulDualCut || filter.excludeSoloCut;
}

/**
 * The seat that should act next: the Captain seeds the rotation, and after each
 * turn-advancing move play passes to the seat clockwise (next index) of the last
 * actor. Returns the player id, or `undefined` when there are no players.
 *
 * Equipment moves do not advance the turn — the shared single-use tools fire
 * without ending the actor's turn — so they are ignored when finding the last
 * actor. Detector moves (a separate move type) still advance the turn.
 *
 * This is only a *suggestion* — the composer lets the user override it, because
 * equipment can fire off-turn and empty-handed players get skipped.
 */
export function nextActorId(
	players: Player[],
	captainIndex: number,
	moves: Move[],
): string | undefined {
	if (players.length === 0) return undefined;
	// `players` is non-empty here, so the modulo index is always in bounds.
	const captainSeatId = players[captainIndex % players.length].id;
	// Skip equipment moves: they never pass the turn, so the rotation continues
	// from the last non-equipment move.
	const lastTurnMove = moves.findLast((m) => m.type !== "equipment");
	if (!lastTurnMove) return captainSeatId;
	const lastSeat = players.findIndex((p) => p.id === lastTurnMove.actorId);
	if (lastSeat === -1) return captainSeatId;
	return players[(lastSeat + 1) % players.length].id;
}
