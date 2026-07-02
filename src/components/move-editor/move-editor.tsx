"use client";

import { Dialog } from "radix-ui";
import { type JSX, useState } from "react";
import { buildDraft, fieldsFromMove } from "@/components/move-form/draft";
import { MoveForm } from "@/components/move-form/move-form";
import { useTrackerStore } from "@/lib/tracker-store";
import type { Move, Player } from "@/lib/types";
import css from "./move-editor.module.css";

/** Props for {@link MoveEditor}. */
interface MoveEditorProps {
	/** The move being edited. Mount with `key={move.id}` so state resets per move. */
	move: Move;
	players: Player[];
	onClose: () => void;
}

/** Modal editor that corrects a logged move in place (action kind is fixed). */
export function MoveEditor({
	move,
	players,
	onClose,
}: MoveEditorProps): JSX.Element {
	const updateMove = useTrackerStore((s) => s.updateMove);
	const [fields, setFields] = useState(() => fieldsFromMove(move));
	// drive `open` locally so closing plays the exit animation before the parent
	// unmounts us: Radix keeps the content mounted while data-state="closed"
	// animates, and onAnimationEnd then hands control back to the parent.
	const [open, setOpen] = useState(true);

	const draft = buildDraft(move.type, fields);

	const handleSave = () => {
		if (!draft) return;
		updateMove(move.id, draft);
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
					data-testid="move-editor"
					onAnimationEnd={(event) => {
						// unmount only after the exit animation on the content itself
						// (guard against the enter animation and bubbled child events).
						// the close path runs on the exit animation, which jsdom never
						// fires (Radix unmounts synchronously); it's covered by e2e.
						/* v8 ignore next */
						if (!open && event.target === event.currentTarget) onClose();
					}}
				>
					<Dialog.Title className={css.title}>
						Edit move #{move.seq}
					</Dialog.Title>

					<MoveForm
						players={players}
						type={move.type}
						fields={fields}
						onFieldsChange={setFields}
					/>

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
							disabled={!draft}
							data-testid="save"
						>
							Save
						</button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
