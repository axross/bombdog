"use client";

import { ToggleGroup } from "radix-ui";
import type { Outcome } from "@/lib/types";
import styles from "./OutcomeToggle.module.css";

interface OutcomeToggleProps {
	value: Outcome | null;
	onValueChange: (value: Outcome) => void;
}

/** Success / Fail single-select. */
export function OutcomeToggle({ value, onValueChange }: OutcomeToggleProps) {
	return (
		<ToggleGroup.Root
			type="single"
			value={value ?? ""}
			onValueChange={(next) => {
				if (next) onValueChange(next as Outcome);
			}}
			className={styles.group}
			aria-label="Outcome"
		>
			<ToggleGroup.Item
				value="success"
				className={`${styles.item} ${styles.success}`}
			>
				✔ Success
			</ToggleGroup.Item>
			<ToggleGroup.Item
				value="fail"
				className={`${styles.item} ${styles.fail}`}
			>
				✕ Fail
			</ToggleGroup.Item>
		</ToggleGroup.Root>
	);
}
