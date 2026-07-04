"use client";

import { Redo2, Undo2 } from "lucide-react";
import { Dialog } from "radix-ui";
import { type JSX, useRef, useState } from "react";
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
 * move" button; Add move opens the move-composer as a modal bottom sheet that
 * can be dragged down by its handle to dismiss. Logging a move keeps the sheet
 * open and resets the form so the next move can be entered right away, while the
 * bar (behind the modal overlay) resurfaces once the sheet closes.
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

	// Sheet drag state lives in refs and is written straight to the DOM (a CSS
	// custom property) so dragging never re-renders the form under the finger.
	const contentRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<{
		startY: number;
		pointerId: number;
		height: number;
	} | null>(null);

	const draft = buildDraft(type, fields);

	const setDragOffset = (px: number) => {
		contentRef.current?.style.setProperty("--composer-drag-y", `${px}px`);
	};

	/** Begin a drag from the handle; suspend the snap-back transition so the sheet
	 * tracks the finger 1:1. */
	const handleDragStart = (event: React.PointerEvent) => {
		const content = contentRef.current;
		if (!content) return;
		dragRef.current = {
			startY: event.clientY,
			pointerId: event.pointerId,
			height: content.offsetHeight,
		};
		event.currentTarget.setPointerCapture(event.pointerId);
		content.style.transition = "none";
	};

	const handleDragMove = (event: React.PointerEvent) => {
		const drag = dragRef.current;
		if (!drag || event.pointerId !== drag.pointerId) return;
		// only downward travel moves the sheet.
		setDragOffset(Math.max(0, event.clientY - drag.startY));
	};

	/** Release: dismiss past ~a third of the sheet height (capped so a tall sheet
	 * still closes on a firm drag), otherwise spring back to rest. */
	const handleDragEnd = (event: React.PointerEvent) => {
		const drag = dragRef.current;
		const content = contentRef.current;
		if (!drag || !content || event.pointerId !== drag.pointerId) return;
		dragRef.current = null;
		const dragged = Math.max(0, event.clientY - drag.startY);
		// restore the transition so the snap-back animates (and the next drag is
		// re-armed); on dismiss, the exit keyframe reads the offset we leave behind.
		content.style.transition = "";
		if (dragged > Math.min(drag.height * 0.35, 200)) {
			setOpen(false);
		} else {
			setDragOffset(0);
		}
	};

	/** Pointer cancel (e.g. an interrupted gesture): spring back, never dismiss. */
	const handleDragCancel = () => {
		if (!dragRef.current) return;
		dragRef.current = null;
		if (contentRef.current) contentRef.current.style.transition = "";
		setDragOffset(0);
	};

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
					className={css.primary}
					onClick={() => setOpen(true)}
					data-testid="add-move"
				>
					Add move
				</button>
			</div>

			<Dialog.Root open={open} onOpenChange={setOpen}>
				<Dialog.Portal>
					<Dialog.Overlay className={css.overlay} />
					<Dialog.Content
						ref={contentRef}
						className={css.content}
						aria-describedby={undefined}
						data-testid="composer"
					>
						{/* Grab handle + title form the drag region. Pointer drag is a
						    progressive enhancement; Escape and the overlay stay the
						    keyboard/click dismissal paths. */}
						<div
							className={css.grabber}
							onPointerDown={handleDragStart}
							onPointerMove={handleDragMove}
							onPointerUp={handleDragEnd}
							onPointerCancel={handleDragCancel}
							data-testid="composer-handle"
						>
							<span className={css.handle} aria-hidden />
							<Dialog.Title className={css.title}>Log a move</Dialog.Title>
						</div>
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
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</>
	);
}
