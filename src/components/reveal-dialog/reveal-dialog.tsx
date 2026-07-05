"use client";

import type { JSX } from "react";
import { BottomSheet } from "@/components/bottom-sheet/bottom-sheet";
import { WirePad } from "@/components/wire-pad/wire-pad";
import type { RevealedWire } from "@/lib/types";

/**
 * Props for {@link RevealDialog}: its open state and the reveal callbacks.
 */
interface RevealDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/**
	 * Called with the chosen actual wire value; the dialog then closes.
	 */
	onSelect: (value: RevealedWire) => void;
	/**
	 * The currently-recorded value, highlighted when reopened to edit.
	 */
	current: RevealedWire | null;
}

/**
 * Bottom sheet shown when a cut fails: pick the wire's actual value (1–12,
 * Yellow, or "?" for the special-rule "unknown"). Selecting a value closes it —
 * including re-picking the recorded value, which the {@link WirePad} re-commits
 * on a repeat tap. The pad is the shared wire-value picker, so this sheet has
 * no wire styling of its own.
 */
export function RevealDialog({
	open,
	onOpenChange,
	onSelect,
	current,
}: RevealDialogProps): JSX.Element {
	const choose = (value: RevealedWire) => {
		onSelect(value);
		onOpenChange(false);
	};

	return (
		<BottomSheet
			open={open}
			onOpenChange={onOpenChange}
			title="Actual wire"
			description="What was the wire's real value?"
			data-testid="reveal-dialog"
		>
			<WirePad
				value={current}
				onValueChange={choose}
				allowUnknown
				itemTestIdPrefix="reveal"
			/>
		</BottomSheet>
	);
}
