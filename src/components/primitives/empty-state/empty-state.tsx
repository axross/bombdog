"use client";

import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import css from "./empty-state.module.css";

/**
 * A centered muted message that fills its flex parent — the resting state of
 * a list or panel with nothing to show.
 */
export function EmptyState({
	className,
	...props
}: ComponentProps<"p">): JSX.Element {
	return <p className={clsx(css.empty, className)} {...props} />;
}
