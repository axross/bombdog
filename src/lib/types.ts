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
 * A wire value that may be "?" ("unknown"). Some special-rule wires are cut,
 * named, or revealed without their exact value ever being known, so both the
 * value a player *names* for a cut and the value *revealed* on a failure can be
 * recorded as "?".
 */
export type WireValueOrUnknown = WireValue | "unknown";

/**
 * A blue-only wire value that may be "?" ("unknown"). Detectors indicate blue
 * values only (per the FAQ) but a detector-named value may still be unknown.
 */
export type BlueWireValueOrUnknown = BlueWireValue | "unknown";

/**
 * The wire's true value, revealed when a cut fails: a real wire value or
 * "unknown" ("?", used by some special rules where the value stays hidden).
 */
export type RevealedWire = WireValueOrUnknown;

export type MoveType = "dual-cut" | "solo-cut" | "detector" | "equipment";

/**
 * The detector cards, which all resolve like an extended Dual cut. They differ
 * only in how many wires are targeted and how many values are named:
 *
 * - `double` — say one value, point at two different wires.
 * - `triple` — say one value, point at three different wires.
 * - `super` — say one value, point at a player; every wire they hold is a target.
 * - `x-or-y-ray` — say two values, point at a single wire (it may be either).
 *
 * Because this app is a pure logger it never tracks wire positions, so a
 * detector move records the target player, the named value(s), and the outcome;
 * the kind conveys how many wires were pointed at.
 */
export type DetectorKind = "double" | "triple" | "super" | "x-or-y-ray";

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
	/** The named wire value, or "?" when the cut wire's value is unknown. */
	value: WireValueOrUnknown;
	outcome: Outcome;
	/** The wire's true value, recorded when the cut failed. */
	revealed?: RevealedWire;
}

/** Solo cut: actor cuts the last copies of a value from their own hand; always safe. */
export interface SoloCutMove extends BaseMove {
	type: "solo-cut";
	/** The cut wire value, or "?" when the value is unknown. */
	value: WireValueOrUnknown;
}

/**
 * Detector: use a detector card against a target. The actor announces one blue
 * value (two for the X or Y Ray) and points at the target's wire(s). Detectors
 * indicate blue values only (per the FAQ), so `values` never holds "yellow".
 */
export interface DetectorMove extends BaseMove {
	type: "detector";
	detector: DetectorKind;
	targetId: string;
	/**
	 * Named blue values: one for double/triple/super, two for the X or Y Ray.
	 * A value may be "?" when the named wire's value is unknown.
	 */
	values: BlueWireValueOrUnknown[];
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

export type Move = DualCutMove | SoloCutMove | DetectorMove | EquipmentMove;

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
			value: WireValueOrUnknown;
			outcome: Outcome;
			revealed?: RevealedWire;
	  }
	| { type: "solo-cut"; actorId: string; value: WireValueOrUnknown }
	| {
			type: "detector";
			detector: DetectorKind;
			actorId: string;
			targetId: string;
			values: BlueWireValueOrUnknown[];
			outcome: Outcome;
			revealed?: RevealedWire;
	  }
	| { type: "equipment"; actorId: string; equipment: string; note?: string };

/**
 * View-only filter for the move log. Each flag hides its matching moves from
 * the displayed history; it never touches the persisted moves themselves.
 */
export interface MoveFilter {
	/** Hide dual cuts whose outcome was a success. */
	excludeSuccessfulDualCut: boolean;
	/** Hide solo cuts. */
	excludeSoloCut: boolean;
}

/** A filter that excludes nothing — the initial and reset state. */
export const EMPTY_MOVE_FILTER: MoveFilter = {
	excludeSuccessfulDualCut: false,
	excludeSoloCut: false,
};

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
 *
 * The detector cards (Triple Detector, Super Detector, X or Y Ray) are omitted
 * here: they have structured effects and are logged through the dedicated
 * "Detectors" action instead of as a free-text equipment note.
 */
export const EQUIPMENT_OPTIONS = [
	"Label ≠ (1)",
	"Walkie-Talkies (2)",
	"Post-it (4)",
	"Rewinder (6)",
	"Emergency Batteries (7)",
	"General Rader (8)",
	"Stabilizer (9)",
	"Coffee Mag (11)",
	"Label ＝ (12)",
] as const;

/** How many blue values a detector names: two for the X or Y Ray, one otherwise. */
export type DetectorValueCount = 1 | 2;

/** A selectable detector card: its kind, its composer/log label, and value count. */
export interface DetectorOption {
	kind: DetectorKind;
	/** Label shown in the composer dropdown and the move log. */
	label: string;
	/** How many distinct blue values the actor names. */
	valueCount: DetectorValueCount;
	/**
	 * Whether the card targets a player's whole stand (the Super Detector) rather
	 * than specific wires. Drives the composer's target label.
	 */
	targetsWholeStand: boolean;
}

/**
 * The detector cards offered by the "Detectors" action, in unlock order. The
 * Double Detector is every player's Character-card ability (no unlock number);
 * the rest are equipment whose unlock number is shown in the label.
 */
export const DETECTOR_OPTIONS: DetectorOption[] = [
	{
		kind: "double",
		label: "Double Detector",
		valueCount: 1,
		targetsWholeStand: false,
	},
	{
		kind: "triple",
		label: "Triple Detector (3)",
		valueCount: 1,
		targetsWholeStand: false,
	},
	{
		kind: "super",
		label: "Super Detector (5)",
		valueCount: 1,
		targetsWholeStand: true,
	},
	{
		kind: "x-or-y-ray",
		label: "X or Y Ray (10)",
		valueCount: 2,
		targetsWholeStand: false,
	},
];

/**
 * Look up a detector option by kind. Every `DetectorKind` maps to exactly one
 * option, so a miss means the kind is invalid — a kind added to the union
 * without a matching option here, or corrupt persisted data. Fail loud rather
 * than silently substituting the wrong card (which would mislabel the move and
 * apply the wrong value count).
 */
export function detectorOption(kind: DetectorKind): DetectorOption {
	const option = DETECTOR_OPTIONS.find((d) => d.kind === kind);
	if (!option) {
		throw new Error(`Unknown detector kind: ${kind}`);
	}
	return option;
}
