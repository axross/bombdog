"use client";

import { clsx } from "clsx";
import { ToggleGroup } from "radix-ui";
import type { JSX } from "react";
import { BLUE_WIRE_VALUES, type WireValue } from "@/lib/types";
import css from "./wire-pad.module.css";

interface BaseProps {
	/** Optional heading shown above the pad. */
	label?: string;
	/** Hide the Yellow option — detectors indicate blue values only. */
	blueOnly?: boolean;
	className?: string;
	"data-testid"?: string;
}

/** Single-select pad: exactly one wire (or none). */
interface SingleProps extends BaseProps {
	multiple?: false;
	value: WireValue | null;
	onValueChange: (value: WireValue) => void;
}

/** Multi-select pad: an ordered set of wires, optionally capped at `max`. */
interface MultiProps extends BaseProps {
	multiple: true;
	values: WireValue[];
	onValuesChange: (values: WireValue[]) => void;
	/** Cap on simultaneous selections; extra picks push out the oldest. */
	max?: number;
}

type WirePadProps = SingleProps | MultiProps;

function toKey(value: WireValue): string {
	return String(value);
}

function fromKey(key: string): WireValue {
	return key === "yellow" ? "yellow" : (Number(key) as WireValue);
}

/**
 * Grid of wire buttons: 1–12 and (unless blue-only) Yellow. Defaults to a
 * single-select toggle; pass `multiple` to let several wires be chosen at once
 * (used by the X or Y Ray, which names two values against one wire).
 */
export function WirePad(props: WirePadProps): JSX.Element {
	const { label, blueOnly = false, className } = props;
	const dataTestId = props["data-testid"];

	// The buttons are identical across modes; only the enclosing Root's
	// selection semantics differ, so build them once and place them in either.
	const buttons = (
		<>
			{BLUE_WIRE_VALUES.map((n) => (
				<ToggleGroup.Item
					key={n}
					value={toKey(n)}
					className={css.wire}
					aria-label={`Wire ${n}`}
					data-testid={`wire-${n}`}
				>
					{n}
				</ToggleGroup.Item>
			))}
			{!blueOnly && (
				<ToggleGroup.Item
					value="yellow"
					className={clsx(css.wire, css.yellow)}
					aria-label="Yellow wire"
					data-testid="wire-yellow"
				>
					Y
				</ToggleGroup.Item>
			)}
		</>
	);

	// Shared across both selection modes; only `type`/`value`/`onValueChange`
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
						// Cap the selection: picking a wire beyond `max` drops the oldest.
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
						if (next) props.onValueChange(fromKey(next));
					}}
					{...rootProps}
				>
					{buttons}
				</ToggleGroup.Root>
			)}
		</div>
	);
}
