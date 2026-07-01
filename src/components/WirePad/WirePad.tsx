"use client";

import { ToggleGroup } from "radix-ui";
import { BLUE_WIRE_VALUES, type WireValue } from "@/lib/types";
import styles from "./WirePad.module.css";

interface WirePadProps {
	value: WireValue | null;
	onValueChange: (value: WireValue) => void;
	/** Hide the Yellow option — detectors indicate blue values only. */
	blueOnly?: boolean;
}

function toKey(value: WireValue): string {
	return String(value);
}

function fromKey(key: string): WireValue {
	return key === "yellow" ? "yellow" : (Number(key) as WireValue);
}

/** Grid of wire buttons: 1–12 and (unless blue-only) Yellow. */
export function WirePad({
	value,
	onValueChange,
	blueOnly = false,
}: WirePadProps) {
	return (
		<ToggleGroup.Root
			type="single"
			value={value === null ? "" : toKey(value)}
			onValueChange={(next) => {
				if (next) onValueChange(fromKey(next));
			}}
			className={styles.pad}
			aria-label="Wire value"
		>
			{BLUE_WIRE_VALUES.map((n) => (
				<ToggleGroup.Item
					key={n}
					value={toKey(n)}
					className={styles.wire}
					aria-label={`Wire ${n}`}
				>
					{n}
				</ToggleGroup.Item>
			))}
			{!blueOnly && (
				<ToggleGroup.Item
					value="yellow"
					className={`${styles.wire} ${styles.yellow}`}
					aria-label="Yellow wire"
				>
					Y
				</ToggleGroup.Item>
			)}
		</ToggleGroup.Root>
	);
}
