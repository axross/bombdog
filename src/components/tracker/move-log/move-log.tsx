"use client";

import { clsx } from "clsx";
import { ArrowRight, Check, Pencil, X } from "lucide-react";
import { type JSX, useEffect, useRef, useState } from "react";
import { Button } from "@/components/primitives/button/button";
import { MoveEditor } from "@/components/tracker/move-editor/move-editor";
import { StartingInfo } from "@/components/tracker/starting-info/starting-info";
import { WireChip } from "@/components/tracker/wire-chip/wire-chip";
import { useFilteredMoves } from "@/hooks/use-filtered-moves";
import { formatWire, getPlayerName } from "@/lib/game";
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
	equipment: "Misc",
};

/**
 * The action label shown on a row; detectors name the specific card used.
 */
function kindLabel(move: Move): string {
	return move.type === "detector"
		? detectorOption(move.detector).label
		: KIND_LABEL[move.type];
}

/**
 * Success/fail badge for a guess-based move. On a failure with a known
 * `revealed` value, the badge also shows that value (e.g. "fail (8)"). On a
 * successful X or Y Ray, `cut` names which of the two candidates was cut, shown
 * the same way (e.g. "success (8)").
 */
function OutcomeBadge({
	outcome,
	revealed,
	cut,
}: {
	outcome: "success" | "fail";
	revealed?: RevealedWire;
	cut?: WireValueOrUnknown;
}): JSX.Element {
	const showReveal = outcome === "fail" && revealed !== undefined;
	const showCut = outcome === "success" && cut !== undefined;
	const Icon = outcome === "success" ? Check : X;
	const text =
		outcome === "success"
			? showCut
				? `success (${formatWire(cut)})`
				: "success"
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
			data-cut={showCut ? formatWire(cut) : undefined}
		>
			<Icon size={14} aria-hidden />
			{text}
		</span>
	);
}

/**
 * The move-type-specific detail: wire chip(s) plus, for guess-based moves, an
 * outcome badge; equipment shows its name and optional note, and the
 * structured cards add their facts — the Post-it's revealed wire chip, the
 * General Radar's announced chip plus holder names (or "no one").
 */
function MoveDetail({
	move,
	players,
}: {
	move: Move;
	players: Player[];
}): JSX.Element {
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
					<OutcomeBadge
						outcome={move.outcome}
						revealed={move.revealed}
						cut={move.cutValue}
					/>
				</>
			);
		case "solo-cut":
			return <WireChip value={move.value} />;
		case "equipment":
			return (
				<>
					<span className={css.equipment}>{move.equipment}</span>
					{move.value !== undefined && <WireChip value={move.value} />}
					{move.holderIds !== undefined && (
						<span className={css.equipment} data-testid="equipment-holders">
							{move.holderIds.length > 0
								? move.holderIds
										.map((id) => getPlayerName(players, id))
										.join(", ")
								: "no one"}
						</span>
					)}
					{move.note && <span className={css.equipment}>— {move.note}</span>}
				</>
			);
	}
}

/**
 * The outcome category driving a row's thin left-edge accent, derived purely
 * from the already-recorded move (no new state is stored). Cuts read green when
 * they succeed and red when they fail; a solo cut is always a safe (successful)
 * cut, and free-text equipment is a neutral, non-outcome action. Detectors
 * resolve like an extended dual cut, so they follow the same success/fail split.
 */
function rowAccent(move: Move): "success" | "fail" | "neutral" {
	switch (move.type) {
		case "dual-cut":
		case "detector":
			return move.outcome === "success" ? "success" : "fail";
		case "solo-cut":
			return "success";
		case "equipment":
			return "neutral";
	}
}

/**
 * A single row in the history: sequence number, actor (and target, for moves
 * that have one), the action label, its detail, and an edit control.
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
	// the row shows a target for moves that record one: cuts and detectors
	// always do; equipment does only for the structured Post-it.
	const targetId = move.type === "solo-cut" ? undefined : move.targetId;
	return (
		<div
			className={css.row}
			data-testid="move"
			data-seq={move.seq}
			data-accent={rowAccent(move)}
		>
			<span className={css.seq}>#{move.seq}</span>
			<div className={css.content}>
				<div className={css.headline}>
					<span className={css.actor}>
						{getPlayerName(players, move.actorId)}
					</span>
					{targetId !== undefined && (
						<>
							<ArrowRight className={css.arrow} size={16} aria-hidden />
							<span className={css.actor}>
								{getPlayerName(players, targetId)}
							</span>
						</>
					)}
					<span className={css.kind}>{kindLabel(move)}</span>
				</div>
				<div className={css.detail}>
					<MoveDetail move={move} players={players} />
				</div>
			</div>
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={onEdit}
				aria-label={`Edit move #${move.seq}`}
				data-testid="edit"
			>
				<Pencil size={15} aria-hidden />
			</Button>
		</div>
	);
}

/**
 * Top-half chronological history (oldest → newest), auto-scrolled to the end.
 * The `filter` is owned by the shell so its trigger can live in the header.
 */
export function MoveLog({ filter }: { filter: Filter }): JSX.Element {
	const players = useTrackerStore((s) => s.players);
	const moves = useTrackerStore((s) => s.moves);
	const [editingId, setEditingId] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const prevCount = useRef(0);

	const visibleMoves = useFilteredMoves(filter);

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
				{/* Starting info tokens head the scrollable history and scroll away with
				    it (not pinned); renders nothing when none were placed. */}
				<StartingInfo />
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
