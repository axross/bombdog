"use client";

import { Redo2, Undo2 } from "lucide-react";
import { Dialog } from "radix-ui";
import { type JSX, useState } from "react";
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
 * The resting bottom bar (undo/redo plus an Add move button) and the modal
 * composer sheet it opens. The sheet reuses the reveal-dialog / move-editor
 * look and motion; logging a move keeps it open and resets the form so moves
 * can be entered back-to-back.
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

	const handleTypeChange = (next: MoveType) => {
		setType(next);
	};

	/**
	 * Seed a fresh draft with the current suggested actor each time the sheet
	 * opens, so a stale half-filled draft never carries over between sessions.
	 */
	const handleOpenChange = (next: boolean) => {
		if (next) setFields(emptyDraftFields(suggestedActor));
		setOpen(next);
	};

	/**
	 * Log the built draft, then reset the form for the next move — seeding the
	 * suggested actor from the same {@link nextActorId} rule a reloaded log runs
	 * through — and keep the sheet open for rapid back-to-back logging.
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
	};

	return (
		<>
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
					className={css.primary}
					onClick={() => handleOpenChange(true)}
					data-testid="add-move"
				>
					Add move
				</button>
			</div>

			<Dialog.Root open={open} onOpenChange={handleOpenChange}>
				<Dialog.Portal>
					<Dialog.Overlay className={css.overlay} />
					<Dialog.Content
						className={css.content}
						aria-describedby={undefined}
						data-testid="composer"
					>
						<Dialog.Title className={css.title}>Add move</Dialog.Title>
						<form
							className={css.form}
							onSubmit={handleSubmit}
							aria-label="Log a move"
						>
							<MoveForm
								players={players}
								type={type}
								onTypeChange={handleTypeChange}
								fields={fields}
								onFieldsChange={setFields}
							/>
							<div className={css.footer}>
								<button
									type="submit"
									className={css.primary}
									disabled={!draft}
									data-testid="log-move"
								>
									Log move
								</button>
							</div>
						</form>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</>
	);
}
