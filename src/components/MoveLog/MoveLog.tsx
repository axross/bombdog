"use client";

import { useEffect, useRef, useState } from "react";
import { MoveEditor } from "@/components/MoveEditor/MoveEditor";
import { getPlayerName } from "@/lib/game";
import { useTrackerStore } from "@/lib/trackerStore";
import type { Move, MoveType, Player, WireValue } from "@/lib/types";
import styles from "./MoveLog.module.css";

const KIND_LABEL: Record<MoveType, string> = {
	"dual-cut": "Dual cut",
	"solo-cut": "Solo cut",
	"double-detector": "Double detector",
	equipment: "Equipment",
};

function WireChip({ value }: { value: WireValue }) {
	const isYellow = value === "yellow";
	return (
		<span
			role="img"
			className={`${styles.chip} ${isYellow ? styles.chipYellow : styles.chipBlue}`}
			aria-label={isYellow ? "Yellow wire" : `Wire ${value}`}
		>
			{isYellow ? "Y" : value}
		</span>
	);
}

function OutcomeBadge({ outcome }: { outcome: "success" | "fail" }) {
	return (
		<span
			className={`${styles.badge} ${outcome === "success" ? styles.success : styles.fail}`}
		>
			{outcome === "success" ? "✔ success" : "✕ fail"}
		</span>
	);
}

function MoveDetail({ move }: { move: Move }) {
	switch (move.type) {
		case "dual-cut":
			return (
				<>
					<WireChip value={move.value} />
					<OutcomeBadge outcome={move.outcome} />
				</>
			);
		case "double-detector":
			return (
				<>
					<WireChip value={move.value} />
					<OutcomeBadge outcome={move.outcome} />
				</>
			);
		case "solo-cut":
			return <WireChip value={move.value} />;
		case "equipment":
			return (
				<span className={styles.equipment}>
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
}) {
	const hasTarget = move.type === "dual-cut" || move.type === "double-detector";
	return (
		<div className={styles.row}>
			<span className={styles.seq}>#{move.seq}</span>
			<div className={styles.content}>
				<div className={styles.headline}>
					<span className={styles.actor}>
						{getPlayerName(players, move.actorId)}
					</span>
					{hasTarget && (
						<>
							<span className={styles.arrow} aria-hidden="true">
								→
							</span>
							<span className={styles.actor}>
								{getPlayerName(players, move.targetId)}
							</span>
						</>
					)}
					<span className={styles.kind}>{KIND_LABEL[move.type]}</span>
				</div>
				<div className={styles.detail}>
					<MoveDetail move={move} />
				</div>
			</div>
			<button
				type="button"
				className={styles.edit}
				onClick={onEdit}
				aria-label={`Edit move #${move.seq}`}
			>
				✎<span className={styles.editText}> Edit</span>
			</button>
		</div>
	);
}

/** Top-half chronological history (oldest → newest), auto-scrolled to the end. */
export function MoveLog() {
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
		<section className={styles.log} aria-label="Move history">
			<div className={styles.scroll} ref={scrollRef}>
				{moves.length === 0 ? (
					<p className={styles.empty}>
						No moves yet. Log the first turn below.
					</p>
				) : (
					<ol className={styles.list}>
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
