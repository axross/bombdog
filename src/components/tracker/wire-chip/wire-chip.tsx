"use client";

import { clsx } from "clsx";
import type { JSX } from "react";
import { Chip } from "@/components/primitives/chip/chip";
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
 * (unknown), rendered through the generic {@link Chip}. This layer owns the
 * wire domain — the glyph via {@link formatWire}, the accessible name via
 * {@link wireLabel}, and the wire colour variants — so every surface renders
 * wire values identically.
 */
export function WireChip({
	value,
	className,
	"data-testid": dataTestId,
}: WireChipProps): JSX.Element {
	const variant =
		value === "unknown" ? "unknown" : value === "yellow" ? "yellow" : "blue";
	return (
		<Chip
			role="img"
			className={clsx(VARIANT_CLASS[variant], className)}
			aria-label={wireLabel(value)}
			data-testid={dataTestId}
		>
			{formatWire(value)}
		</Chip>
	);
}
