"use client";

import { Dialog } from "radix-ui";
import { useState } from "react";
import { buildDraft, fieldsFromMove } from "@/components/MoveForm/draft";
import { MoveForm } from "@/components/MoveForm/MoveForm";
import { useTrackerStore } from "@/lib/trackerStore";
import type { Move, Player } from "@/lib/types";
import styles from "./MoveEditor.module.css";

interface MoveEditorProps {
	/** The move being edited. Mount with `key={move.id}` so state resets per move. */
	move: Move;
	players: Player[];
	onClose: () => void;
}

/** Modal editor that corrects a logged move in place (action kind is fixed). */
export function MoveEditor({ move, players, onClose }: MoveEditorProps) {
	const updateMove = useTrackerStore((s) => s.updateMove);
	const [fields, setFields] = useState(() => fieldsFromMove(move));

	const draft = buildDraft(move.type, fields);

	const handleSave = () => {
		if (!draft) return;
		updateMove(move.id, draft);
		onClose();
	};

	return (
		<Dialog.Root
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<Dialog.Portal>
				<Dialog.Overlay className={styles.overlay} />
				<Dialog.Content className={styles.content} aria-describedby={undefined}>
					<Dialog.Title className={styles.title}>
						Edit move #{move.seq}
					</Dialog.Title>

					<MoveForm
						players={players}
						type={move.type}
						fields={fields}
						onFieldsChange={setFields}
					/>

					<div className={styles.footer}>
						<Dialog.Close asChild>
							<button type="button" className={styles.secondary}>
								Cancel
							</button>
						</Dialog.Close>
						<button
							type="button"
							className={styles.primary}
							onClick={handleSave}
							disabled={!draft}
						>
							Save
						</button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
