"use client";

import { Redo2, Undo2 } from "lucide-react";
import { type JSX, useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet/bottom-sheet";
import {
	buildDraft,
	type DraftFields,
	emptyDraftFields,
	invalidFields,
	type MoveFieldKey,
} from "@/lib/move-draft";
import { MoveForm } from "@/components/tracker/move-form/move-form";
import { nextActorId } from "@/lib/game";
import { useTrackerStore } from "@/lib/tracker-store";
import type { MoveType } from "@/lib/types";
import css from "./move-composer.module.css";

/**
 * Human labels for the fields a failed "Log move" can flag, used to announce
 * what needs attention to screen-reader users.
 */
const FIELD_LABELS: Record<MoveFieldKey, string> = {
	actor: "Acting",
	target: "Target",
	wire: "Wire",
	values: "Values",
	outcome: "Result",
	cutValue: "Actual value",
	equipment: "Equipment",
};

/**
 * The tracker's bottom area. A persistent bar carries undo/redo and an "Add
 * move" button; Add move opens the move composer as a modal bottom sheet (shared
 * {@link BottomSheet}, draggable to dismiss). Logging a move keeps the sheet open
 * and resets the form so the next move can be entered right away, while the bar
 * (behind the modal overlay) resurfaces once the sheet closes.
 *
 * Log move is always pressable: pressing it with an incomplete move flags the
 * unselected/missing/invalid fields (a shake plus a persistent danger label,
 * badge, and tint) and announces them, rather than logging.
 */
export function MoveComposer(): JSX.Element {
	const players = useTrackerStore((s) => s.players);
	const captainIndex = useTrackerStore((s) => s.captainIndex);
	const moves = useTrackerStore((s) => s.moves);
	const redoCount = useTrackerStore((s) => s.redoStack.length);
	const addMove = useTrackerStore((s) => s.addMove);
	const undoLastMove = useTrackerStore((s) => s.undoLastMove);
	const redoMove = useTrackerStore((s) => s.redoMove);

	const suggestedActor =
		nextActorId(players, captainIndex, moves) ?? players[0]?.id ?? "";

	const [open, setOpen] = useState(false);
	const [type, setType] = useState<MoveType>("dual-cut");
	const [fields, setFields] = useState<DraftFields>(() =>
		emptyDraftFields(suggestedActor),
	);
	// how many times Log move has been pressed with an incomplete move since the
	// last successful log. 0 means "not attempted yet" (no fields flagged); each
	// failed press bumps it to re-play the highlight shake on what's still invalid.
	const [nudge, setNudge] = useState(0);
	// assertive message naming the fields that blocked the last press, for the
	// live region; cleared on a successful log or when the sheet closes.
	const [alert, setAlert] = useState("");

	const draft = buildDraft(type, fields);
	// flag fields only after a failed press, and recompute live so each fix clears
	// its own highlight (UI=F(state)).
	const invalid =
		nudge > 0
			? new Set<MoveFieldKey>(invalidFields(type, fields))
			: new Set<MoveFieldKey>();

	// clear any validation flags/announcement — after a log, and when the sheet is
	// dismissed so a reopen starts clean.
	const clearValidation = () => {
		setNudge(0);
		setAlert("");
	};

	const handleTypeChange = (next: MoveType) => {
		setType(next);
		// a different action has different required fields, so clear any flags from
		// the previous action rather than flagging the new tab's fields pre-emptively.
		clearValidation();
	};

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) clearValidation();
	};

	/**
	 * Log the built draft, then reset the form for the next move. The sheet stays
	 * open for rapid consecutive logging; the suggested actor is seeded from the
	 * same {@link nextActorId} rule a reloaded log runs through so the live
	 * suggestion matches what a reload would show.
	 */
	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		// Log move is always pressable, so validate on press: an incomplete move
		// flags its missing fields (a bumped `nudge` re-shakes them) and announces
		// them, rather than logging.
		if (!draft) {
			const missing = invalidFields(type, fields);
			const next = nudge + 1;
			setNudge(next);
			// Re-announce on every failed press. A repeat press with the same missing
			// fields would set an identical string — React bails on the no-op state
			// update, the live region's DOM text never changes, and assertive screen
			// readers stay silent (regressing #26's "hears which fields need
			// attention"). A trailing zero-width space toggled per press keeps the
			// text changing while leaving the spoken wording untouched.
			const marker = next % 2 === 1 ? "\u200B" : "";
			setAlert(
				`Can't log yet — check: ${missing
					.map((key) => FIELD_LABELS[key])
					.join(", ")}.${marker}`,
			);
			return;
		}
		addMove(draft);
		// a successful log clears any prior validation flags/announcement.
		clearValidation();
		// suggest the next actor with the same rule the log rehydrates through:
		// append the just-logged move and ask nextActorId. it ignores equipment
		// (so the turn stays put) and advances clockwise for every other move —
		// one source of truth, so the live suggestion matches a reload. the id/
		// seq/at are placeholders: nextActorId only reads `type` and `actorId`.
		const suggested =
			nextActorId(players, captainIndex, [
				...moves,
				{ ...draft, id: "", seq: 0, at: 0 },
			]) ?? fields.actorId;
		setFields(emptyDraftFields(suggested));
		// return the action tab to Dual cut — the most common move — so the next
		// turn's cut needs no tab switch. only the type resets; the fields and
		// suggested actor above are the already-correct per-move resets.
		setType("dual-cut");
	};

	return (
		<>
			{/* Persistent bar behind any modal: undo/redo lead, Add move trails. */}
			<div className={css.bar} data-testid="composer-bar">
				<div className={css.history}>
					<button
						type="button"
						className={css.icon}
						onClick={undoLastMove}
						disabled={moves.length === 0}
						aria-label="Undo"
						data-testid="undo"
					>
						<Undo2 size={20} aria-hidden />
					</button>
					<button
						type="button"
						className={css.icon}
						onClick={redoMove}
						disabled={redoCount === 0}
						aria-label="Redo"
						data-testid="redo"
					>
						<Redo2 size={20} aria-hidden />
					</button>
				</div>
				<button
					type="button"
					className={css.addMove}
					onClick={() => setOpen(true)}
					data-testid="add-move"
				>
					Add move
				</button>
			</div>

			<BottomSheet
				open={open}
				onOpenChange={handleOpenChange}
				title="New move"
				data-testid="composer"
			>
				<form className={css.form} onSubmit={handleSubmit}>
					<MoveForm
						players={players}
						type={type}
						onTypeChange={handleTypeChange}
						fields={fields}
						onFieldsChange={setFields}
						invalid={invalid}
						nudge={nudge}
					/>
					{/* announces which fields blocked a failed Log move press; the shake
					    highlights carry the same information visually. */}
					<p role="status" aria-live="assertive" className={css.srOnly}>
						{alert}
					</p>
					<div className={css.actions}>
						{/* always pressable: an incomplete move is caught in handleSubmit,
						    which flags the missing fields instead of logging. */}
						<button
							type="submit"
							className={css.logButton}
							data-testid="log-move"
						>
							Log move
						</button>
					</div>
				</form>
			</BottomSheet>
		</>
	);
}
