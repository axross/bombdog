"use client";

import { Redo2, Undo2 } from "lucide-react";
import { type JSX, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet/bottom-sheet";
import {
	buildDraft,
	type DraftFields,
	emptyDraftFields,
} from "@/components/move-form/draft";
import { MoveForm } from "@/components/move-form/move-form";
import { nextActorId } from "@/lib/game";
import { useTrackerStore } from "@/lib/tracker-store";
import type { MoveType } from "@/lib/types";
import css from "./move-composer.module.css";

/**
 * The tracker's bottom area. A persistent bar carries undo/redo and an "Add
 * move" button; Add move opens the move composer as a modal bottom sheet (shared
 * {@link BottomSheet}, draggable to dismiss). Logging a move keeps the sheet open
 * and resets the form so the next move can be entered right away, while the bar
 * (behind the modal overlay) resurfaces once the sheet closes.
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

	const draft = buildDraft(type, fields);

	/**
	 * Log the built draft, then reset the form for the next move. The sheet stays
	 * open for rapid consecutive logging; the suggested actor is seeded from the
	 * same {@link nextActorId} rule a reloaded log runs through so the live
	 * suggestion matches what a reload would show.
	 */
	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		// defensive: the submit button is disabled whenever `draft` is null.
		/* v8 ignore next */
		if (!draft) return;
		addMove(draft);
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
				onOpenChange={setOpen}
				title="New move"
				data-testid="composer"
			>
				<form className={css.form} onSubmit={handleSubmit}>
					<MoveForm
						players={players}
						type={type}
						onTypeChange={setType}
						fields={fields}
						onFieldsChange={setFields}
					/>
					<div className={css.actions}>
						<button
							type="submit"
							className={css.logButton}
							disabled={!draft}
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
