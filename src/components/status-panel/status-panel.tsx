"use client";

import type { JSX } from "react";
import {
	deriveWireStatus,
	formatWire,
	WIRE_COPIES,
	wireLabel,
} from "@/lib/game";
import { useTrackerStore } from "@/lib/tracker-store";
import type { Player, WireValueOrUnknown } from "@/lib/types";
import css from "./status-panel.module.css";

/**
 * A value's cut/uncut fill, shown as four pips (filled = cut) with a compact
 * fraction. The accessible name carries the counts so the pips can stay
 * decorative — colour and fill are never the only signal.
 */
function CutMeter({ cut, uncut }: { cut: number; uncut: number }): JSX.Element {
	return (
		<span
			role="img"
			className={css.meter}
			data-testid="status-count"
			data-cut={cut}
			data-uncut={uncut}
			aria-label={`${cut} of ${WIRE_COPIES} cut, ${uncut} still in play`}
		>
			<span className={css.pips} aria-hidden>
				{Array.from({ length: WIRE_COPIES }, (_, i) => (
					<span
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length static pip row
						key={i}
						className={css.pip}
						data-filled={i < cut}
					/>
				))}
			</span>
			<span className={css.fraction} aria-hidden>
				{cut}/{WIRE_COPIES}
			</span>
		</span>
	);
}

/**
 * The players known to hold an uncut copy, as name badges. Renders a muted dash
 * when possession is unknown, so every row keeps the same shape.
 */
function Holders({ holders }: { holders: Player[] }): JSX.Element {
	if (holders.length === 0) {
		return (
			<span className={css.noHolders} aria-hidden>
				—
			</span>
		);
	}
	return (
		<span className={css.holders}>
			{holders.map((player) => (
				<span
					key={player.id}
					className={css.holder}
					data-testid="status-holder"
					data-player={player.name}
				>
					{player.name}
				</span>
			))}
		</span>
	);
}

/**
 * The Status tab: a deduction aid derived from the logged moves. Each blue value
 * 1–12 shows how many of its four copies are cut vs still in play, plus the
 * players known to hold an uncut copy; a trailing Yellow line lists known yellow
 * holders (yellow has no fixed copy count, so it shows possession only).
 */
export function StatusPanel(): JSX.Element {
	const players = useTrackerStore((s) => s.players);
	const moves = useTrackerStore((s) => s.moves);
	const infoTokens = useTrackerStore((s) => s.infoTokens);

	const { blue, yellowHolders } = deriveWireStatus(players, moves, infoTokens);

	return (
		<section
			className={css.status}
			aria-label="Wire status"
			data-testid="status-panel"
		>
			<div className={css.scroll}>
				<ol className={css.list}>
					{blue.map((row) => (
						<li
							key={row.value}
							className={css.row}
							data-testid="status-row"
							data-value={row.value}
						>
							<WireChip value={row.value} />
							<CutMeter cut={row.cut} uncut={row.uncut} />
							<Holders holders={row.holders} />
						</li>
					))}
				</ol>

				{yellowHolders.length > 0 && (
					<div className={css.yellow} data-testid="status-yellow">
						<WireChip value="yellow" />
						<span className={css.yellowLabel}>Yellow holders</span>
						<Holders holders={yellowHolders} />
					</div>
				)}
			</div>
		</section>
	);
}

/**
 * A wire-value chip, mirroring the move-log chips (blue for numbers, amber for
 * yellow). Local to the panel so the status view owns its own presentation.
 */
function WireChip({ value }: { value: WireValueOrUnknown }): JSX.Element {
	return (
		<span
			role="img"
			className={value === "yellow" ? css.chipYellow : css.chipBlue}
			aria-label={wireLabel(value)}
		>
			{formatWire(value)}
		</span>
	);
}
