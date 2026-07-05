"use client";

import { clsx } from "clsx";
import { ToggleGroup } from "radix-ui";
import type { JSX } from "react";
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
 * Grid of wire buttons: 1–12 and (unless blue-only) Yellow. Defaults to a
 * single-select toggle; pass `multiple` to let several wires be chosen at once
 * (used by the X or Y Ray, which names two values against one wire). This is
 * the one wire-value picker — any surface choosing a wire value renders it,
 * per the UI Appearance skill's control-selection rule.
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

	// the buttons are identical across modes; only the enclosing Root's
	// selection semantics differ, so build them once and place them in either.
	const buttons = (
		<>
			{BLUE_WIRE_VALUES.map((n) => (
				<ToggleGroup.Item
					key={n}
					value={toKey(n)}
					className={css.wire}
					aria-label={wireLabel(n)}
					data-testid={`${itemTestIdPrefix}-${n}`}
				>
					{formatWire(n)}
				</ToggleGroup.Item>
			))}
			{!blueOnly && (
				<ToggleGroup.Item
					value="yellow"
					className={clsx(css.wire, css.yellow)}
					aria-label={wireLabel("yellow")}
					data-testid={`${itemTestIdPrefix}-yellow`}
				>
					{formatWire("yellow")}
				</ToggleGroup.Item>
			)}
			{allowUnknown && (
				<ToggleGroup.Item
					value="unknown"
					className={clsx(css.wire, css.unknown)}
					aria-label={wireLabel("unknown")}
					data-testid={`${itemTestIdPrefix}-unknown`}
				>
					{formatWire("unknown")}
				</ToggleGroup.Item>
			)}
		</>
	);

	// shared across both selection modes; only `type`/`value`/`onValueChange`
	// differ, so the mode-specific Root supplies just those three.
	const rootProps = {
		className: css.pad,
		"aria-label": label ?? "Wire value",
		"data-testid": dataTestId,
	};

	return (
		<div className={clsx(css.wirePad, className)}>
			{label && <span className={css.label}>{label}</span>}
			{props.multiple ? (
				<ToggleGroup.Root
					type="multiple"
					value={props.values.map(toKey)}
					onValueChange={(next) => {
						const parsed = next.map(fromKey);
						// cap the selection: picking a wire beyond `max` drops the oldest.
						props.onValuesChange(props.max ? parsed.slice(-props.max) : parsed);
					}}
					{...rootProps}
				>
					{buttons}
				</ToggleGroup.Root>
			) : (
				<ToggleGroup.Root
					type="single"
					value={props.value === null ? "" : toKey(props.value)}
					onValueChange={(next) => {
						if (next) {
							props.onValueChange(fromKey(next));
						} else if (props.value !== null) {
							// Radix reports a tap on the active item as "" (toggle-off). A
							// single-select pad never clears, so a repeat tap re-commits the
							// current value: commit-style pickers (the reveal sheet) act on
							// it, and form fields receive the value they already hold.
							props.onValueChange(props.value);
						}
					}}
					{...rootProps}
				>
					{buttons}
				</ToggleGroup.Root>
			)}
		</div>
	);
}
