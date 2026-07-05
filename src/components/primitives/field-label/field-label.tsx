"use client";

import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import css from "./field-label.module.css";

/**
 * The small muted heading above a form control (the app's Label). Rendered as
 * a `span` because the controls it heads are labelled via `aria-label` on the
 * control itself, not an `htmlFor` pairing.
 */
export function FieldLabel({
	className,
	...props
}: ComponentProps<"span">): JSX.Element {
	return <span className={clsx(css.label, className)} {...props} />;
}
