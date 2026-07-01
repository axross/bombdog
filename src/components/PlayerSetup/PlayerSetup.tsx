"use client";

import { RadioGroup } from "radix-ui";
import { useState } from "react";
import { useTrackerStore } from "@/lib/trackerStore";
import { MAX_PLAYERS, MIN_PLAYERS, type Player } from "@/lib/types";
import styles from "./PlayerSetup.module.css";

function defaultNames(): string[] {
	return Array.from({ length: MAX_PLAYERS }, (_, i) => `Player ${i + 1}`);
}

function makeId(): string {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return `p_${Math.random().toString(36).slice(2)}`;
}

/** First-run / post-reset screen: pick player count, names, and the Captain. */
export function PlayerSetup() {
	const configurePlayers = useTrackerStore((s) => s.configurePlayers);
	const [count, setCount] = useState(3);
	const [names, setNames] = useState<string[]>(defaultNames);
	const [captainIndex, setCaptainIndex] = useState(0);

	const changeCount = (next: number) => {
		const clamped = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, next));
		setCount(clamped);
		if (captainIndex >= clamped) setCaptainIndex(clamped - 1);
	};

	const setName = (index: number, value: string) => {
		setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
	};

	const handleStart = () => {
		const players: Player[] = names.slice(0, count).map((name, i) => ({
			id: makeId(),
			name: name.trim() || `Player ${i + 1}`,
		}));
		configurePlayers(players, captainIndex);
	};

	return (
		<main className={styles.setup}>
			<header className={styles.header}>
				<h1 className={styles.title}>💣 Bombdog</h1>
				<p className={styles.tagline}>
					Log every player's turn in Bomb Busters. Nothing to memorise.
				</p>
			</header>

			<div className={styles.counter}>
				<span className={styles.counterLabel}>Players</span>
				<div className={styles.stepper}>
					<button
						type="button"
						className={styles.stepButton}
						onClick={() => changeCount(count - 1)}
						disabled={count <= MIN_PLAYERS}
						aria-label="Remove a player"
					>
						−
					</button>
					<span className={styles.count} aria-live="polite">
						{count}
					</span>
					<button
						type="button"
						className={styles.stepButton}
						onClick={() => changeCount(count + 1)}
						disabled={count >= MAX_PLAYERS}
						aria-label="Add a player"
					>
						+
					</button>
				</div>
			</div>

			<RadioGroup.Root
				className={styles.seats}
				value={String(captainIndex)}
				onValueChange={(v) => setCaptainIndex(Number(v))}
				aria-label="Choose the Captain"
			>
				{Array.from({ length: count }, (_, i) => (
					// Seats are positional: the seat index *is* the identity here
					// (the Captain is tracked by index), so an index key is correct.
					// biome-ignore lint/suspicious/noArrayIndexKey: seat identity is its position
					<div key={i} className={styles.seat}>
						<RadioGroup.Item
							className={styles.radio}
							value={String(i)}
							id={`captain-${i}`}
							aria-label={`Make player ${i + 1} the Captain`}
						>
							<RadioGroup.Indicator className={styles.radioDot} />
						</RadioGroup.Item>
						<input
							className={styles.nameInput}
							type="text"
							value={names[i]}
							onChange={(e) => setName(i, e.target.value)}
							aria-label={`Name of player ${i + 1}`}
							maxLength={24}
						/>
						{captainIndex === i && (
							<span className={styles.captainTag}>Captain</span>
						)}
					</div>
				))}
			</RadioGroup.Root>

			<button type="button" className={styles.start} onClick={handleStart}>
				Start tracking
			</button>
		</main>
	);
}
