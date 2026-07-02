"use client";

import { AlertDialog } from "radix-ui";
import type { JSX } from "react";
import { useTrackerStore } from "@/lib/tracker-store";
import css from "./reset-button.module.css";

/** Clears the logged moves behind a confirmation, keeping the roster for reuse. */
export function ResetButton(): JSX.Element {
	const reset = useTrackerStore((s) => s.reset);

	return (
		<AlertDialog.Root>
			<AlertDialog.Trigger asChild>
				<button type="button" className={css.trigger} data-testid="reset">
					Reset
				</button>
			</AlertDialog.Trigger>
			<AlertDialog.Portal>
				<AlertDialog.Overlay className={css.overlay} />
				<AlertDialog.Content className={css.content} data-testid="reset-dialog">
					<AlertDialog.Title className={css.title}>
						Reset the tracker?
					</AlertDialog.Title>
					<AlertDialog.Description className={css.description}>
						This clears the logged moves and starts a new game. Your players
						carry over. It can't be undone.
					</AlertDialog.Description>
					<div className={css.actions}>
						<AlertDialog.Cancel asChild>
							<button type="button" className={css.cancel}>
								Cancel
							</button>
						</AlertDialog.Cancel>
						<AlertDialog.Action asChild>
							<button
								type="button"
								className={css.confirm}
								onClick={reset}
								data-testid="reset-confirm"
							>
								Reset
							</button>
						</AlertDialog.Action>
					</div>
				</AlertDialog.Content>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	);
}
