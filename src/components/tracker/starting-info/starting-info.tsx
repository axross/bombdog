"use client";

import { Pencil } from "lucide-react";
import { type JSX, useState } from "react";
import { StartingInfoEditor } from "@/components/tracker/starting-info-editor/starting-info-editor";
import { Button } from "@/components/ui/button/button";
import { WireChip } from "@/components/ui/wire-chip/wire-chip";
import { useStartingInfoTokens } from "@/hooks/use-starting-info-tokens";
import css from "./starting-info.module.css";

/**
 * The starting info tokens strip: a persistent, pinned reference showing the
 * blue wire each player revealed with their info token at game start. Renders
 * nothing when no tokens were recorded (the phase was skipped or none were
 * selected), so it costs no space in that case.
 */
export function StartingInfo(): JSX.Element | null {
	const tokens = useStartingInfoTokens();
	const [editing, setEditing] = useState(false);

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
							{/* info tokens indicate blue values only, so the chip is always
							    the blue variant, mirroring the move-log wire chips. */}
							<WireChip value={value} />
						</li>
					))}
				</ul>
				<Button
					variant="ghost"
					size="icon-sm"
					className={css.edit}
					onClick={() => setEditing(true)}
					aria-label="Edit starting info tokens"
					data-testid="edit-starting-info"
				>
					<Pencil size={15} aria-hidden />
				</Button>
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
