"use client";

import { type JSX, useState } from "react";
import { BottomSheet } from "@/components/primitives/bottom-sheet/bottom-sheet";
import { Button } from "@/components/primitives/button/button";
import { WirePad } from "@/components/tracker/wire-pad/wire-pad";
import type { StartingInfoToken } from "@/hooks/use-starting-info-tokens";
import { useTrackerStore } from "@/lib/tracker-store";
import type { BlueWireValue } from "@/lib/types";
import css from "./starting-info-editor.module.css";

/**
 * Props for {@link StartingInfoEditor}.
 */
interface StartingInfoEditorProps {
	/**
	 * The tokened players to edit, in seat order. The dialog only ever edits
	 * existing tokens, so this is never empty when the editor is mounted.
	 */
	tokens: StartingInfoToken[];
	onClose: () => void;
}

/**
 * Modal that corrects the blue value of already-recorded starting info tokens.
 * Opens in the shared {@link BottomSheet} so it wears the same chrome and
 * motion as every other form-like modal. It never adds a token for a player
 * who placed none, nor clears one — the blue-only {@link WirePad} re-commits
 * its active value on a repeat tap, so a row can only switch to a different
 * value.
 */
export function StartingInfoEditor({
	tokens,
	onClose,
}: StartingInfoEditorProps): JSX.Element {
	const setInfoToken = useTrackerStore((s) => s.setInfoToken);
	// local draft so Cancel discards; seeded once from the current tokens.
	const [draft, setDraft] = useState<Record<string, BlueWireValue>>(() =>
		Object.fromEntries(tokens.map(({ player, value }) => [player.id, value])),
	);
	// drive `open` locally so closing plays the sheet's exit animation before
	// the parent unmounts us; BottomSheet reports the animation's end through
	// onCloseComplete (jsdom fires no CSS animations, so unit tests observe the
	// synchronous teardown instead — the close path is e2e-covered).
	const [open, setOpen] = useState(true);

	const setValue = (playerId: string, value: BlueWireValue) => {
		setDraft((prev) => ({ ...prev, [playerId]: value }));
	};

	const handleSave = () => {
		for (const { player, value } of tokens) {
			const next = draft[player.id];
			if (next !== value) setInfoToken(player.id, next);
		}
		setOpen(false);
	};

	return (
		<BottomSheet
			open={open}
			onOpenChange={(next) => {
				if (!next) setOpen(false);
			}}
			title="Edit starting info"
			data-testid="starting-info-editor"
			onCloseComplete={onClose}
		>
			<div className={css.rows}>
				{tokens.map(({ player }) => (
					<div
						key={player.id}
						className={css.row}
						data-testid="edit-info-token"
						data-player={player.name}
					>
						<WirePad
							label={player.name}
							value={draft[player.id] ?? null}
							onValueChange={(value) => {
								// the pad is blue-only with no "?" option, so only blue
								// values arrive; the guard also narrows to BlueWireValue.
								if (value === "yellow" || value === "unknown") return;
								setValue(player.id, value);
							}}
							blueOnly
						/>
					</div>
				))}
			</div>

			<div className={css.footer}>
				<Button variant="secondary" onClick={() => setOpen(false)}>
					Cancel
				</Button>
				<Button
					variant="primary"
					onClick={handleSave}
					data-testid="save-starting-info"
				>
					Save
				</Button>
			</div>
		</BottomSheet>
	);
}
