"use client";

import { clsx } from "clsx";
import { Check, Ellipsis } from "lucide-react";
import { DropdownMenu, ToggleGroup } from "radix-ui";
import type { JSX } from "react";
import type { SelectOption } from "@/components/primitives/select-field/select-field";
import css from "./segmented-picker.module.css";

/**
 * Options shared by both selection modes of {@link SegmentedPicker}.
 */
interface BaseProps {
	label: string;
	options: SelectOption[];
	className?: string;
	"data-testid"?: string;
}

/**
 * Single-select picker: exactly one option (or none yet).
 */
interface SingleProps extends BaseProps {
	multiple?: false;
	value: string;
	onValueChange: (value: string) => void;
	/**
	 * Secondary options folded into a trailing ⋯ overflow menu instead of the
	 * one-tap segmented row — for rare-but-legal choices. Omit, or pass an
	 * empty array, to render no menu.
	 */
	menuOptions?: SelectOption[];
	/**
	 * Accessible label for the ⋯ overflow trigger. Applies only when
	 * `menuOptions` is non-empty.
	 */
	menuLabel?: string;
}

/**
 * Multi-select picker: any subset of options, including none. Every option
 * stays a one-tap toggle — a subset pick has no rare choice to fold away, so
 * there is no overflow menu.
 */
interface MultiProps extends BaseProps {
	multiple: true;
	values: string[];
	onValuesChange: (values: string[]) => void;
}

/**
 * A {@link SegmentedPicker} in either mode, discriminated by the `multiple` flag.
 */
type SegmentedPickerProps = SingleProps | MultiProps;

/**
 * A segmented control for choosing among a handful of options — one tap,
 * versus the two taps a dropdown needs. Buttons fill the row and wrap when
 * labels are long. Defaults to single-select; pass `multiple` to toggle any
 * subset of options instead.
 *
 * In single mode, `menuOptions` moves rare choices out of the segmented row
 * into a trailing ⋯ overflow menu, keeping the common one-tap choices
 * uncrowded. Both the segmented items and the menu items feed the same
 * `value`/`onValueChange`, so the selection is one controlled field regardless
 * of where it lives.
 */
export function SegmentedPicker(props: SegmentedPickerProps): JSX.Element {
	const { label, options, className } = props;
	const dataTestId = props["data-testid"];

	// the buttons are identical across modes; only the enclosing Root's
	// selection semantics differ, so build them once and place them in either.
	const items = options.map((option) => (
		<ToggleGroup.Item
			key={option.value}
			value={option.value}
			className={css.item}
		>
			{option.label}
		</ToggleGroup.Item>
	));

	if (props.multiple) {
		return (
			<div className={clsx(css.field, className)}>
				<span className={css.label}>{label}</span>
				<div className={css.row} data-testid={dataTestId}>
					<ToggleGroup.Root
						type="multiple"
						value={props.values}
						onValueChange={props.onValuesChange}
						className={css.picker}
						aria-label={label}
					>
						{items}
					</ToggleGroup.Root>
				</div>
			</div>
		);
	}

	const {
		value,
		onValueChange,
		menuOptions,
		menuLabel = "More options",
	} = props;
	const hasMenu = menuOptions !== undefined && menuOptions.length > 0;
	// the ⋯ trigger adopts the active styling when the current selection is one
	// of the menu entries, so a folded-away choice stays visible at a glance.
	const menuSelected = hasMenu && menuOptions.some((o) => o.value === value);

	return (
		<div className={clsx(css.field, className)}>
			<span className={css.label}>{label}</span>
			{/* the testid spans the whole picker (segmented row + ⋯ overflow) so both
			    the one-tap options and the folded-away menu are addressable under it. */}
			<div className={css.row} data-testid={dataTestId}>
				<ToggleGroup.Root
					type="single"
					value={value}
					onValueChange={(next) => {
						// ignore the empty value so tapping the selected option again does
						// not clear a required field.
						if (next) onValueChange(next);
					}}
					className={css.picker}
					aria-label={label}
				>
					{items}
				</ToggleGroup.Root>

				{hasMenu && (
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							className={clsx(css.item, css.menuTrigger)}
							aria-label={menuLabel}
							// a custom flag (not data-state, which Radix owns for open/closed)
							// drives the selected accent on the trigger.
							data-active={menuSelected ? "on" : undefined}
						>
							<Ellipsis size={18} aria-hidden />
						</DropdownMenu.Trigger>
						<DropdownMenu.Portal>
							<DropdownMenu.Content
								className={css.menu}
								align="end"
								sideOffset={4}
							>
								<DropdownMenu.RadioGroup
									value={value}
									onValueChange={onValueChange}
								>
									{menuOptions.map((option) => (
										<DropdownMenu.RadioItem
											key={option.value}
											value={option.value}
											className={css.menuItem}
										>
											<DropdownMenu.ItemIndicator className={css.menuIndicator}>
												<Check size={16} aria-hidden />
											</DropdownMenu.ItemIndicator>
											{option.label}
										</DropdownMenu.RadioItem>
									))}
								</DropdownMenu.RadioGroup>
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				)}
			</div>
		</div>
	);
}
