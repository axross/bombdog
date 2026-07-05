"use client";

import { clsx } from "clsx";
import type { ComponentProps, JSX, ReactNode } from "react";
import css from "./checkbox.module.css";

type CheckboxProps = Omit<ComponentProps<"input">, "type" | "children"> & {
	/**
	 * The visible label text, wrapped with the box in one `<label>` so tapping
	 * either toggles.
	 */
	children: ReactNode;
};

/**
 * A labelled native checkbox (accent-tinted via `accent-color`). The native
 * input keeps the platform's checkbox semantics and rendering; `className`
 * extends the wrapping label.
 */
export function Checkbox({
	className,
	children,
	...props
}: CheckboxProps): JSX.Element {
	return (
		<label className={clsx(css.checkbox, className)}>
			<input type="checkbox" {...props} />
			{children}
		</label>
	);
}
