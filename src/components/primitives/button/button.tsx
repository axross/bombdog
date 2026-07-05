"use client";

import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import css from "./button.module.css";

/**
 * Visual roles a {@link Button} can take: `primary` (accent solid) for a
 * surface's one main action, `secondary` (neutral tinted) for supporting
 * actions, `danger` (danger solid) for a confirmed destructive action,
 * `danger-ghost` for a destructive trigger that only fills on hover, and
 * `ghost` for low-emphasis toolbar and icon controls.
 */
export type ButtonVariant =
	| "primary"
	| "secondary"
	| "danger"
	| "danger-ghost"
	| "ghost";

/**
 * Sizing presets: `md` is the 44px default control, `sm` the 40px compact
 * control, `compact` the 36px toolbar trigger, and `icon` / `icon-sm` square
 * icon-only targets (44px and 36px).
 */
export type ButtonSize = "md" | "sm" | "compact" | "icon" | "icon-sm";

type ButtonProps = ComponentProps<"button"> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
	primary: css.primary,
	secondary: css.secondary,
	danger: css.danger,
	"danger-ghost": css.dangerGhost,
	ghost: css.ghost,
};

const SIZE_CLASS: Record<ButtonSize, string> = {
	md: css.md,
	sm: css.sm,
	compact: css.compact,
	icon: css.icon,
	"icon-sm": css.iconSm,
};

/**
 * The shared button primitive. Variant and size classes are declared at zero
 * specificity, so an incoming `className` can override any of them. `type`
 * defaults to `"button"` (not HTML's `"submit"`) so a Button inside a form
 * never submits by accident; pass `type="submit"` for the submitting action.
 */
export function Button({
	variant = "secondary",
	size = "md",
	type = "button",
	className,
	...props
}: ButtonProps): JSX.Element {
	return (
		<button
			type={type}
			className={clsx(
				css.button,
				VARIANT_CLASS[variant],
				SIZE_CLASS[size],
				className,
			)}
			{...props}
		/>
	);
}
