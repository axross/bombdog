"use client";

import { Dialog } from "radix-ui";
import { type JSX, useState } from "react";
import { WirePad } from "@/components/wire-pad/wire-pad";
import { useTrackerStore } from "@/lib/tracker-store";
import type { BlueWireValue, Player } from "@/lib/types";
import css from "./starting-info-editor.module.css";

/**
 * A player that placed a starting info token, paired with its current value.
 */
export interface EditableToken {
	player: Player;
	value: BlueWireValue;
}

/**
 * Props for {@link StartingInfoEditor}.
 */
interface StartingInfoEditorProps {
	/**
	 * The tokened players to edit, in seat order. The dialog only ever edits
	 * existing tokens, so this is never empty when the editor is mounted.
	 */
	tokens: EditableToken[];
	onClose: () => void;
}

/**
 * Modal that corrects the blue value of already-recorded starting info tokens.
 * It never adds a token for a player who placed none, nor clears one — the
 * blue-only {@link WirePad} ignores a tap on its active value, so a row can only
 * switch to a different value.
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
	// drive `open` locally so closing plays the exit animation before the parent
	// unmounts us, mirroring the move editor: Radix keeps the content mounted
	// while data-state="closed" animates, and onAnimationEnd hands back control.
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
		<Dialog.Root
			open={open}
			onOpenChange={(next) => {
				if (!next) setOpen(false);
			}}
		>
			<Dialog.Portal>
				<Dialog.Overlay className={css.overlay} />
				<Dialog.Content
					className={css.content}
					aria-describedby={undefined}
					data-testid="starting-info-editor"
					onAnimationEnd={(event) => {
						// unmount only after the exit animation on the content itself
						// (guard against the enter animation and bubbled child events).
						// the close path runs on the exit animation, which jsdom never
						// fires (Radix unmounts synchronously); it's covered by e2e.
						/* v8 ignore next */
						if (!open && event.target === event.currentTarget) onClose();
					}}
				>
					<Dialog.Title className={css.title}>Edit starting info</Dialog.Title>

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
						<Dialog.Close asChild>
							<button type="button" className={css.secondary}>
								Cancel
							</button>
						</Dialog.Close>
						<button
							type="button"
							className={css.primary}
							onClick={handleSave}
							data-testid="save-starting-info"
						>
							Save
						</button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
