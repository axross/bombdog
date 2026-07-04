// pure, UI-agnostic helpers for the tracker. kept separate from the store so
// they are trivially unit-testable and reusable across components.

import {
	BLUE_WIRE_VALUES,
	type BlueWireValue,
	type DetectorMove,
	type Move,
	type MoveFilter,
	type Player,
	type WireValueOrUnknown,
} from "./types";

/**
 * Resolve a player's display name, tolerant of unknown ids.
 */
export function getPlayerName(players: Player[], id: string): string {
	return players.find((p) => p.id === id)?.name ?? "Unknown";
}

/**
 * Compact glyph for a wire value on a chip/badge: "9", "Y", or "?". The single
 * source of truth for how a wire reads on screen — used by the wire pad, the
 * reveal dialog, the move-log chip, and the failed-cut badge alike.
 */
export function formatWire(value: WireValueOrUnknown): string {
	if (value === "unknown") return "?";
	if (value === "yellow") return "Y";
	return String(value);
}

/**
 * Accessible name for a wire value: "Wire 9", "Yellow wire", or "Unknown wire".
 * Companion to {@link formatWire}, keeping the aria labels in one place.
 */
export function wireLabel(value: WireValueOrUnknown): string {
	if (value === "unknown") return "Unknown wire";
	if (value === "yellow") return "Yellow wire";
	return `Wire ${value}`;
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

/**
 * Whether a move survives the log filter (`true` = shown, `false` = hidden).
 */
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

/**
 * Apply the log filter, preserving the original move order.
 */
export function filterMoves(moves: Move[], filter: MoveFilter): Move[] {
	// common case: nothing excluded — return the input untouched, no allocation.
	if (!isFilterActive(filter)) return moves;
	return moves.filter((move) => isMoveVisible(move, filter));
}

/**
 * True when the filter excludes at least one move type.
 */
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
	// skip equipment moves: they never pass the turn, so the rotation continues
	// from the last non-equipment move.
	const lastTurnMove = moves.findLast((m) => m.type !== "equipment");
	if (!lastTurnMove) return captainSeatId;
	const lastSeat = players.findIndex((p) => p.id === lastTurnMove.actorId);
	if (lastSeat === -1) return captainSeatId;
	return players[(lastSeat + 1) % players.length].id;
}

/**
 * The number of copies of every blue value in the game (the "4-of-each" fact
 * that anchors all deduction).
 */
export const WIRE_COPIES = 4;

/**
 * One blue value's line in the status view: how many of its four copies are
 * cut, how many are uncut-but-revealed (location known, not yet cut), and the
 * players known to hold those uncut-but-revealed copies.
 */
export interface WireStatusRow {
	value: BlueWireValue;
	/**
	 * Copies cut so far (0–4, clamped — a mis-logged over-cut cannot exceed 4).
	 */
	cut: number;
	/**
	 * Uncut copies whose location is known — a starting info token or a failed-cut
	 * reveal exposed them. One per known holding, so it equals the number of
	 * {@link holders} entries (counting a player once per copy they hold), clamped
	 * to the copies still uncut. The remaining `uncut - revealed` copies are still
	 * hidden.
	 */
	revealed: number;
	/**
	 * Copies still in play (`WIRE_COPIES - cut`).
	 */
	uncut: number;
	/**
	 * Players known to hold an uncut-but-revealed copy, in seat order.
	 * Deduplicated: a player appears once however many copies they are known to
	 * hold.
	 */
	holders: Player[];
}

/**
 * The derived status view: the twelve blue values plus the players known to
 * hold an uncut yellow wire.
 */
export interface WireStatus {
	blue: WireStatusRow[];
	yellowHolders: Player[];
}

/**
 * Map key for the possession multiset: a blue number or the shared "yellow".
 * Unknown ("?") wires can't be attributed to a value, so they never key here.
 */
type HolderKey = BlueWireValue | "yellow";

/**
 * The value a *successful* detector cut, or `null` when it can't be pinned to a
 * single value (an X or Y Ray whose actual cut value was never captured, or a
 * detector with no named value). The X or Y Ray names two candidates, so its
 * captured `cutValue` — not the named `values` — is the one that was cut; every
 * other detector's single named value is the cut.
 */
function detectorCutValue(move: DetectorMove): WireValueOrUnknown | null {
	return move.detector === "x-or-y-ray"
		? (move.cutValue ?? null)
		: (move.values[0] ?? null);
}

