"use client";

import { clsx } from "clsx";
import { type JSX, type ReactNode, useEffect, useRef } from "react";
import css from "./field-highlight.module.css";

/**
 * Props for {@link FieldHighlight}.
 */
interface FieldHighlightProps {
	/**
	 * Whether the wrapped field is currently unselected, missing, or invalid. When
	 * true, the field's label turns danger with a "!" badge over a faint tint, and
	 * it shakes once; when false the wrapper is inert and only lays out its child.
	 */
	invalid: boolean;
	/**
	 * A counter that replays the shake. Incrementing it (e.g. on each failed
	 * "Log move" press) restarts the animation so a still-invalid field shakes
	 * again to reassert what needs attention.
	 */
	nudge: number;
	children: ReactNode;
	className?: string;
	"data-testid"?: string;
}

/**
 * Wraps a form field and, when it is {@link FieldHighlightProps.invalid}, marks
 * it label-first: the field's own label turns danger with a small "!" badge over
 * a faint danger tint, plus a single sharp "no" shake — the familiar failed-
 * submit cue. The static label/badge/tint cue is drawn without a border or
 * outline so toggling it never shifts layout, and it persists until the field is
 * fixed (the sole signal under `prefers-reduced-motion`, where the shake is
 * suppressed). Screen-reader users are told what needs attention through the
 * composer's live region.
 */
export function FieldHighlight({
	invalid,
	nudge,
	children,
	className,
	"data-testid": dataTestId,
}: FieldHighlightProps): JSX.Element {
	const ref = useRef<HTMLDivElement>(null);

	// Replay the shake on each failed press: the CSS animation lives on
	// `[data-invalid]`, so it plays once when the flag first appears but not on a
	// repeat press (no class changes). Clear the animation, force a reflow, then
	// restore it so the same animation runs again — no key/remount of the field's
	// interactive children required. A no-op under reduced motion (animation: none).
	useEffect(() => {
		if (!invalid || nudge === 0) return;
		const el = ref.current;
		if (!el) return;
		el.style.animation = "none";
		void el.offsetWidth; // reflow
		el.style.animation = "";
	}, [invalid, nudge]);

	return (
		<div
			ref={ref}
			className={clsx(css.wrap, className)}
			data-invalid={invalid || undefined}
			data-testid={dataTestId}
		>
			{children}
		</div>
	);
}
