"use client";

import { clsx } from "clsx";
import type { JSX } from "react";
import { BottomSheet } from "@/components/bottom-sheet/bottom-sheet";
import { formatWire, wireLabel } from "@/lib/game";
import { BLUE_WIRE_VALUES, type RevealedWire } from "@/lib/types";
import css from "./reveal-dialog.module.css";

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
 * Yellow, or "?" for the special-rule "unknown"). Selecting a value closes it.
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
			<div className={css.grid}>
				{BLUE_WIRE_VALUES.map((n) => (
					<button
						key={n}
						type="button"
						className={clsx(css.cell, current === n && css.selected)}
						onClick={() => choose(n)}
						aria-label={wireLabel(n)}
						data-testid={`reveal-${n}`}
					>
						{formatWire(n)}
					</button>
				))}
				<button
					type="button"
					className={clsx(
						css.cell,
						css.yellow,
						current === "yellow" && css.selected,
					)}
					onClick={() => choose("yellow")}
					aria-label={wireLabel("yellow")}
					data-testid="reveal-yellow"
				>
					{formatWire("yellow")}
				</button>
				<button
					type="button"
					className={clsx(
						css.cell,
						css.unknown,
						current === "unknown" && css.selected,
					)}
					onClick={() => choose("unknown")}
					aria-label={wireLabel("unknown")}
					data-testid="reveal-unknown"
				>
					{formatWire("unknown")}
				</button>
			</div>
		</BottomSheet>
	);
}
