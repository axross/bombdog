"use client";

import { useState } from "react";
import {
	buildDraft,
	type DraftFields,
	invalidFields,
	type MoveFieldKey,
} from "@/lib/move-draft";
import type { MoveDraft, MoveType } from "@/lib/types";

/**
 * The result of flagging an incomplete draft: which fields blocked it and how
 * many failed attempts have accumulated since the last reset.
 */
export interface InvalidFlagResult {
	missing: MoveFieldKey[];
	attempt: number;
}

/**
 * The move-draft form state machine shared by the composer (add) and the
 * editor (correct): the entered fields, the action type, the built draft, and
 * the validate-on-press flagging state.
 */
export interface MoveDraftForm {
	type: MoveType;
	fields: DraftFields;
	/**
	 * The draft built from the current fields, or `null` while incomplete.
	 */
	draft: MoveDraft | null;
	/**
	 * The fields to flag as invalid. Empty until a failed {@link flagInvalid}
	 * press, then recomputed live so each fix clears its own highlight
	 * (UI = F(state)).
	 */
	invalid: ReadonlySet<MoveFieldKey>;
	/**
	 * How many times an incomplete draft has been flagged since the last reset.
	 * 0 means "not attempted yet"; each bump re-plays the highlight shake.
	 */
	nudge: number;
	setFields: (fields: DraftFields) => void;
	/**
	 * Switch the action type. A different action has different required fields,
	 * so this clears any flags from the previous action rather than flagging
	 * the new type's fields pre-emptively.
	 */
	changeType: (type: MoveType) => void;
	/**
	 * Record a failed submit press: bumps the nudge (re-playing the shake) and
	 * returns the offending fields plus the attempt count, for the caller's
	 * announcement.
	 */
	flagInvalid: () => InvalidFlagResult;
	/**
	 * Clear the flagging state — when the form is dismissed, so a reopen
	 * starts clean.
	 */
	resetValidation: () => void;
	/**
	 * Reset the form for the next entry (fields, optionally the action type),
	 * clearing any flagging state — after a successful log.
	 */
	reset: (fields: DraftFields, type?: MoveType) => void;
}

/**
 * Own a move draft's form state: fields, action type, the built draft, and
 * validate-on-press flagging. Pure game rules stay in
 * {@link buildDraft} / {@link invalidFields}; this hook binds them to React
 * state.
 */
export function useMoveDraft(
	initialType: MoveType,
	initialFields: () => DraftFields,
): MoveDraftForm {
	const [type, setType] = useState<MoveType>(initialType);
	const [fields, setFields] = useState<DraftFields>(initialFields);
	const [nudge, setNudge] = useState(0);

	const draft = buildDraft(type, fields);
	const invalid =
		nudge > 0
			? new Set<MoveFieldKey>(invalidFields(type, fields))
			: new Set<MoveFieldKey>();

	const changeType = (next: MoveType) => {
		setType(next);
		setNudge(0);
	};

	const flagInvalid = (): InvalidFlagResult => {
		const attempt = nudge + 1;
		setNudge(attempt);
		return { missing: invalidFields(type, fields), attempt };
	};

	const resetValidation = () => setNudge(0);

	const reset = (nextFields: DraftFields, nextType?: MoveType) => {
		setFields(nextFields);
		if (nextType !== undefined) setType(nextType);
		setNudge(0);
	};

	return {
		type,
		fields,
		draft,
		invalid,
		nudge,
		setFields,
		changeType,
		flagInvalid,
		resetValidation,
		reset,
	};
}
