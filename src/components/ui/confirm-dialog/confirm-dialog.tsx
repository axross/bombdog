"use client";

import { clsx } from "clsx";
import { AlertDialog } from "radix-ui";
import type { JSX, ReactNode } from "react";
import { Button } from "@/components/ui/button/button";
import css from "./confirm-dialog.module.css";

/**
 * Props for {@link ConfirmDialog}.
 */
interface ConfirmDialogProps {
	/**
	 * The element that opens the dialog, rendered via Radix `asChild` — pass a
	 * {@link Button} (or any focusable element) and it becomes the trigger.
	 */
	trigger: ReactNode;
	title: string;
	description: string;
	/**
	 * Label of the destructive confirm action.
	 */
	confirmLabel: string;
	cancelLabel?: string;
	onConfirm: () => void;
	/**
	 * Raise the dialog above an open bottom sheet (which sits at z-index 40/50)
	 * instead of the default base level.
	 */
	elevated?: boolean;
	"data-testid"?: string;
	/**
	 * Test id of the confirm action button.
	 */
	confirmTestId?: string;
}

/**
 * A centered confirmation dialog for destructive actions, built on Radix
 * AlertDialog: scrim overlay, fade-and-zoom motion (with a reduced-motion
 * fallback), and a Cancel + danger confirm action pair.
 */
export function ConfirmDialog({
	trigger,
	title,
	description,
	confirmLabel,
	cancelLabel = "Cancel",
	onConfirm,
	elevated = false,
	"data-testid": dataTestId,
	confirmTestId,
}: ConfirmDialogProps): JSX.Element {
	return (
		<AlertDialog.Root>
			<AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
			<AlertDialog.Portal>
				<AlertDialog.Overlay
					className={clsx(css.overlay, elevated && css.overlayElevated)}
				/>
				<AlertDialog.Content
					className={clsx(css.content, elevated && css.contentElevated)}
					data-testid={dataTestId}
				>
					<AlertDialog.Title className={css.title}>{title}</AlertDialog.Title>
					<AlertDialog.Description className={css.description}>
						{description}
					</AlertDialog.Description>
					<div className={css.actions}>
						<AlertDialog.Cancel asChild>
							<Button variant="secondary">{cancelLabel}</Button>
						</AlertDialog.Cancel>
						<AlertDialog.Action asChild>
							<Button
								variant="danger"
								onClick={onConfirm}
								data-testid={confirmTestId}
							>
								{confirmLabel}
							</Button>
						</AlertDialog.Action>
					</div>
				</AlertDialog.Content>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	);
}
