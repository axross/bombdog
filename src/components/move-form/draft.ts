// form state shared by the composer (add) and editor (update), plus the pure
// logic that turns it into a validated `MoveDraft`. keeping this separate from
// the JSX makes validity rules easy to unit-test.

import {
	type BlueWireValueOrUnknown,
	type DetectorKind,
	detectorOption,
	type Move,
	type MoveDraft,
	type MoveType,
	type Outcome,
	type RevealedWire,
	type WireValueOrUnknown,
} from "@/lib/types";

/**
 * The superset of fields any action can need; unused ones are ignored.
 */
export interface DraftFields {
	actorId: string;
	targetId: string;
	/**
	 * The named/cut wire value, or "?" when unknown.
	 */
	value: WireValueOrUnknown | null;
	/**
	 * Which detector card the "detector" action uses.
	 */
	detector: DetectorKind;
	/**
	 * Named blue values for the detector action (one or two). Blue-only by type:
	 * the detector wire pad is rendered `blueOnly`, so yellow can never enter,
	 * but a value may be "?" (unknown).
	 */
	values: BlueWireValueOrUnknown[];
	outcome: Outcome | null;
	/**
	 * The wire's true value, chosen when the outcome is a failure.
	 */
	revealed: RevealedWire | null;
	equipment: string;
	note: string;
}

/**
 * A blank {@link DraftFields} with every field cleared, optionally seeded with
 * the acting player. The starting point for the composer in add mode, and the
 * base that {@link fieldsFromMove} spreads the edited move over.
 */
export function emptyDraftFields(actorId = ""): DraftFields {
	return {
		actorId,
		targetId: "",
		value: null,
		detector: "double",
		values: [],
		outcome: null,
		revealed: null,
		equipment: "",
		note: "",
	};
}

/**
 * Trim a value selection to what the given detector card can name (one value,
 * or two for the X or Y Ray). Used when switching detector cards so a leftover
 * second value doesn't linger on a one-value card. Keeps the most recent picks,
 * matching the wire pad's own cap (which drops the oldest when it overflows).
 */
export function detectorValues(
	values: BlueWireValueOrUnknown[],
	kind: DetectorKind,
): BlueWireValueOrUnknown[] {
	return values.slice(-detectorOption(kind).valueCount);
}

/**
 * Seed the form from an existing move (for editing).
 */
export function fieldsFromMove(move: Move): DraftFields {
	const base = emptyDraftFields(move.actorId);
	switch (move.type) {
		case "dual-cut":
			return {
				...base,
				targetId: move.targetId,
				value: move.value,
				outcome: move.outcome,
				revealed: move.revealed ?? null,
			};
		case "detector":
			return {
				...base,
				detector: move.detector,
				targetId: move.targetId,
				values: move.values,
				outcome: move.outcome,
				revealed: move.revealed ?? null,
			};
		case "solo-cut":
			return { ...base, value: move.value };
		case "equipment":
			return { ...base, equipment: move.equipment, note: move.note ?? "" };
	}
}

/**
 * Build a validated draft for the given action, or `null` when required fields
 * are missing. Also the single source of truth for "is Log move enabled?". A
 * failed cut additionally requires the revealed wire value.
 */
export function buildDraft(type: MoveType, f: DraftFields): MoveDraft | null {
	switch (type) {
		case "dual-cut": {
			const { revealed } = f;
			if (!f.actorId || !f.targetId || f.value === null || f.outcome === null)
				return null;
			if (f.outcome === "fail" && revealed === null) return null;
			return {
				type,
				actorId: f.actorId,
				targetId: f.targetId,
				value: f.value,
				outcome: f.outcome,
				...(f.outcome === "fail" && revealed !== null ? { revealed } : {}),
			};
		}
		case "solo-cut":
			if (!f.actorId || f.value === null) return null;
			return { type, actorId: f.actorId, value: f.value };
		case "detector": {
			const { detector, values, revealed } = f;
			if (!f.actorId || !f.targetId) return null;
			// `values` is blue-only by type (the pad is `blueOnly`); require exactly
			// the right number of distinct wires (one, or two for the X or Y Ray).
			const { valueCount } = detectorOption(detector);
			if (values.length !== valueCount) return null;
			if (new Set(values).size !== values.length) return null;
			if (f.outcome === null) return null;
			if (f.outcome === "fail" && revealed === null) return null;
			return {
				type,
				detector,
				actorId: f.actorId,
				targetId: f.targetId,
				values,
				outcome: f.outcome,
				...(f.outcome === "fail" && revealed !== null ? { revealed } : {}),
			};
		}
		case "equipment": {
			const equipment = f.equipment.trim();
			if (!f.actorId || !equipment) return null;
			const note = f.note.trim();
			return note
				? { type, actorId: f.actorId, equipment, note }
				: { type, actorId: f.actorId, equipment };
		}
	}
}
