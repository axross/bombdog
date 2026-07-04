"use client";

import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";
import css from "./field-highlight.module.css";

/**
 * Props for {@link FieldHighlight}.
 */
interface FieldHighlightProps {
	/**
	 * Whether the wrapped field is currently unselected, missing, or invalid. When
	 * true, a danger-colored ring is drawn around the field; when false the wrapper
	 * is inert and only lays out its child.
	 */
	invalid: boolean;
	/**
	 * A counter that replays the pulse. Incrementing it (e.g. on each failed
	 * "Log move" press) remounts the decorative overlay, restarting its animation
	 * so a still-invalid field pulses again without any imperative DOM work.
	 */
	nudge: number;
	children: ReactNode;
	className?: string;
	"data-testid"?: string;
}

/**
 * Wraps a form field and, when it is {@link FieldHighlightProps.invalid}, draws a
 * danger-colored ring plus a short pulse to draw the eye. The ring is rendered
 * with `box-shadow`/an absolutely-positioned overlay so toggling it never shifts
 * layout, and the pulse is keyed on `nudge` so it replays declaratively. The
 * overlay is `aria-hidden` decoration; screen-reader users are told what needs
 * attention through the composer's live region instead.
 */
export function FieldHighlight({
	invalid,
	nudge,
	children,
	className,
	"data-testid": dataTestId,
}: FieldHighlightProps): JSX.Element {
	return (
		<div
			className={clsx(css.wrap, className)}
			data-invalid={invalid || undefined}
			data-testid={dataTestId}
		>
			{children}
			{invalid && (
				// keyed on `nudge` so each failed press remounts the span and its CSS
				// pulse animation runs from the start again.
				<span key={nudge} className={css.pulse} aria-hidden />
			)}
		</div>
	);
}
