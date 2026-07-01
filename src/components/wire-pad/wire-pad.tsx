"use client";

import { clsx } from "clsx";
import { ToggleGroup } from "radix-ui";
import type { JSX } from "react";
import { BLUE_WIRE_VALUES, type WireValue } from "@/lib/types";
import css from "./wire-pad.module.css";

interface WirePadProps {
	value: WireValue | null;
	onValueChange: (value: WireValue) => void;
	/** Optional heading shown above the pad. */
	label?: string;
	/** Hide the Yellow option — detectors indicate blue values only. */
	blueOnly?: boolean;
	className?: string;
	"data-testid"?: string;
}

function toKey(value: WireValue): string {
	return String(value);
}

function fromKey(key: string): WireValue {
	return key === "yellow" ? "yellow" : (Number(key) as WireValue);
}

/** Grid of wire buttons: 1–12 and (unless blue-only) Yellow. */
export function WirePad({
	value,
	onValueChange,
	label,
	blueOnly = false,
	className,
	"data-testid": dataTestId,
}: WirePadProps): JSX.Element {
	return (
		<div className={clsx(css.wirePad, className)}>
			{label && <span className={css.label}>{label}</span>}
			<ToggleGroup.Root
				type="single"
				value={value === null ? "" : toKey(value)}
				onValueChange={(next) => {
					if (next) onValueChange(fromKey(next));
				}}
				className={css.pad}
				aria-label={label ?? "Wire value"}
				data-testid={dataTestId}
			>
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
			</ToggleGroup.Root>
		</div>
	);
}
