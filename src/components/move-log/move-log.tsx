"use client";

import { clsx } from "clsx";
import { ArrowRight, Check, Pencil, X } from "lucide-react";
import { type JSX, useEffect, useMemo, useRef, useState } from "react";
import { MoveEditor } from "@/components/move-editor/move-editor";
import { filterMoves, formatWire, getPlayerName, wireLabel } from "@/lib/game";
import { useTrackerStore } from "@/lib/tracker-store";
import {
	detectorOption,
	type MoveFilter as Filter,
	type Move,
	type MoveType,
	type Player,
	type RevealedWire,
	type WireValueOrUnknown,
} from "@/lib/types";
import css from "./move-log.module.css";

const KIND_LABEL: Record<MoveType, string> = {
	"dual-cut": "Dual cut",
	"solo-cut": "Solo cut",
	detector: "Detectors",
	equipment: "Equipment",
};

/**
 *
 * The action label shown on a row; detectors name the specific card used.
 *
 */
function kindLabel(move: Move): string {
	return move.type === "detector"
		? detectorOption(move.detector).label
		: KIND_LABEL[move.type];
}

const CHIP_VARIANT: Record<"blue" | "yellow" | "unknown", string> = {
	blue: css.chipBlue,
	yellow: css.chipYellow,
	unknown: css.chipUnknown,
};

/**
 *
 * A wire value shown as a colour-coded chip: blue, yellow, or "?" (unknown).
 *
 */
function WireChip({ value }: { value: WireValueOrUnknown }): JSX.Element {
	const variant =
		value === "unknown" ? "unknown" : value === "yellow" ? "yellow" : "blue";
	return (
		<span
			role="img"
			className={clsx(css.chip, CHIP_VARIANT[variant])}
			aria-label={wireLabel(value)}
		>
			{formatWire(value)}
		</span>
	);
}

/**
 *
 * Success/fail badge for a guess-based move. On a failure with a known
 * `revealed` value, the badge also shows that value (e.g. "fail (8)").
 *
 */
function OutcomeBadge({
	outcome,
	revealed,
}: {
	outcome: "success" | "fail";
	revealed?: RevealedWire;
}): JSX.Element {
	const showReveal = outcome === "fail" && revealed !== undefined;
	const Icon = outcome === "success" ? Check : X;
	const text =
		outcome === "success"
			? "success"
			: showReveal
				? `fail (${formatWire(revealed)})`
				: "fail";
	return (
		<span
			className={clsx(
				css.badge,
				outcome === "success" ? css.success : css.fail,
			)}
			data-testid="badge"
			data-outcome={outcome}
			data-revealed={showReveal ? formatWire(revealed) : undefined}
		>
			<Icon size={14} aria-hidden />
			{text}
		</span>
	);
}

/**
 *
 * The move-type-specific detail: wire chip(s) plus, for guess-based moves, an
 * outcome badge; equipment shows its name and optional note instead.
 *
 */
function MoveDetail({ move }: { move: Move }): JSX.Element {
	switch (move.type) {
		case "dual-cut":
			return (
				<>
					<WireChip value={move.value} />
					<OutcomeBadge outcome={move.outcome} revealed={move.revealed} />
				</>
			);
		case "detector":
			return (
				<>
					{move.values.map((value) => (
						<WireChip key={value} value={value} />
					))}
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

/**
 *
 * A single row in the history: sequence number, actor (and target, for moves
 * that have one), the action label, its detail, and an edit control.
 *
 */
function MoveRow({
	move,
	players,
	onEdit,
}: {
	move: Move;
	players: Player[];
	onEdit: () => void;
}): JSX.Element {
	const hasTarget = move.type === "dual-cut" || move.type === "detector";
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
							<ArrowRight className={css.arrow} size={16} aria-hidden />
							<span className={css.actor}>
								{getPlayerName(players, move.targetId)}
							</span>
						</>
					)}
					<span className={css.kind}>{kindLabel(move)}</span>
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
				<Pencil size={15} aria-hidden />
				<span className={css.editText}>Edit</span>
			</button>
		</div>
	);
}

/**
 *
 * Top-half chronological history (oldest → newest), auto-scrolled to the end.
 * The `filter` is owned by the shell so its trigger can live in the header.
 *
 */
export function MoveLog({ filter }: { filter: Filter }): JSX.Element {
	const players = useTrackerStore((s) => s.players);
	const moves = useTrackerStore((s) => s.moves);
	const [editingId, setEditingId] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const prevCount = useRef(0);

	const visibleMoves = useMemo(
		() => filterMoves(moves, filter),
		[moves, filter],
	);

	// keep the newest visible move (bottom) in view only when the list *grows*
	// (a move was logged). toggling a filter can shrink the list; re-scrolling
	// then would yank a user reading earlier history back to the bottom.
	useEffect(() => {
		const count = visibleMoves.length;
		const grew = count > prevCount.current;
		prevCount.current = count;
		if (!grew) return;
		const el = scrollRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [visibleMoves.length]);

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
				) : visibleMoves.length === 0 ? (
					<p className={css.empty} data-testid="filtered-empty">
						No moves match the filter.
					</p>
				) : (
					<ol className={css.list}>
						{visibleMoves.map((move) => (
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
					// runs on the editor's exit animation (e2e-covered; jsdom unmounts
					// the dialog synchronously, so the close callback never fires here).
					/* v8 ignore next */
					onClose={() => setEditingId(null)}
				/>
			)}
		</section>
	);
}
