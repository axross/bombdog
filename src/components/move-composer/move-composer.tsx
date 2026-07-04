"use client";

import { clsx } from "clsx";
import { ChevronDown, ChevronUp, Redo2, Undo2 } from "lucide-react";
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
 * Bottom-half form to log the next move, with undo/redo.
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

	const [type, setType] = useState<MoveType>("dual-cut");
	const [collapsed, setCollapsed] = useState(false);
	const [fields, setFields] = useState<DraftFields>(() =>
		emptyDraftFields(suggestedActor),
	);

	const draft = buildDraft(type, fields);

	const handleTypeChange = (next: MoveType) => {
		setType(next);
	};

	/**
	 * Log the built draft, then reset the form for the next move, seeding the
	 * suggested actor from the same {@link nextActorId} rule a reloaded log runs
	 * through so the live suggestion matches what a reload would show.
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
		<form
			className={css.composer}
			onSubmit={handleSubmit}
			aria-label="Log a move"
			data-testid="composer"
		>
			{/* kept mounted and animated (grid-rows 1fr↔0fr) so the composer height
			    interpolates and the flex-sibling move log grows/shrinks in step.
			    `inert` removes the collapsed form from tab order + a11y tree. */}
			<div
				className={clsx(css.collapsible, collapsed && css.collapsed)}
				inert={collapsed}
			>
				<div className={css.collapsibleInner}>
					<MoveForm
						players={players}
						type={type}
						onTypeChange={handleTypeChange}
						fields={fields}
						onFieldsChange={setFields}
					/>
				</div>
			</div>

			<div className={css.actions}>
				<div className={css.history}>
					<button
						type="button"
						className={clsx(css.icon, css.toggle)}
						onClick={() => setCollapsed((c) => !c)}
						aria-label={collapsed ? "Expand composer" : "Collapse composer"}
						aria-expanded={!collapsed}
						data-testid="toggle-composer"
					>
						{collapsed ? (
							<ChevronUp size={20} aria-hidden />
						) : (
							<ChevronDown size={20} aria-hidden />
						)}
					</button>
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
					type="submit"
					className={clsx(css.primary, collapsed && css.hidden)}
					disabled={!draft}
					inert={collapsed}
					data-testid="log-move"
				>
					Log move
				</button>
			</div>
		</form>
	);
}
