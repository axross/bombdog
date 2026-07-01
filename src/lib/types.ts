// Domain model for the Bomb Busters move tracker.
//
// This app is a *pure logger*: it records what players do and displays the
// history. It does not validate game rules or track derived state such as the
// detonator. Every type here describes something the user explicitly entered.

/** A blue wire value (1–12) or the single "yellow" value shared by all yellows. */
export type WireValue =
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12
	| "yellow";

/** Blue-only wire value. Detectors indicate blue values only (per the FAQ). */
export type BlueWireValue = Exclude<WireValue, "yellow">;

/** Whether a guess-based action succeeded or failed. */
export type Outcome = "success" | "fail";

/**
 * The wire's true value, revealed when a cut fails: a real wire value or
 * "unknown" ("?", used by some special rules where the value stays hidden).
 */
export type RevealedWire = WireValue | "unknown";

export type MoveType =
	| "dual-cut"
	| "solo-cut"
	| "double-detector"
	| "equipment";

/** A player occupies a seat; seat order is the array index in `players`. */
export interface Player {
	id: string;
	name: string;
}

interface BaseMove {
	/** Stable unique id. */
	id: string;
	/** Monotonic sequence number, assigned when the move is logged. */
	seq: number;
	/** Creation/last-edit timestamp (epoch ms). */
	at: number;
	/** Player who performed the move. */
	actorId: string;
	type: MoveType;
}

/** Duo cut: actor names a value and points at a teammate's (or own) wire. */
export interface DualCutMove extends BaseMove {
	type: "dual-cut";
	targetId: string;
	value: WireValue;
	outcome: Outcome;
	/** The wire's true value, recorded when the cut failed. */
	revealed?: RevealedWire;
}

/** Solo cut: actor cuts the last copies of a value from their own hand; always safe. */
export interface SoloCutMove extends BaseMove {
	type: "solo-cut";
	value: WireValue;
}

/** Double detector: announce one blue value, point at two of a target's wires. */
export interface DoubleDetectorMove extends BaseMove {
	type: "double-detector";
	targetId: string;
	value: BlueWireValue;
	outcome: Outcome;
	/** The wire's true value, recorded when the detector failed. */
	revealed?: RevealedWire;
}

/** Equipment: actor uses a shared single-use tool. */
export interface EquipmentMove extends BaseMove {
	type: "equipment";
	equipment: string;
	note?: string;
}

export type Move =
	| DualCutMove
	| SoloCutMove
	| DoubleDetectorMove
	| EquipmentMove;

/**
 * The editable payload of a move — everything except the generated `id`/`seq`/
 * `at`. Produced by the composer (to add) and the editor (to update), so both
 * paths stay in sync. The `type` cannot change once a move exists.
 */
export type MoveDraft =
	| {
			type: "dual-cut";
			actorId: string;
			targetId: string;
			value: WireValue;
			outcome: Outcome;
			revealed?: RevealedWire;
	  }
	| { type: "solo-cut"; actorId: string; value: WireValue }
	| {
			type: "double-detector";
			actorId: string;
			targetId: string;
			value: BlueWireValue;
			outcome: Outcome;
			revealed?: RevealedWire;
	  }
	| { type: "equipment"; actorId: string; equipment: string; note?: string };

/** The persisted slice of tracker state. */
export interface TrackerState {
	players: Player[];
	/** Seat index of the Captain; seeds turn rotation. */
	captainIndex: number;
	moves: Move[];
}

/** All blue wire values, in order. */
export const BLUE_WIRE_VALUES: BlueWireValue[] = [
	1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];

/** Player count bounds supported by the setup screen. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 5;

/**
 * The equipment cards, in unlock-number order. The number in each label is the
 * wire value whose pair unlocks that equipment. The composer also offers a
 * free-text note for anything mission-specific.
 */
export const EQUIPMENT_OPTIONS = [
	"Label ≠ (1)",
	"Walkie-Talkies (2)",
	"Triple Detector (3)",
	"Post-it (4)",
	"Super Detector (5)",
	"Rewinder (6)",
	"Emergency Batteries (7)",
	"General Rader (8)",
	"Stabilizer (9)",
	"X or Y Ray (10)",
	"Coffee Mag (11)",
	"Label ＝ (12)",
] as const;
