"use client";

import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import css from "./chip.module.css";

/**
 * A compact value chip: a small mono-type badge for a short glyph or count.
 * Purely the shape — colour comes from the caller's `className`, declared to
 * win over the chip's zero-specificity base. Spreads all other span props
 * (`role`, `aria-label`, `data-testid`, …).
 */
export function Chip({
	className,
	...props
}: ComponentProps<"span">): JSX.Element {
	return <span className={clsx(css.chip, className)} {...props} />;
}
