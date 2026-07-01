// Form state shared by the composer (add) and editor (update), plus the pure
// logic that turns it into a validated `MoveDraft`. Keeping this separate from
// the JSX makes validity rules easy to unit-test.

import type {
	Move,
	MoveDraft,
	MoveType,
	Outcome,
	RevealedWire,
	WireValue,
} from "@/lib/types";

/** The superset of fields any action can need; unused ones are ignored. */
export interface DraftFields {
	actorId: string;
	targetId: string;
	value: WireValue | null;
	outcome: Outcome | null;
	/** The wire's true value, chosen when the outcome is a failure. */
	revealed: RevealedWire | null;
	equipment: string;
	note: string;
}

export function emptyDraftFields(actorId = ""): DraftFields {
	return {
		actorId,
		targetId: "",
		value: null,
		outcome: null,
		revealed: null,
		equipment: "",
		note: "",
	};
}

/** Seed the form from an existing move (for editing). */
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
		case "double-detector":
			return {
				...base,
				targetId: move.targetId,
				value: move.value,
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
		case "double-detector": {
			const { revealed } = f;
			// Detectors indicate blue values only.
			if (!f.actorId || !f.targetId || f.value === null || f.value === "yellow")
				return null;
			if (f.outcome === null) return null;
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
