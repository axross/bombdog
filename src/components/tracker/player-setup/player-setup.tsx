"use client";

import { Bomb } from "lucide-react";
import { RadioGroup } from "radix-ui";
import { type JSX, useState } from "react";
import { WirePad } from "@/components/ui/wire-pad/wire-pad";
import { useTrackerStore } from "@/lib/tracker-store";
import {
	type BlueWireValue,
	MAX_PLAYERS,
	MIN_PLAYERS,
	type Player,
	type WireValueOrUnknown,
} from "@/lib/types";
import css from "./player-setup.module.css";

function defaultNames(): string[] {
	return Array.from({ length: MAX_PLAYERS }, (_, i) => `Player ${i + 1}`);
}

/**
 * Seed the seat-name inputs, keeping the array at `MAX_PLAYERS` so raising the
 * count reveals fresh default names. Names carried over from a previous game
 * (via reset) override the defaults for the seats they cover.
 */
function seedNames(previous: Player[]): string[] {
	return defaultNames().map((name, i) => previous[i]?.name ?? name);
}

/**
 * Generate a stable seat id, preferring `crypto.randomUUID` and falling back to
 * a random base-36 string in environments where it is unavailable.
 */
function makeId(): string {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return `p_${Math.random().toString(36).slice(2)}`;
}

/**
 * First-run / post-reset screen: pick player count, names, and the Captain.
 */
export function PlayerSetup(): JSX.Element {
	const configurePlayers = useTrackerStore((s) => s.configurePlayers);
	const previousPlayers = useTrackerStore((s) => s.previousPlayers);
	const previousCaptainIndex = useTrackerStore((s) => s.previousCaptainIndex);

	// a reset leaves the prior roster here; pre-fill the setup from it so the
	// next game keeps the same count, names, and Captain. first run has none.
	const [count, setCount] = useState(() =>
		previousPlayers.length > 0 ? previousPlayers.length : 4,
	);
	const [names, setNames] = useState<string[]>(() =>
		seedNames(previousPlayers),
	);
	const [captainIndex, setCaptainIndex] = useState(() =>
		previousPlayers.length > 0
			? Math.min(previousCaptainIndex, previousPlayers.length - 1)
			: 0,
	);

	// starting info tokens: whether the phase is skipped (some missions disallow
	// it), and the blue wire each seat marked. kept per seat index (ids don't
	// exist until Start) and sized to MAX_PLAYERS so raising the count keeps prior
	// picks, mirroring `names`.
	const [skipInfoTokens, setSkipInfoTokens] = useState(false);
	const [infoTokenBySeat, setInfoTokenBySeat] = useState<
		(BlueWireValue | null)[]
	>(() => Array.from({ length: MAX_PLAYERS }, () => null));

	const changeCount = (next: number) => {
		const clamped = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, next));
		setCount(clamped);
		if (captainIndex >= clamped) setCaptainIndex(clamped - 1);
	};

	const setName = (index: number, value: string) => {
		setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
	};

	const setInfoToken = (index: number, value: WireValueOrUnknown) => {
		// the pad is blue-only with no "?" option, so only blue values ever arrive;
		// the guard also narrows the stored type to BlueWireValue.
		if (value === "yellow" || value === "unknown") return;
		setInfoTokenBySeat((prev) => prev.map((w, i) => (i === index ? value : w)));
	};

	/**
	 * Build the roster from the entered names (blank names fall back to
	 * "Player N"), collect the starting info tokens (unless the phase is skipped),
	 * and hand both to the store to open the tracker.
	 */
	const handleStart = () => {
		const players: Player[] = names.slice(0, count).map((name, i) => ({
			id: makeId(),
			name: name.trim() || `Player ${i + 1}`,
		}));
		const infoTokens: Record<string, BlueWireValue> = {};
		if (!skipInfoTokens) {
			// map each seat's pick onto the freshly-generated player id; unset seats
			// simply contribute no token (selection is optional and non-blocking).
			players.forEach((player, i) => {
				const wire = infoTokenBySeat[i];
				if (wire != null) infoTokens[player.id] = wire;
			});
		}
		configurePlayers(players, captainIndex, infoTokens);
	};

	return (
		<main className={css.setup} data-testid="setup">
			<header className={css.header}>
				<h1 className={css.title}>
					<Bomb className={css.titleIcon} size={28} aria-hidden />
					Bombdog
				</h1>
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
					<span
						className={css.count}
						aria-live="polite"
						data-testid="player-count"
					>
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

			<label className={css.skip}>
				<input
					type="checkbox"
					checked={skipInfoTokens}
					onChange={(e) => setSkipInfoTokens(e.target.checked)}
					data-testid="skip-info-tokens"
				/>
				Skip starting info tokens
			</label>

			{/* The hint leads into the per-seat wire pads, so it is grouped with the
			    roster (tight gap) and kept clear of the skip toggle above it. */}
			<div className={css.roster}>
				{!skipInfoTokens && (
					<p className={css.infoHint}>
						Tap the wire each player marked with their info token.
					</p>
				)}
				<RadioGroup.Root
					className={css.seats}
					value={String(captainIndex)}
					onValueChange={(v) => setCaptainIndex(Number(v))}
					aria-label="Choose the Captain"
				>
					{Array.from({ length: count }, (_, i) => (
						// seats are positional: the seat index *is* the identity here
						// (the Captain is tracked by index), so an index key is correct.
						// biome-ignore lint/suspicious/noArrayIndexKey: seat identity is its position
						<div key={i} className={css.seat}>
							<div className={css.seatMain}>
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
									// select the whole name on focus so typing replaces it
									// outright — players rarely tweak the default, they retype it.
									onFocus={(e) => e.target.select()}
									aria-label={`Name of player ${i + 1}`}
									maxLength={24}
								/>
								{captainIndex === i && (
									<span className={css.captainTag}>Captain</span>
								)}
							</div>
							{!skipInfoTokens && (
								<WirePad
									label="Info token"
									value={infoTokenBySeat[i] ?? null}
									onValueChange={(value) => setInfoToken(i, value)}
									blueOnly
									className={css.infoPad}
									data-testid={`info-token-${i}`}
								/>
							)}
						</div>
					))}
				</RadioGroup.Root>
			</div>

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