/**
 * Derive the status view from the logged game state. Pure and best-effort: it
 * mirrors what the moves imply without validating them, matching the app's
 * pure-logger stance (an inconsistent manual log is reflected, not corrected).
 *
 * **Cut counts** (blue 1–12, out of {@link WIRE_COPIES}): a successful dual cut
 * or detector cuts two copies of its value (the actor's wire and the target's);
 * a solo cut removes a value's last copies, so it marks that value fully cut. A
 * failed guess and an unknown ("?") value change no count.
 *
 * **Possession**: starting info tokens and failed-guess reveals record that a
 * player holds a wire of a value (blue or yellow); a successful cut consumes one
 * known copy from *both* the actor and the target, and a solo cut clears the
 * value entirely (its last copies just left play).
 */
export function deriveWireStatus(
	players: Player[],
	moves: Move[],
	infoTokens: Record<string, BlueWireValue>,
): WireStatus {
	const cut = new Map<BlueWireValue, number>();
	// values fully cut by a solo cut, pinned to 4 regardless of prior partial cuts.
	const complete = new Set<BlueWireValue>();
	// possession as a multiset of player ids per value, so both-side consumption
	// removes exactly one known copy at a time.
	const holders = new Map<HolderKey, string[]>();

	const addHolder = (key: HolderKey, playerId: string) => {
		const list = holders.get(key);
		if (list) list.push(playerId);
		else holders.set(key, [playerId]);
	};
	const consumeHolder = (key: HolderKey, playerId: string) => {
		const list = holders.get(key);
		if (!list) return;
		const at = list.indexOf(playerId);
		if (at !== -1) list.splice(at, 1);
	};
	const addCut = (value: WireValueOrUnknown | null) => {
		if (typeof value !== "number") return;
		cut.set(value, (cut.get(value) ?? 0) + 2);
	};

	// starting info tokens: each records that a player holds that blue value.
	for (const [playerId, value] of Object.entries(infoTokens)) {
		addHolder(value, playerId);
	}

	// replay moves in sequence order so consumption follows the reveals it relies on.
	const ordered = [...moves].sort((a, b) => a.seq - b.seq);
	for (const move of ordered) {
		switch (move.type) {
			case "equipment":
				break;
			case "solo-cut": {
				// the last copies of this value leave play: mark it complete and drop
				// every known holder of it (the actor held them; no one holds it now).
				if (typeof move.value === "number") complete.add(move.value);
				if (move.value !== "unknown") holders.delete(move.value);
				break;
			}
			case "dual-cut": {
				if (move.outcome === "success") {
					addCut(move.value);
					if (move.value !== "unknown") {
						consumeHolder(move.value, move.actorId);
						consumeHolder(move.value, move.targetId);
					}
				} else if (move.revealed != null && move.revealed !== "unknown") {
					// a failed guess reveals the target's pointed-at wire (blue or yellow).
					addHolder(move.revealed, move.targetId);
				}
				break;
			}
			case "detector": {
				if (move.outcome === "success") {
					const value = detectorCutValue(move);
					addCut(value);
					if (value != null && value !== "unknown") {
						consumeHolder(value, move.actorId);
						consumeHolder(value, move.targetId);
					}
				} else if (move.revealed != null && move.revealed !== "unknown") {
					addHolder(move.revealed, move.targetId);
				}
				break;
			}
		}
	}

	// resolve a holder multiset to unique players in seat order.
	const resolveHolders = (key: HolderKey): Player[] => {
		const ids = new Set(holders.get(key) ?? []);
		return players.filter((p) => ids.has(p.id));
	};

	const blue: WireStatusRow[] = BLUE_WIRE_VALUES.map((value) => {
		const cutCount = complete.has(value)
			? WIRE_COPIES
			: Math.min(WIRE_COPIES, cut.get(value) ?? 0);
		// one revealed copy per known holding, but never more than the copies still
		// uncut (an inconsistent over-log can't reveal more than exist).
		const knownUncut = holders.get(value)?.length ?? 0;
		const revealed = Math.min(knownUncut, WIRE_COPIES - cutCount);
		return {
			value,
			cut: cutCount,
			revealed,
			uncut: WIRE_COPIES - cutCount,
			holders: resolveHolders(value),
		};
	});

	return { blue, yellowHolders: resolveHolders("yellow") };
}
