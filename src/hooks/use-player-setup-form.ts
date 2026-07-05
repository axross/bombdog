"use client";

import { useState } from "react";
import { createId } from "@/lib/id";
import { useTrackerStore } from "@/lib/tracker-store";
import {
	type BlueWireValue,
	MAX_PLAYERS,
	MIN_PLAYERS,
	type Player,
	type WireValueOrUnknown,
} from "@/lib/types";

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
 * The player-setup form state machine: seat count, names, Captain, and the
 * starting info tokens, plus the `start` action that assembles the roster.
 */
export interface PlayerSetupForm {
	count: number;
	names: string[];
	captainIndex: number;
	skipInfoTokens: boolean;
	/**
	 * The blue wire each seat marked, by seat index (ids don't exist until
	 * `start`), sized to `MAX_PLAYERS` so raising the count keeps prior picks.
	 */
	infoTokenBySeat: (BlueWireValue | null)[];
	/**
	 * Change the seat count, clamped to the game's player limits; the Captain
	 * follows the last seat down when the count shrinks past them.
	 */
	changeCount: (next: number) => void;
	setName: (index: number, value: string) => void;
	setCaptainIndex: (index: number) => void;
	setSkipInfoTokens: (skip: boolean) => void;
	/**
	 * Record a seat's starting info token. The pad is blue-only with no "?"
	 * option, so only blue values ever arrive; the guard also narrows the
	 * stored type to `BlueWireValue`.
	 */
	setInfoToken: (index: number, value: WireValueOrUnknown) => void;
	/**
	 * Build the roster from the entered names (blank names fall back to
	 * "Player N"), collect the starting info tokens (unless the phase is
	 * skipped), and hand both to the store to open the tracker.
	 */
	start: () => void;
}

/**
 * Own the first-run / post-reset setup form. A reset leaves the prior roster
 * in the store; the form pre-fills from it so the next game keeps the same
 * count, names, and Captain. First run has none.
 */
export function usePlayerSetupForm(): PlayerSetupForm {
	const configurePlayers = useTrackerStore((s) => s.configurePlayers);
	const previousPlayers = useTrackerStore((s) => s.previousPlayers);
	const previousCaptainIndex = useTrackerStore((s) => s.previousCaptainIndex);

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
		if (value === "yellow" || value === "unknown") return;
		setInfoTokenBySeat((prev) => prev.map((w, i) => (i === index ? value : w)));
	};

	const start = () => {
		const players: Player[] = names.slice(0, count).map((name, i) => ({
			id: createId(),
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

	return {
		count,
		names,
		captainIndex,
		skipInfoTokens,
		infoTokenBySeat,
		changeCount,
		setName,
		setCaptainIndex,
		setSkipInfoTokens,
		setInfoToken,
		start,
	};
}
