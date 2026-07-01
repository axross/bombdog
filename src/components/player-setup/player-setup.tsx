"use client";

import { RadioGroup } from "radix-ui";
import { type JSX, useState } from "react";
import { useTrackerStore } from "@/lib/tracker-store";
import { MAX_PLAYERS, MIN_PLAYERS, type Player } from "@/lib/types";
import css from "./player-setup.module.css";

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
export function PlayerSetup(): JSX.Element {
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
		<main className={css.setup} data-testid="setup">
			<header className={css.header}>
				<h1 className={css.title}>💣 Bombdog</h1>
				<p className={css.tagline}>
					Log every player's turn in Bomb Busters. Nothing to memorise.
				</p>
			</header>

			<div className={css.counter}>
				<span className={css.counterLabel}>Players</span>
				<div className={css.stepper}>
					<button
						type="button"
						className={css.stepButton}
						onClick={() => changeCount(count - 1)}
						disabled={count <= MIN_PLAYERS}
						aria-label="Remove a player"
					>
						−
					</button>
					<span className={css.count} aria-live="polite">
						{count}
					</span>
					<button
						type="button"
						className={css.stepButton}
						onClick={() => changeCount(count + 1)}
						disabled={count >= MAX_PLAYERS}
						aria-label="Add a player"
					>
						+
					</button>
				</div>
			</div>

			<RadioGroup.Root
				className={css.seats}
				value={String(captainIndex)}
				onValueChange={(v) => setCaptainIndex(Number(v))}
				aria-label="Choose the Captain"
			>
				{Array.from({ length: count }, (_, i) => (
					// Seats are positional: the seat index *is* the identity here
					// (the Captain is tracked by index), so an index key is correct.
					// biome-ignore lint/suspicious/noArrayIndexKey: seat identity is its position
					<div key={i} className={css.seat}>
						<RadioGroup.Item
							className={css.radio}
							value={String(i)}
							id={`captain-${i}`}
							aria-label={`Make player ${i + 1} the Captain`}
						>
							<RadioGroup.Indicator className={css.radioDot} />
						</RadioGroup.Item>
						<input
							className={css.nameInput}
							type="text"
							value={names[i]}
							onChange={(e) => setName(i, e.target.value)}
							aria-label={`Name of player ${i + 1}`}
							maxLength={24}
						/>
						{captainIndex === i && (
							<span className={css.captainTag}>Captain</span>
						)}
					</div>
				))}
			</RadioGroup.Root>

			<button
				type="button"
				className={css.start}
				onClick={handleStart}
				data-testid="start"
			>
				Start tracking
			</button>
		</main>
	);
}
