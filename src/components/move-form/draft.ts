// form state shared by the composer (add) and editor (update), plus the pure
// logic that turns it into a validated `MoveDraft`. keeping this separate from
// the JSX makes validity rules easy to unit-test.

import {
	type BlueWireValueOrUnknown,
	type DetectorKind,
	detectorOption,
	GENERAL_RADAR_EQUIPMENT,
	type Move,
	type MoveDraft,
	type MoveType,
	type Outcome,
	POST_IT_EQUIPMENT,
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
	/**
	 * The actual cut value chosen for a *successful* X or Y Ray, whose two named
	 * values leave the cut ambiguous. Ignored by every other action.
	 */
	cutValue: BlueWireValueOrUnknown | null;
	equipment: string;
	/**
	 * The players a General Radar found holding the announced value. Empty is a
	 * valid selection — the radar can find no one.
	 */
	holderIds: string[];
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
		cutValue: null,
		equipment: "",
		holderIds: [],
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
				cutValue: move.cutValue ?? null,
			};
		case "solo-cut":
			return { ...base, value: move.value };
		case "equipment":
			return {
				...base,
				equipment: move.equipment,
				targetId: move.targetId ?? "",
				value: move.value ?? null,
				holderIds: move.holderIds ?? [],
				note: move.note ?? "",
			};
	}
}

/**
 * Identifies a single control in the move form, so a failed validation can point
 * at the exact field to highlight. `wire` is the single-wire pad (dual/solo cut),
 * `values` the multi-select detector pad; `outcome` also stands in for a failed
 * cut that is still missing its revealed wire.
 */
export type MoveFieldKey =
	| "actor"
	| "target"
	| "wire"
	| "values"
	| "outcome"
	| "cutValue"
	| "equipment";

/**
 * The per-field counterpart to {@link buildDraft}: the list of controls that are
 * unselected, missing, or invalid for the given action, in top-to-bottom form
 * order. Empty exactly when {@link buildDraft} would return a non-null draft, so
 * the composer can flag precisely what is blocking "Log move".
 *
 * The two functions encode the same rules independently; the invariant that they
 * agree (`invalidFields(t,f).length === 0` ⇔ `buildDraft(t,f) !== null`) is
 * pinned by a unit test, so a change to one that forgets the other is caught.
 */
export function invalidFields(type: MoveType, f: DraftFields): MoveFieldKey[] {
	const missing: MoveFieldKey[] = [];
	switch (type) {
		case "dual-cut":
			if (!f.actorId) missing.push("actor");
			if (!f.targetId) missing.push("target");
			if (f.value === null) missing.push("wire");
			// a missing outcome, or a fail whose revealed wire is unset, both resolve
			// at the same Result control.
			if (f.outcome === null || (f.outcome === "fail" && f.revealed === null))
				missing.push("outcome");
			return missing;
		case "solo-cut":
			if (!f.actorId) missing.push("actor");
			if (f.value === null) missing.push("wire");
			return missing;
		case "detector": {
			const { valueCount } = detectorOption(f.detector);
			if (!f.actorId) missing.push("actor");
			if (!f.targetId) missing.push("target");
			// wrong count, or a duplicate wire (the pad prevents duplicates, but keep
			// parity with buildDraft's defensive check).
			if (
				f.values.length !== valueCount ||
				new Set(f.values).size !== f.values.length
			)
				missing.push("values");
			if (f.outcome === null || (f.outcome === "fail" && f.revealed === null))
				missing.push("outcome");
			if (
				f.detector === "x-or-y-ray" &&
				f.outcome === "success" &&
				f.cutValue === null
			)
				missing.push("cutValue");
			return missing;
		}
		case "equipment": {
			if (!f.actorId) missing.push("actor");
			const equipment = f.equipment.trim();
			if (!equipment) missing.push("equipment");
			// the structured cards mirror buildDraft's extra requirements: the
			// Post-it needs its target and revealed wire, the General Radar its
			// announced value. radar holders may be empty, so they never flag.
			if (equipment === POST_IT_EQUIPMENT) {
				if (!f.targetId) missing.push("target");
				if (typeof f.value !== "number") missing.push("wire");
			} else if (equipment === GENERAL_RADAR_EQUIPMENT) {
				if (typeof f.value !== "number") missing.push("wire");
			}
			return missing;
		}
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
			const { detector, values, revealed, cutValue } = f;
			if (!f.actorId || !f.targetId) return null;
			// `values` is blue-only by type (the pad is `blueOnly`); require exactly
			// the right number of distinct wires (one, or two for the X or Y Ray).
			const { valueCount } = detectorOption(detector);
			if (values.length !== valueCount) return null;
			if (new Set(values).size !== values.length) return null;
			if (f.outcome === null) return null;
			if (f.outcome === "fail" && revealed === null) return null;
			// a successful X or Y Ray names two candidates, so the actual cut value
			// must be recorded to disambiguate which one was cut.
			const needsCutValue =
				detector === "x-or-y-ray" && f.outcome === "success";
			if (needsCutValue && cutValue === null) return null;
			return {
				type,
				detector,
				actorId: f.actorId,
				targetId: f.targetId,
				values,
				outcome: f.outcome,
				...(f.outcome === "fail" && revealed !== null ? { revealed } : {}),
				...(needsCutValue && cutValue !== null ? { cutValue } : {}),
			};
		}
		case "equipment": {
			const equipment = f.equipment.trim();
			if (!f.actorId || !equipment) return null;
			const note = f.note.trim();
			const base = {
				type,
				actorId: f.actorId,
				equipment,
				...(note ? { note } : {}),
			};
			// the structured cards' pads are blue-only, so a chosen value is always
			// a blue number; the typeof check both validates and narrows it.
			if (equipment === POST_IT_EQUIPMENT) {
				if (!f.targetId || typeof f.value !== "number") return null;
				return { ...base, targetId: f.targetId, value: f.value };
			}
			if (equipment === GENERAL_RADAR_EQUIPMENT) {
				if (typeof f.value !== "number") return null;
				// zero holders is valid: "the radar found no one" is worth logging.
				return { ...base, value: f.value, holderIds: [...f.holderIds] };
			}
			return base;
		}
	}
}
