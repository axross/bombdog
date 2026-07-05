"use client";

import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import css from "./spinner.module.css";

/**
 * An indeterminate loading spinner: a 28px accent-topped ring. Decorative on
 * its own — the caller provides the loading semantics (`aria-busy`, visible
 * text) on the surrounding surface.
 */
export function Spinner({
	className,
	...props
}: ComponentProps<"span">): JSX.Element {
	return (
		<span className={clsx(css.spinner, className)} aria-hidden {...props} />
	);
}
