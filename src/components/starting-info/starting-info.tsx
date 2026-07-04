"use client";

import { Pencil } from "lucide-react";
import { type JSX, useState } from "react";
import { StartingInfoEditor } from "@/components/starting-info-editor/starting-info-editor";
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
	const [editing, setEditing] = useState(false);

	const tokens: TokenEntry[] = players
		.map((player) => ({ player, value: infoTokens[player.id] }))
		.filter((entry): entry is TokenEntry => entry.value != null);

	if (tokens.length === 0) return null;

	return (
		<>
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
							<span
								role="img"
								className={css.chip}
								aria-label={wireLabel(value)}
							>
								{formatWire(value)}
							</span>
						</li>
					))}
				</ul>
				<button
					type="button"
					className={css.edit}
					onClick={() => setEditing(true)}
					aria-label="Edit starting info tokens"
					data-testid="edit-starting-info"
				>
					<Pencil size={15} aria-hidden />
				</button>
			</section>

			{editing && (
				<StartingInfoEditor
					tokens={tokens}
					// runs on the editor's exit animation (e2e-covered; jsdom unmounts
					// the dialog synchronously, so the close callback never fires here).
					/* v8 ignore next */
					onClose={() => setEditing(false)}
				/>
			)}
		</>
	);
}
