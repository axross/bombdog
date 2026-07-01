"use client";

import { ToggleGroup } from "radix-ui";
import type { MoveType } from "@/lib/types";
import styles from "./ActionSelector.module.css";

const ACTIONS: { value: MoveType; label: string }[] = [
	{ value: "dual-cut", label: "Dual cut" },
	{ value: "solo-cut", label: "Solo cut" },
	{ value: "double-detector", label: "Double detector" },
	{ value: "equipment", label: "Equipment" },
];

interface ActionSelectorProps {
	value: MoveType;
	onValueChange: (value: MoveType) => void;
}

/** Segmented single-select for the four action types. */
export function ActionSelector({ value, onValueChange }: ActionSelectorProps) {
	return (
		<ToggleGroup.Root
			type="single"
			value={value}
			onValueChange={(next) => {
				if (next) onValueChange(next as MoveType);
			}}
			className={styles.group}
			aria-label="Action type"
		>
			{ACTIONS.map((action) => (
				<ToggleGroup.Item
					key={action.value}
					value={action.value}
					className={styles.item}
				>
					{action.label}
				</ToggleGroup.Item>
			))}
		</ToggleGroup.Root>
	);
}
