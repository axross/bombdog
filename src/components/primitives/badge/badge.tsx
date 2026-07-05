"use client";

import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import css from "./badge.module.css";

/**
 * A compact status badge: a 26px pill for a short icon + text pair. Purely
 * the shape — tone (success/danger/neutral colours) comes from the caller's
 * `className`, which wins over the zero-specificity base.
 */
export function Badge({
	className,
	...props
}: ComponentProps<"span">): JSX.Element {
	return <span className={clsx(css.badge, className)} {...props} />;
}
