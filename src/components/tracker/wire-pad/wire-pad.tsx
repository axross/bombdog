"use client";

import { clsx } from "clsx";
import type { JSX } from "react";
import {
	ToggleGrid,
	type ToggleGridOption,
} from "@/components/primitives/toggle-grid/toggle-grid";
import { formatWire, wireLabel } from "@/lib/game";
import {
	BLUE_WIRE_VALUES,
	type WireValue,
	type WireValueOrUnknown,
} from "@/lib/types";
import css from "./wire-pad.module.css";

/**
 * Options shared by both selection modes of {@link WirePad}.
 */
interface BaseProps {
	/**
	 * Optional heading shown above the pad.
	 */
	label?: string;
	/**
	 * Hide the Yellow option — detectors indicate blue values only.
	 */
	blueOnly?: boolean;
	/**
	 * Offer the "?" (unknown) option for wires cut/named without a known value.
	 */
	allowUnknown?: boolean;
	/**
	 * Prefix for each chip's `data-testid` (`<prefix>-<value>`), so surfaces
	 * with their own e2e vocabulary (e.g. the reveal picker's `reveal-8`) keep
	 * it. Defaults to `wire`.
	 */
	itemTestIdPrefix?: string;
	className?: string;
	"data-testid"?: string;
}

/**
 * Single-select pad: exactly one wire (or none).
 */
interface SingleProps extends BaseProps {
	multiple?: false;
	value: WireValueOrUnknown | null;
	onValueChange: (value: WireValueOrUnknown) => void;
}

/**
 * Multi-select pad: an ordered set of wires, optionally capped at `max`.
 */
interface MultiProps extends BaseProps {
	multiple: true;
	values: WireValueOrUnknown[];
	onValuesChange: (values: WireValueOrUnknown[]) => void;
	/**
	 * Cap on simultaneous selections; extra picks push out the oldest.
	 */
	max?: number;
}

/**
 * A {@link WirePad} in either mode, discriminated by the `multiple` flag.
 */
type WirePadProps = SingleProps | MultiProps;

function toKey(value: WireValueOrUnknown): string {
	return String(value);
}

function fromKey(key: string): WireValueOrUnknown {
	if (key === "yellow") return "yellow";
	if (key === "unknown") return "unknown";
	return Number(key) as WireValue;
}

/**
 * Grid of wire buttons: 1–12 and (unless blue-only) Yellow, rendered through
 * the generic {@link ToggleGrid}. This layer owns the wire domain — the value
 * set, glyphs and accessible names via {@link formatWire}/{@link wireLabel},
 * the wire colour variants, and the string↔value mapping; the primitive owns
 * the grid, the single/multi selection semantics, the repeat-tap re-commit,
 * and the multi cap. It is the one wire-value picker — any surface choosing a
 * wire value renders it, per the UI Appearance skill's control-selection rule.
 */
export function WirePad(props: WirePadProps): JSX.Element {
	const {
		label,
		blueOnly = false,
		allowUnknown = false,
		itemTestIdPrefix = "wire",
		className,
	} = props;
	const dataTestId = props["data-testid"];

	const option = (
		value: WireValueOrUnknown,
		variant?: string,
	): ToggleGridOption => ({
		value: toKey(value),
		label: formatWire(value),
		ariaLabel: wireLabel(value),
		className: clsx(css.wire, variant),
		"data-testid": `${itemTestIdPrefix}-${toKey(value)}`,
	});

	const options: ToggleGridOption[] = [
		...BLUE_WIRE_VALUES.map((n) => option(n)),
		...(blueOnly ? [] : [option("yellow", css.yellow)]),
		...(allowUnknown ? [option("unknown", css.unknown)] : []),
	];

	const shared = {
		label,
		ariaLabel: label ?? "Wire value",
		options,
		className: clsx(css.wirePad, className),
		"data-testid": dataTestId,
	};

	return props.multiple ? (
		<ToggleGrid
			{...shared}
			multiple
			max={props.max}
			values={props.values.map(toKey)}
			onValuesChange={(next) => props.onValuesChange(next.map(fromKey))}
		/>
	) : (
		<ToggleGrid
			{...shared}
			value={props.value === null ? null : toKey(props.value)}
			onValueChange={(next) => props.onValueChange(fromKey(next))}
		/>
	);
}
