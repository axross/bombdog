"use client";

import { clsx } from "clsx";
import { Check, X } from "lucide-react";
import { type JSX, useState } from "react";
import { RevealDialog } from "@/components/reveal-dialog/reveal-dialog";
import { formatWire } from "@/lib/game";
import type { Outcome, RevealedWire } from "@/lib/types";
import css from "./outcome-toggle.module.css";

/**
 * Props for {@link OutcomeToggle}.
 */
interface OutcomeToggleProps {
	outcome: Outcome | null;
	revealed: RevealedWire | null;
	/**
	 * Sets both at once: success clears the revealed value; fail records it.
	 */
	onChange: (outcome: Outcome, revealed: RevealedWire | null) => void;
	/**
	 * Optional heading shown above the buttons.
	 */
	label?: string;
	className?: string;
	"data-testid"?: string;
}

/**
 * Success / Fail control. Choosing Fail opens a dialog to record the wire's
 * actual value, which is then shown on the button, e.g. "✕ Fail (8)".
 */
export function OutcomeToggle({
	outcome,
	revealed,
	onChange,
	label,
	className,
	"data-testid": dataTestId,
}: OutcomeToggleProps): JSX.Element {
	const [dialogOpen, setDialogOpen] = useState(false);
	const isFail = outcome === "fail";

	return (
		<fieldset
			className={clsx(css.group, className)}
			aria-label={label ?? "Outcome"}
			data-testid={dataTestId}
		>
			{label && <span className={css.label}>{label}</span>}
			<div className={css.buttons}>
				<button
					type="button"
					className={clsx(css.item, css.success)}
					aria-pressed={outcome === "success"}
					onClick={() => onChange("success", null)}
					data-testid="outcome-success"
				>
					<Check size={18} aria-hidden />
					Success
				</button>
				<button
					type="button"
					className={clsx(css.item, css.fail)}
					aria-pressed={isFail}
					onClick={() => setDialogOpen(true)}
					data-testid="outcome-fail"
				>
					<X size={18} aria-hidden />
					Fail
					{isFail && revealed !== null ? ` (${formatWire(revealed)})` : ""}
				</button>
			</div>

			<RevealDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				current={revealed}
				onSelect={(value) => onChange("fail", value)}
			/>
		</fieldset>
	);
}
