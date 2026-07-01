"use client";

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

/** Bottom-half form to log the next move, with undo/redo. */
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
	const [fields, setFields] = useState<DraftFields>(() =>
		emptyDraftFields(suggestedActor),
	);

	const draft = buildDraft(type, fields);

	const seatAfter = (actorId: string): string => {
		const seat = players.findIndex((p) => p.id === actorId);
		const nextSeat = seat === -1 ? 0 : (seat + 1) % players.length;
		return players[nextSeat]?.id ?? actorId;
	};

	const handleTypeChange = (next: MoveType) => {
		setType(next);
		// Detectors are blue-only: drop an incompatible yellow selection.
		if (next === "double-detector" && fields.value === "yellow") {
			setFields({ ...fields, value: null });
		}
	};

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!draft) return;
		addMove(draft);
		// Prepare for the next turn: advance the suggested actor, clear inputs.
		setFields(emptyDraftFields(seatAfter(fields.actorId)));
	};

	return (
		<form
			className={css.composer}
			onSubmit={handleSubmit}
			aria-label="Log a move"
			data-testid="composer"
		>
			<MoveForm
				players={players}
				type={type}
				onTypeChange={handleTypeChange}
				fields={fields}
				onFieldsChange={setFields}
			/>

			<div className={css.actions}>
				<div className={css.history}>
					<button
						type="button"
						className={css.secondary}
						onClick={undoLastMove}
						disabled={moves.length === 0}
						data-testid="undo"
					>
						↶ Undo
					</button>
					<button
						type="button"
						className={css.secondary}
						onClick={redoMove}
						disabled={redoCount === 0}
						data-testid="redo"
					>
						↷ Redo
					</button>
				</div>
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
	);
}
