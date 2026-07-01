"use client";

import { AlertDialog } from "radix-ui";
import { useTrackerStore } from "@/lib/trackerStore";
import styles from "./ResetButton.module.css";

/** Clears all players and moves (and IndexedDB) behind a confirmation. */
export function ResetButton() {
	const reset = useTrackerStore((s) => s.reset);

	return (
		<AlertDialog.Root>
			<AlertDialog.Trigger asChild>
				<button type="button" className={styles.trigger}>
					Reset
				</button>
			</AlertDialog.Trigger>
			<AlertDialog.Portal>
				<AlertDialog.Overlay className={styles.overlay} />
				<AlertDialog.Content className={styles.content}>
					<AlertDialog.Title className={styles.title}>
						Reset the tracker?
					</AlertDialog.Title>
					<AlertDialog.Description className={styles.description}>
						This clears all players and logged moves. It can't be undone.
					</AlertDialog.Description>
					<div className={styles.actions}>
						<AlertDialog.Cancel asChild>
							<button type="button" className={styles.cancel}>
								Cancel
							</button>
						</AlertDialog.Cancel>
						<AlertDialog.Action asChild>
							<button type="button" className={styles.confirm} onClick={reset}>
								Reset
							</button>
						</AlertDialog.Action>
					</div>
				</AlertDialog.Content>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	);
}
