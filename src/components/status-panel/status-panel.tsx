"use client";

import type { JSX } from "react";
import {
	derivePlayerPossessions,
	deriveWireStatus,
	formatWire,
	type PlayerPossession,
	WIRE_COPIES,
	type WireStatusRow,
	wireLabel,
} from "@/lib/game";
import { useTrackerStore } from "@/lib/tracker-store";
import { BLUE_WIRE_VALUES, type WireValue } from "@/lib/types";
import css from "./status-panel.module.css";

/**
 * Every value a player card enumerates: the twelve blue numbers plus yellow.
 */
const HAND_VALUES: WireValue[] = [...BLUE_WIRE_VALUES, "yellow"];

/**
 * A wire's cut state, out of its four copies. Cuts always land in pairs (a
 * successful dual cut or detector removes two copies; a solo cut removes the
 * rest), so a value is only ever uncut, half-cut, or fully cut.
 */
function cutState(row: WireStatusRow): "uncut" | "half-cut" | "full-cut" {
	if (row.cut === 0) return "uncut";
	return row.cut === WIRE_COPIES ? "full-cut" : "half-cut";
}

/**
 * One wire's tile in the count strip: the value number over a 2×2 grid of
 * squares, one per physical copy, wearing the wire-state language — solid
 * while located (revealed by an info token or failed cut), dashed while in
 * play but unlocated, hollow once cut. Squares fill row-major: revealed
 * copies first, then hidden ones, then cut ones. The counts are announced
 * through the accessible name; the squares stay decorative.
 */
function WireTile({ row }: { row: WireStatusRow }): JSX.Element {
	const copyFill = (i: number): "revealed" | "hidden" | "cut" => {
		if (i < row.revealed) return "revealed";
		return i < row.uncut ? "hidden" : "cut";
	};
	const located = row.revealed > 0 ? `, ${row.revealed} located` : "";
	return (
		<li
			className={css.wireTile}
			data-testid="status-wire"
			data-value={row.value}
			data-cut={row.cut}
			data-uncut={row.uncut}
			data-revealed={row.revealed}
			data-state={cutState(row)}
		>
			<span
				role="img"
				className={css.wireFigure}
				aria-label={`${wireLabel(row.value)}: ${row.cut} of ${WIRE_COPIES} cut${located}`}
			>
				<span className={css.wireNumber} aria-hidden>
					{row.value}
				</span>
				<span className={css.copyGrid} aria-hidden>
					{Array.from({ length: WIRE_COPIES }, (_, i) => (
						<span
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length static square grid
							key={i}
							className={css.copy}
							data-fill={copyFill(i)}
						/>
					))}
				</span>
			</span>
		</li>
	);
}

/**
 * One player's possession card: their name, a "known wires" tally, and a chip
 * per value 1–12 + yellow — solid when the log proves the player holds an
 * uncut copy of that value, dashed while unknown.
 */
function PlayerCard({ player, values }: PlayerPossession): JSX.Element {
	const summary =
		values.length === 0
			? "no known wires"
			: `${values.length} known wire${values.length === 1 ? "" : "s"}`;
	return (
		<li
			className={css.playerCard}
			data-testid="status-player"
			data-player={player.name}
		>
			<div className={css.playerHead}>
				<span className={css.playerName}>{player.name}</span>
				<span className={css.playerSummary}>{summary}</span>
			</div>
			<div className={css.hand}>
				{HAND_VALUES.map((value) => {
					const held = values.includes(value);
					return (
						<span
							key={value}
							role="img"
							className={css.cell}
							data-testid="status-cell"
							data-value={value}
							data-held={held}
							aria-label={`${wireLabel(value)}: ${held ? "held" : "unknown"}`}
						>
							<span aria-hidden>{formatWire(value)}</span>
						</span>
					);
				})}
			</div>
		</li>
	);
}

/**
 * The Status tab: a deduction aid derived from the logged moves, in two
 * fact-based sections. **Wires** is a horizontal strip of the twelve blue
 * values showing how many of each value's four copies survive (uncut,
 * half-cut, or fully cut — cuts always land in pairs). **Players** lists every
 * player with the values 1–12 + yellow they are known to hold (from info
 * tokens, failed-cut reveals, Post-its, and General Radars).
 */
export function StatusPanel(): JSX.Element {
	const players = useTrackerStore((s) => s.players);
	const moves = useTrackerStore((s) => s.moves);
	const infoTokens = useTrackerStore((s) => s.infoTokens);

	const status = deriveWireStatus(players, moves, infoTokens);
	const possessions = derivePlayerPossessions(players, status);

	return (
		<section
			className={css.status}
			aria-label="Wire status"
			data-testid="status-panel"
		>
			<div className={css.scroll}>
				<section className={css.section} aria-labelledby="status-wires-label">
					<h2 className={css.sectionLabel} id="status-wires-label">
						Wires
					</h2>
					<ol className={css.wireStrip}>
						{status.blue.map((row) => (
							<WireTile key={row.value} row={row} />
						))}
					</ol>
				</section>

				<section className={css.section} aria-labelledby="status-players-label">
					<h2 className={css.sectionLabel} id="status-players-label">
						Players
					</h2>
					<ol className={css.playerList}>
						{possessions.map(({ player, values }) => (
							<PlayerCard key={player.id} player={player} values={values} />
						))}
					</ol>
				</section>
			</div>
		</section>
	);
}
