"use client";

import { Select } from "radix-ui";
import styles from "./SelectField.module.css";

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
}

/** A labelled dropdown built on Radix Select. */
export function SelectField({
	label,
	value,
	onValueChange,
	options,
	placeholder = "Select…",
	hideLabel = false,
}: SelectFieldProps) {
	return (
		// A plain wrapper (not <label>): the control is a Radix Select trigger,
		// which is labelled via its own aria-label below.
		<div className={styles.field}>
			<span className={hideLabel ? styles.srOnly : styles.label}>{label}</span>
			<Select.Root value={value || undefined} onValueChange={onValueChange}>
				<Select.Trigger className={styles.trigger} aria-label={label}>
					<Select.Value placeholder={placeholder} />
					<Select.Icon className={styles.icon}>▾</Select.Icon>
				</Select.Trigger>
				<Select.Portal>
					<Select.Content
						className={styles.content}
						position="popper"
						sideOffset={4}
					>
						<Select.Viewport className={styles.viewport}>
							{options.map((option) => (
								<Select.Item
									key={option.value}
									value={option.value}
									className={styles.item}
								>
									<Select.ItemText>{option.label}</Select.ItemText>
									<Select.ItemIndicator className={styles.indicator}>
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
