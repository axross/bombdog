"use client";

import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import css from "./input.module.css";

/**
 * The app's text input: a 44px control on the surface token with a muted
 * placeholder. Layout (flex sizing) and a contrasting background for darker
 * parents come from the caller's `className`, which wins over the
 * zero-specificity base.
 */
export function Input({
	className,
	...props
}: ComponentProps<"input">): JSX.Element {
	return <input className={clsx(css.input, className)} {...props} />;
}
