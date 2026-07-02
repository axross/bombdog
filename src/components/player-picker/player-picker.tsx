"use client";

import { clsx } from "clsx";
import { ToggleGroup } from "radix-ui";
import type { JSX } from "react";
import type { SelectOption } from "@/components/select-field/select-field";
import css from "./player-picker.module.css";

/**
 *
 * Props for {@link PlayerPicker}: the field label and the controlled selection.
 *
 */
interface PlayerPickerProps {
	label: string;
	value: string;
	onValueChange: (value: string) => void;
	options: SelectOption[];
	className?: string;
	"data-testid"?: string;
}

/**
 *
 * A single-select segmented control for choosing a player — one tap, versus the
 * two taps a dropdown needs. Buttons fill the row and wrap when names are long.
 *
 */
export function PlayerPicker({
	label,
	value,
	onValueChange,
	options,
	className,
	"data-testid": dataTestId,
}: PlayerPickerProps): JSX.Element {
	return (
		<div className={clsx(css.field, className)}>
			<span className={css.label}>{label}</span>
			<ToggleGroup.Root
				type="single"
				value={value}
				onValueChange={(next) => {
					// ignore the empty value so tapping the selected player again does
					// not clear a required field.
					if (next) onValueChange(next);
				}}
				className={css.picker}
				aria-label={label}
				data-testid={dataTestId}
			>
				{options.map((option) => (
					<ToggleGroup.Item
						key={option.value}
						value={option.value}
						className={css.item}
					>
						{option.label}
					</ToggleGroup.Item>
				))}
			</ToggleGroup.Root>
		</div>
	);
}
