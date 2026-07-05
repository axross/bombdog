"use client";

import type { JSX } from "react";
import { Button } from "@/components/ui/button/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog/confirm-dialog";
import { useTrackerStore } from "@/lib/tracker-store";

/**
 * Clears the logged moves behind a confirmation, keeping the roster for reuse.
 */
export function ResetButton(): JSX.Element {
	const reset = useTrackerStore((s) => s.reset);

	return (
		<ConfirmDialog
			trigger={
				<Button variant="danger-ghost" size="sm" data-testid="reset">
					Reset
				</Button>
			}
			title="Reset the tracker?"
			description="This clears the logged moves and starts a new game. Your players carry over. It can't be undone."
			confirmLabel="Reset"
			onConfirm={reset}
			data-testid="reset-dialog"
			confirmTestId="reset-confirm"
		/>
	);
}
