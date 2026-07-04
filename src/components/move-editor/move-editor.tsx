"use client";

import { Trash2 } from "lucide-react";
import { AlertDialog } from "radix-ui";
import { type JSX, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet/bottom-sheet";
import { buildDraft, fieldsFromMove } from "@/components/move-form/draft";
import { MoveForm } from "@/components/move-form/move-form";
import { useTrackerStore } from "@/lib/tracker-store";
import type { Move, Player } from "@/lib/types";
import css from "./move-editor.module.css";

/**
 * Props for {@link MoveEditor}.
 */
interface MoveEditorProps {
	/**
	 * The move being edited. Mount with `key={move.id}` so state resets per move.
	 */
	move: Move;
	players: Player[];
	onClose: () => void;
}

/**
 * Modal bottom sheet that corrects a logged move in place (action kind is
 * fixed). Closing (Save, Cancel, Escape, backdrop, or drag-to-dismiss) plays the
 * sheet's exit animation before the parent unmounts us, via
 * {@link BottomSheet}'s `onCloseComplete`.
 */
export function MoveEditor({
	move,
	players,
	onClose,
}: MoveEditorProps): JSX.Element {
	const updateMove = useTrackerStore((s) => s.updateMove);
	const removeMove = useTrackerStore((s) => s.removeMove);
	const [fields, setFields] = useState(() => fieldsFromMove(move));
	// drive `open` locally so closing plays the exit animation before the parent
	// unmounts us: onCloseComplete hands control back once the sheet has animated
	// out.
	const [open, setOpen] = useState(true);

	const draft = buildDraft(move.type, fields);

	const handleSave = () => {
		if (!draft) return;
		updateMove(move.id, draft);
		setOpen(false);
	};

	const handleDelete = () => {
		removeMove(move.id);
		setOpen(false);
	};

	return (
		<BottomSheet
			open={open}
			onOpenChange={(next) => {
				if (!next) setOpen(false);
			}}
			title={`Edit move #${move.seq}`}
			data-testid="move-editor"
			onCloseComplete={onClose}
		>
			<MoveForm
				players={players}
				type={move.type}
				fields={fields}
				onFieldsChange={setFields}
			/>

			<div className={css.footer}>
				<AlertDialog.Root>
					<AlertDialog.Trigger asChild>
						<button type="button" className={css.danger} data-testid="delete">
							<Trash2 size={15} aria-hidden />
							Delete
						</button>
					</AlertDialog.Trigger>
					<AlertDialog.Portal>
						<AlertDialog.Overlay className={css.confirmOverlay} />
						<AlertDialog.Content
							className={css.confirmContent}
							data-testid="delete-dialog"
						>
							<AlertDialog.Title className={css.confirmTitle}>
								Delete move #{move.seq}?
							</AlertDialog.Title>
							<AlertDialog.Description className={css.confirmDescription}>
								This removes the move from the history. It can't be undone.
							</AlertDialog.Description>
							<div className={css.confirmActions}>
								<AlertDialog.Cancel asChild>
									<button type="button" className={css.confirmCancel}>
										Cancel
									</button>
								</AlertDialog.Cancel>
								<AlertDialog.Action asChild>
									<button
										type="button"
										className={css.confirmDelete}
										onClick={handleDelete}
										data-testid="delete-confirm"
									>
										Delete
									</button>
								</AlertDialog.Action>
							</div>
						</AlertDialog.Content>
					</AlertDialog.Portal>
				</AlertDialog.Root>
				<div className={css.actions}>
					<button
						type="button"
						className={css.secondary}
						onClick={() => setOpen(false)}
					>
						Cancel
					</button>
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
			</div>
		</BottomSheet>
	);
}
