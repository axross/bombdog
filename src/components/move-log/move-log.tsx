"use client";

import { clsx } from "clsx";
import { type JSX, useEffect, useRef, useState } from "react";
import { MoveEditor } from "@/components/move-editor/move-editor";
import { formatRevealed, getPlayerName } from "@/lib/game";
import { useTrackerStore } from "@/lib/tracker-store";
import type {
	Move,
	MoveType,
	Player,
	RevealedWire,
	WireValue,
} from "@/lib/types";
import css from "./move-log.module.css";

const KIND_LABEL: Record<MoveType, string> = {
	"dual-cut": "Dual cut",
	"solo-cut": "Solo cut",
	"double-detector": "Double detector",
	equipment: "Equipment",
};

function WireChip({ value }: { value: WireValue }): JSX.Element {
	const isYellow = value === "yellow";
	return (
		<span
			role="img"
			className={clsx(css.chip, isYellow ? css.chipYellow : css.chipBlue)}
			aria-label={isYellow ? "Yellow wire" : `Wire ${value}`}
		>
			{isYellow ? "Y" : value}
		</span>
	);
}

function OutcomeBadge({
	outcome,
	revealed,
}: {
	outcome: "success" | "fail";
	revealed?: RevealedWire;
}): JSX.Element {
	const showReveal = outcome === "fail" && revealed !== undefined;
	return (
		<span
			className={clsx(
				css.badge,
				outcome === "success" ? css.success : css.fail,
			)}
			data-testid="badge"
			data-outcome={outcome}
			data-revealed={showReveal ? formatRevealed(revealed) : undefined}
		>
			{outcome === "success" ? "✔ success" : "✕ fail"}
			{showReveal ? ` (${formatRevealed(revealed)})` : ""}
		</span>
	);
}

function MoveDetail({ move }: { move: Move }): JSX.Element {
	switch (move.type) {
		case "dual-cut":
			return (
				<>
					<WireChip value={move.value} />
					<OutcomeBadge outcome={move.outcome} revealed={move.revealed} />
				</>
			);
		case "double-detector":
			return (
				<>
					<WireChip value={move.value} />
					<OutcomeBadge outcome={move.outcome} revealed={move.revealed} />
				</>
			);
		case "solo-cut":
			return <WireChip value={move.value} />;
		case "equipment":
			return (
				<span className={css.equipment}>
					{move.equipment}
					{move.note ? ` — ${move.note}` : ""}
				</span>
			);
	}
}

function MoveRow({
	move,
	players,
	onEdit,
}: {
	move: Move;
	players: Player[];
	onEdit: () => void;
}): JSX.Element {
	const hasTarget = move.type === "dual-cut" || move.type === "double-detector";
	return (
		<div className={css.row} data-testid="move" data-seq={move.seq}>
			<span className={css.seq}>#{move.seq}</span>
			<div className={css.content}>
				<div className={css.headline}>
					<span className={css.actor}>
						{getPlayerName(players, move.actorId)}
					</span>
					{hasTarget && (
						<>
							<span className={css.arrow} aria-hidden="true">
								→
							</span>
							<span className={css.actor}>
								{getPlayerName(players, move.targetId)}
							</span>
						</>
					)}
					<span className={css.kind}>{KIND_LABEL[move.type]}</span>
				</div>
				<div className={css.detail}>
					<MoveDetail move={move} />
				</div>
			</div>
			<button
				type="button"
				className={css.edit}
				onClick={onEdit}
				aria-label={`Edit move #${move.seq}`}
				data-testid="edit"
			>
				✎<span className={css.editText}> Edit</span>
			</button>
		</div>
	);
}

/** Top-half chronological history (oldest → newest), auto-scrolled to the end. */
export function MoveLog(): JSX.Element {
	const players = useTrackerStore((s) => s.players);
	const moves = useTrackerStore((s) => s.moves);
	const [editingId, setEditingId] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);

	// Keep the newest move (bottom) in view as the log grows.
	// biome-ignore lint/correctness/useExhaustiveDependencies: re-scroll when the move count changes
	useEffect(() => {
		const el = scrollRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [moves.length]);

	const editingMove = moves.find((m) => m.id === editingId) ?? null;

	return (
		<section
			className={css.log}
			aria-label="Move history"
			data-testid="move-log"
		>
			<div className={css.scroll} ref={scrollRef}>
				{moves.length === 0 ? (
					<p className={css.empty}>No moves yet. Log the first turn below.</p>
				) : (
					<ol className={css.list}>
						{moves.map((move) => (
							<li key={move.id}>
								<MoveRow
									move={move}
									players={players}
									onEdit={() => setEditingId(move.id)}
								/>
							</li>
						))}
					</ol>
				)}
			</div>

			{editingMove && (
				<MoveEditor
					key={editingMove.id}
					move={editingMove}
					players={players}
					onClose={() => setEditingId(null)}
				/>
			)}
		</section>
	);
}
