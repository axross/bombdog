"use client";

import { Redo2, Undo2 } from "lucide-react";
import { type JSX, useState } from "react";
import { MoveForm } from "@/components/tracker/move-form/move-form";
import { BottomSheet } from "@/components/ui/bottom-sheet/bottom-sheet";
import { Button } from "@/components/ui/button/button";
import { useMoveDraft } from "@/hooks/use-move-draft";
import { useNextActor } from "@/hooks/use-next-actor";
import { emptyDraftFields, type MoveFieldKey } from "@/lib/move-draft";
import { useTrackerStore } from "@/lib/tracker-store";
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
	const moves = useTrackerStore((s) => s.moves);
	const redoCount = useTrackerStore((s) => s.redoStack.length);
	const addMove = useTrackerStore((s) => s.addMove);
	const undoLastMove = useTrackerStore((s) => s.undoLastMove);
	const redoMove = useTrackerStore((s) => s.redoMove);

	const { suggestedActor, suggestAfterLogging } = useNextActor();
	const form = useMoveDraft("dual-cut", () => emptyDraftFields(suggestedActor));

	const [open, setOpen] = useState(false);
	// assertive message naming the fields that blocked the last press, for the
	// live region; cleared on a successful log or when the sheet closes.
	const [alert, setAlert] = useState("");

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		// clear any validation flags/announcement when the sheet is dismissed so
		// a reopen starts clean.
		if (!next) {
			form.resetValidation();
			setAlert("");
		}
	};

	/**
	 * Log the built draft, then reset the form for the next move. The sheet stays
	 * open for rapid consecutive logging; the suggested actor is seeded from the
	 * same rule a reloaded log runs through so the live suggestion matches what
	 * a reload would show.
	 */
	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		// Log move is always pressable, so validate on press: an incomplete move
		// flags its missing fields (a bumped nudge re-shakes them) and announces
		// them, rather than logging.
		if (!form.draft) {
			const { missing, attempt } = form.flagInvalid();
			// Re-announce on every failed press. A repeat press with the same missing
			// fields would set an identical string — React bails on the no-op state
			// update, the live region's DOM text never changes, and assertive screen
			// readers stay silent (regressing #26's "hears which fields need
			// attention"). A trailing zero-width space toggled per press keeps the
			// text changing while leaving the spoken wording untouched.
			const marker = attempt % 2 === 1 ? "\u200B" : "";
			setAlert(
				`Can't log yet — check: ${missing
					.map((key) => FIELD_LABELS[key])
					.join(", ")}.${marker}`,
			);
			return;
		}
		addMove(form.draft);
		setAlert("");
		// return the action tab to Dual cut — the most common move — so the next
		// turn's cut needs no tab switch; the fields reset seeded with the next
		// suggested actor.
		form.reset(emptyDraftFields(suggestAfterLogging(form.draft)), "dual-cut");
	};

	return (
		<>
			{/* Persistent bar behind any modal: undo/redo lead, Add move trails. */}
			<div className={css.bar} data-testid="composer-bar">
				<div className={css.history}>
					<Button
						size="icon"
						onClick={undoLastMove}
						disabled={moves.length === 0}
						aria-label="Undo"
						data-testid="undo"
					>
						<Undo2 size={20} aria-hidden />
					</Button>
					<Button
						size="icon"
						onClick={redoMove}
						disabled={redoCount === 0}
						aria-label="Redo"
						data-testid="redo"
					>
						<Redo2 size={20} aria-hidden />
					</Button>
				</div>
				{/* Neutral (gray) button: opening the composer is a low-emphasis
				    action, so it does not carry the accent — that is reserved for Log
				    move inside. */}
				<Button onClick={() => setOpen(true)} data-testid="add-move">
					Add move
				</Button>
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
						type={form.type}
						onTypeChange={form.changeType}
						fields={form.fields}
						onFieldsChange={form.setFields}
						invalid={form.invalid}
						nudge={form.nudge}
					/>
					{/* announces which fields blocked a failed Log move press; the shake
					    highlights carry the same information visually. */}
					<p role="status" aria-live="assertive" className={css.srOnly}>
						{alert}
					</p>
					<div className={css.actions}>
						{/* always pressable: an incomplete move is caught in handleSubmit,
						    which flags the missing fields instead of logging. */}
						<Button variant="primary" type="submit" data-testid="log-move">
							Log move
						</Button>
					</div>
				</form>
			</BottomSheet>
		</>
	);
}
