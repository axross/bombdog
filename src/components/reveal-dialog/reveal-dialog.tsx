"use client";

import { clsx } from "clsx";
import { Dialog } from "radix-ui";
import type { JSX } from "react";
import { BLUE_WIRE_VALUES, type RevealedWire } from "@/lib/types";
import css from "./reveal-dialog.module.css";

interface RevealDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Called with the chosen actual wire value; the dialog then closes. */
	onSelect: (value: RevealedWire) => void;
	/** The currently-recorded value, highlighted when reopened to edit. */
	current: RevealedWire | null;
}

/**
 * Popup shown when a cut fails: pick the wire's actual value (1–12, Yellow, or
 * "?" for the special-rule "unknown"). Selecting a value closes the dialog.
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
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className={css.overlay} />
				<Dialog.Content
					className={css.content}
					aria-describedby={undefined}
					data-testid="reveal-dialog"
				>
					<Dialog.Title className={css.title}>Actual wire</Dialog.Title>
					<p className={css.hint}>What was the wire's real value?</p>
					<div className={css.grid}>
						{BLUE_WIRE_VALUES.map((n) => (
							<button
								key={n}
								type="button"
								className={clsx(css.cell, current === n && css.selected)}
								onClick={() => choose(n)}
								aria-label={`Wire ${n}`}
								data-testid={`reveal-${n}`}
							>
								{n}
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
							aria-label="Yellow wire"
							data-testid="reveal-yellow"
						>
							Y
						</button>
						<button
							type="button"
							className={clsx(
								css.cell,
								css.unknown,
								current === "unknown" && css.selected,
							)}
							onClick={() => choose("unknown")}
							aria-label="Unknown wire"
							data-testid="reveal-unknown"
						>
							?
						</button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
