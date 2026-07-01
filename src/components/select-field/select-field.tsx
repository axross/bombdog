"use client";

import { clsx } from "clsx";
import { Select } from "radix-ui";
import type { JSX } from "react";
import css from "./select-field.module.css";

export interface SelectOption {
	value: string;
	label: string;
}

interface SelectFieldProps {
	label: string;
	value: string;
	onValueChange: (value: string) => void;
	options: SelectOption[];
	placeholder?: string;
	/** Render the label visually (default) or keep it screen-reader only. */
	hideLabel?: boolean;
	className?: string;
	"data-testid"?: string;
}

/** A labelled dropdown built on Radix Select. */
export function SelectField({
	label,
	value,
	onValueChange,
	options,
	placeholder = "Select…",
	hideLabel = false,
	className,
	"data-testid": dataTestId,
}: SelectFieldProps): JSX.Element {
	return (
		// A plain wrapper (not <label>): the control is a Radix Select trigger,
		// which is labelled via its own aria-label below.
		<div className={clsx(css.field, className)}>
			<span className={hideLabel ? css.srOnly : css.label}>{label}</span>
			{/* Pass the empty string (not undefined) so the Select stays controlled:
			    undefined flips Radix into uncontrolled mode, which desyncs from
			    state after the field is reset (e.g. after logging a move). Radix
			    shows the placeholder for an empty-string value. */}
			<Select.Root value={value} onValueChange={onValueChange}>
				<Select.Trigger
					className={css.trigger}
					aria-label={label}
					data-testid={dataTestId}
				>
					<Select.Value placeholder={placeholder} />
					<Select.Icon className={css.icon}>▾</Select.Icon>
				</Select.Trigger>
				<Select.Portal>
					<Select.Content
						className={css.content}
						position="popper"
						sideOffset={4}
					>
						<Select.Viewport className={css.viewport}>
							{options.map((option) => (
								<Select.Item
									key={option.value}
									value={option.value}
									className={css.item}
								>
									<Select.ItemText>{option.label}</Select.ItemText>
									<Select.ItemIndicator className={css.indicator}>
										✓
									</Select.ItemIndicator>
								</Select.Item>
							))}
						</Select.Viewport>
					</Select.Content>
				</Select.Portal>
			</Select.Root>
		</div>
	);
}
