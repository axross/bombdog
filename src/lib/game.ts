// Pure, UI-agnostic helpers for the tracker. Kept separate from the store so
// they are trivially unit-testable and reusable across components.

import type { Move, Player, WireValue } from "./types";

/** Resolve a player's display name, tolerant of unknown ids. */
export function getPlayerName(players: Player[], id: string): string {
	return players.find((p) => p.id === id)?.name ?? "Unknown";
}

/** Human-readable label for a wire value ("9" or "Yellow"). */
export function formatWire(value: WireValue): string {
	return value === "yellow" ? "Yellow" : String(value);
}

/**
 * The seat that should act next: the Captain seeds the rotation, and after each
 * logged move play passes to the seat clockwise (next index) of the last actor.
 * Returns the player id, or `undefined` when there are no players.
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
	if (moves.length === 0) {
		return players[captainIndex % players.length]?.id ?? players[0].id;
	}
	const lastActorId = moves[moves.length - 1].actorId;
	const lastSeat = players.findIndex((p) => p.id === lastActorId);
	if (lastSeat === -1) {
		return players[captainIndex % players.length]?.id ?? players[0].id;
	}
	return players[(lastSeat + 1) % players.length].id;
}
