"use client";

import { clsx } from "clsx";
import { ToggleGroup } from "radix-ui";
import type { JSX } from "react";
import type { Outcome } from "@/lib/types";
import css from "./outcome-toggle.module.css";

interface OutcomeToggleProps {
	value: Outcome | null;
	onValueChange: (value: Outcome) => void;
	className?: string;
	"data-testid"?: string;
}

/** Success / Fail single-select. */
export function OutcomeToggle({
	value,
	onValueChange,
	className,
	"data-testid": dataTestId,
}: OutcomeToggleProps): JSX.Element {
	return (
		<ToggleGroup.Root
			type="single"
			value={value ?? ""}
			onValueChange={(next) => {
				if (next) onValueChange(next as Outcome);
			}}
			className={clsx(css.group, className)}
			aria-label="Outcome"
			data-testid={dataTestId}
		>
			<ToggleGroup.Item
				value="success"
				className={clsx(css.item, css.success)}
				data-testid="outcome-success"
			>
				✔ Success
			</ToggleGroup.Item>
			<ToggleGroup.Item
				value="fail"
				className={clsx(css.item, css.fail)}
				data-testid="outcome-fail"
			>
				✕ Fail
			</ToggleGroup.Item>
		</ToggleGroup.Root>
	);
}
