"use client";

import { clsx } from "clsx";
import { Tabs as RadixTabs } from "radix-ui";
import type { ComponentProps, JSX } from "react";
import css from "./tabs.module.css";

/**
 * The app's tab idiom over Radix Tabs: an underline tab strip whose triggers
 * are 44px, muted at rest, and accent-coloured with an accent underline while
 * active. Each part takes `className` for surface-specific extensions
 * (sizing, padding, list chrome) — the shared rules are declared at zero
 * specificity so callers win.
 */
export function Tabs(
	props: ComponentProps<typeof RadixTabs.Root>,
): JSX.Element {
	return <RadixTabs.Root {...props} />;
}

export function TabsList({
	className,
	...props
}: ComponentProps<typeof RadixTabs.List>): JSX.Element {
	return <RadixTabs.List className={clsx(css.list, className)} {...props} />;
}

export function TabsTrigger({
	className,
	...props
}: ComponentProps<typeof RadixTabs.Trigger>): JSX.Element {
	return (
		<RadixTabs.Trigger className={clsx(css.trigger, className)} {...props} />
	);
}

export function TabsContent({
	className,
	...props
}: ComponentProps<typeof RadixTabs.Content>): JSX.Element {
	return (
		<RadixTabs.Content className={clsx(css.content, className)} {...props} />
	);
}
