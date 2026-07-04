"use client";

import type { JSX } from "react";
import { formatWire, wireLabel } from "@/lib/game";
import { useTrackerStore } from "@/lib/tracker-store";
import type { BlueWireValue, Player } from "@/lib/types";
import css from "./starting-info.module.css";

/**
 * A player who placed a starting info token, paired with its revealed value.
 */
interface TokenEntry {
	player: Player;
	value: BlueWireValue;
}

/**
 * The starting info tokens strip: a persistent, pinned reference showing the
 * blue wire each player revealed with their info token at game start. Renders
 * nothing when no tokens were recorded (the phase was skipped or none were
 * selected), so it costs no space in that case.
 */
export function StartingInfo(): JSX.Element | null {
	const players = useTrackerStore((s) => s.players);
	const infoTokens = useTrackerStore((s) => s.infoTokens);

	const tokens: TokenEntry[] = players
		.map((player) => ({ player, value: infoTokens[player.id] }))
		.filter((entry): entry is TokenEntry => entry.value != null);

	if (tokens.length === 0) return null;

	return (
		<section
			className={css.startingInfo}
			aria-label="Starting info tokens"
			data-testid="starting-info"
		>
			<span className={css.label}>Starting info</span>
			<ul className={css.list}>
				{tokens.map(({ player, value }) => (
					<li
						key={player.id}
						className={css.item}
						data-testid="starting-info-token"
						data-player={player.name}
					>
						<span className={css.name}>{player.name}</span>
						<span role="img" className={css.chip} aria-label={wireLabel(value)}>
							{formatWire(value)}
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}
