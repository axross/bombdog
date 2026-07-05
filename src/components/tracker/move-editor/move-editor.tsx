"use client";

import { Trash2 } from "lucide-react";
import { type JSX, useState } from "react";
import { MoveForm } from "@/components/tracker/move-form/move-form";
import { BottomSheet } from "@/components/ui/bottom-sheet/bottom-sheet";
import { Button } from "@/components/ui/button/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog/confirm-dialog";
import { buildDraft, fieldsFromMove } from "@/lib/move-draft";
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
				{/* Destructive action kept opposite the primary Save so it is not
				    tapped by reflex; the confirm dialog sits above the editor sheet. */}
				<ConfirmDialog
					trigger={
						<Button variant="danger-ghost" data-testid="delete">
							<Trash2 size={15} aria-hidden />
							Delete
						</Button>
					}
					title={`Delete move #${move.seq}?`}
					description="This removes the move from the history. It can't be undone."
					confirmLabel="Delete"
					onConfirm={handleDelete}
					elevated
					data-testid="delete-dialog"
					confirmTestId="delete-confirm"
				/>
				<div className={css.actions}>
					<Button variant="secondary" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={handleSave}
						disabled={!draft}
						data-testid="save"
					>
						Save
					</Button>
				</div>
			</div>
		</BottomSheet>
	);
}
