"use client";

import { clsx } from "clsx";
import { ToggleGroup } from "radix-ui";
import type { JSX } from "react";
import { FieldLabel } from "@/components/primitives/field-label/field-label";
import css from "./toggle-grid.module.css";

/**
 * One cell in a {@link ToggleGrid}: its stored value, visible glyph, and the
 * per-cell presentation hooks the caller styles it with.
 */
export interface ToggleGridOption {
	value: string;
	label: string;
	/**
	 * Accessible name, when the visible glyph alone doesn't carry it.
	 */
	ariaLabel?: string;
	/**
	 * Extra class(es) for this cell — the caller's visual variant.
	 */
	className?: string;
	"data-testid"?: string;
}

/**
 * Options shared by both selection modes of {@link ToggleGrid}.
 */
interface BaseProps {
	/**
	 * Optional heading shown above the grid.
	 */
	label?: string;
	/**
	 * Accessible name for the grid; defaults to `label`.
	 */
	ariaLabel?: string;
	options: ToggleGridOption[];
	className?: string;
	"data-testid"?: string;
}

/**
 * Single-select grid: exactly one cell (or none).
 */
interface SingleProps extends BaseProps {
	multiple?: false;
	value: string | null;
	onValueChange: (value: string) => void;
}

/**
 * Multi-select grid: an ordered set of cells, optionally capped at `max`.
 */
interface MultiProps extends BaseProps {
	multiple: true;
	values: string[];
	onValuesChange: (values: string[]) => void;
	/**
	 * Cap on simultaneous selections; extra picks push out the oldest.
	 */
	max?: number;
}

/**
 * A {@link ToggleGrid} in either mode, discriminated by the `multiple` flag.
 */
type ToggleGridProps = SingleProps | MultiProps;

/**
 * A grid of equal toggle cells. Defaults to a single-select toggle that never
 * clears — a repeat tap on the active cell re-commits its value, so
 * commit-style pickers act on it and form fields receive the value they
 * already hold. Pass `multiple` to select any subset instead, optionally
 * capped at `max` (picking beyond the cap drops the oldest selection).
 */
export function ToggleGrid(props: ToggleGridProps): JSX.Element {
	const { label, ariaLabel, options, className } = props;
	const dataTestId = props["data-testid"];

	// the cells are identical across modes; only the enclosing Root's selection
	// semantics differ, so build them once and place them in either.
	const cells = options.map((option) => (
		<ToggleGroup.Item
			key={option.value}
			value={option.value}
			className={option.className}
			aria-label={option.ariaLabel}
			data-testid={option["data-testid"]}
		>
			{option.label}
		</ToggleGroup.Item>
	));

	// shared across both selection modes; only `type`/`value`/`onValueChange`
	// differ, so the mode-specific Root supplies just those three.
	const rootProps = {
		className: css.grid,
		"aria-label": ariaLabel ?? label,
		"data-testid": dataTestId,
	};

	return (
		<div className={clsx(css.toggleGrid, className)}>
			{label && <FieldLabel>{label}</FieldLabel>}
			{props.multiple ? (
				<ToggleGroup.Root
					type="multiple"
					value={props.values}
					onValueChange={(next) => {
						// cap the selection: picking a cell beyond `max` drops the oldest.
						props.onValuesChange(props.max ? next.slice(-props.max) : next);
					}}
					{...rootProps}
				>
					{cells}
				</ToggleGroup.Root>
			) : (
				<ToggleGroup.Root
					type="single"
					value={props.value ?? ""}
					onValueChange={(next) => {
						if (next) {
							props.onValueChange(next);
						} else if (props.value !== null) {
							// Radix reports a tap on the active cell as "" (toggle-off). A
							// single-select grid never clears, so a repeat tap re-commits the
							// current value.
							props.onValueChange(props.value);
						}
					}}
					{...rootProps}
				>
					{cells}
				</ToggleGroup.Root>
			)}
		</div>
	);
}
