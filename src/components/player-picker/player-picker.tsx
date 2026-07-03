"use client";

import { clsx } from "clsx";
import { Check, Ellipsis } from "lucide-react";
import { DropdownMenu, ToggleGroup } from "radix-ui";
import type { JSX } from "react";
import type { SelectOption } from "@/components/select-field/select-field";
import css from "./player-picker.module.css";

/**
 * Props for {@link PlayerPicker}: the field label and the controlled selection.
 */
interface PlayerPickerProps {
	label: string;
	value: string;
	onValueChange: (value: string) => void;
	options: SelectOption[];
	/**
	 * Secondary options folded into a trailing ⋯ overflow menu instead of the
	 * one-tap segmented row — for rare-but-legal choices (e.g. self-targeting).
	 * Omit, or pass an empty array, to render no menu.
	 */
	menuOptions?: SelectOption[];
	/**
	 * Accessible label for the ⋯ overflow trigger. Applies only when
	 * `menuOptions` is non-empty.
	 */
	menuLabel?: string;
	className?: string;
	"data-testid"?: string;
}

/**
 * A single-select segmented control for choosing a player — one tap, versus the
 * two taps a dropdown needs. Buttons fill the row and wrap when names are long.
 *
 * `menuOptions` moves rare choices out of the segmented row into a trailing ⋯
 * overflow menu, keeping the common one-tap targets uncrowded. Both the
 * segmented items and the menu items feed the same `value`/`onValueChange`, so
 * the selection is one controlled field regardless of where it lives.
 */
export function PlayerPicker({
	label,
	value,
	onValueChange,
	options,
	menuOptions,
	menuLabel = "More options",
	className,
	"data-testid": dataTestId,
}: PlayerPickerProps): JSX.Element {
	const hasMenu = menuOptions !== undefined && menuOptions.length > 0;
	// the ⋯ trigger adopts the active styling when the current selection is one
	// of the menu entries, so a folded-away choice stays visible at a glance.
	const menuSelected = hasMenu && menuOptions.some((o) => o.value === value);

	return (
		<div className={clsx(css.field, className)}>
			<span className={css.label}>{label}</span>
			{/* the testid spans the whole picker (segmented row + ⋯ overflow) so both
			    the one-tap players and the folded-away menu are addressable under it. */}
			<div className={css.row} data-testid={dataTestId}>
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
