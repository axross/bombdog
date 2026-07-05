"use client";

import { clsx } from "clsx";
import { RadioGroup as RadixRadioGroup } from "radix-ui";
import type { ComponentProps, JSX } from "react";
import css from "./radio-group.module.css";

/**
 * The group root, unstyled — the caller owns the layout of its items via
 * `className` (a radio group's arrangement is always surface-specific).
 */
export function RadioGroup(
	props: ComponentProps<typeof RadixRadioGroup.Root>,
): JSX.Element {
	return <RadixRadioGroup.Root {...props} />;
}

/**
 * One styled radio: a 26px circle whose border and inner dot take the accent
 * while checked. The indicator is built in; the caller provides the
 * accessible name (`aria-label` or an `htmlFor` pairing via `id`).
 */
export function RadioGroupItem({
	className,
	...props
}: Omit<ComponentProps<typeof RadixRadioGroup.Item>, "children">): JSX.Element {
	return (
		<RadixRadioGroup.Item className={clsx(css.radio, className)} {...props}>
			<RadixRadioGroup.Indicator className={css.dot} />
		</RadixRadioGroup.Item>
	);
}
