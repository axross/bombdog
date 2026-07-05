"use client";

import { clsx } from "clsx";
import type { JSX } from "react";
import { formatWire, wireLabel } from "@/lib/game";
import type { WireValueOrUnknown } from "@/lib/types";
import css from "./wire-chip.module.css";

const VARIANT_CLASS: Record<"blue" | "yellow" | "unknown", string> = {
	blue: css.blue,
	yellow: css.yellow,
	unknown: css.unknown,
};

/**
 * Props for {@link WireChip}.
 */
interface WireChipProps {
	value: WireValueOrUnknown;
	className?: string;
	"data-testid"?: string;
}

/**
 * A wire value shown as a colour-coded chip: blue (numbered), yellow, or "?"
 * (unknown). The glyph comes from {@link formatWire} and the accessible name
 * from {@link wireLabel}, so every surface renders wire values identically.
 */
export function WireChip({
	value,
	className,
	"data-testid": dataTestId,
}: WireChipProps): JSX.Element {
	const variant =
		value === "unknown" ? "unknown" : value === "yellow" ? "yellow" : "blue";
	return (
		<span
			role="img"
			className={clsx(css.chip, VARIANT_CLASS[variant], className)}
			aria-label={wireLabel(value)}
			data-testid={dataTestId}
		>
			{formatWire(value)}
		</span>
	);
}
