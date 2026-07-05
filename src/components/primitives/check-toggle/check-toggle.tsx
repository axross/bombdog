"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";
import type { ComponentProps, JSX } from "react";
import css from "./check-toggle.module.css";

type CheckToggleProps = Omit<ComponentProps<"button">, "type"> & {
	/**
	 * Whether the toggle is on; rendered as `aria-pressed` with a filled check
	 * indicator.
	 */
	pressed: boolean;
};

/**
 * A check-toggle row: a full-width toggle button with a leading checkbox-like
 * indicator that fills with a check while pressed. The app's control for
 * on/off choices presented as a tappable row (vs the compact native
 * {@link ../checkbox/checkbox Checkbox}).
 */
export function CheckToggle({
	pressed,
	className,
	children,
	...props
}: CheckToggleProps): JSX.Element {
	return (
		<button
			type="button"
			className={clsx(css.toggle, className)}
			aria-pressed={pressed}
			{...props}
		>
			<span className={css.check} aria-hidden>
				{pressed && <Check size={15} />}
			</span>
			{children}
		</button>
	);
}
