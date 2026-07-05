"use client";

import { useMemo } from "react";
import {
	derivePlayerPossessions,
	deriveWireStatus,
	type PlayerPossession,
	type WireStatus,
} from "@/lib/game";
import { useTrackerStore } from "@/lib/tracker-store";

/**
 * The deduction view derived from the log: per-wire status plus the same data
 * pivoted player-first.
 */
export interface WireStatusView {
	status: WireStatus;
	possessions: PlayerPossession[];
}

/**
 * Derive the wire status board and per-player possessions from the logged
 * moves and starting info tokens, memoized against the store.
 */
export function useWireStatus(): WireStatusView {
	const players = useTrackerStore((s) => s.players);
	const moves = useTrackerStore((s) => s.moves);
	const infoTokens = useTrackerStore((s) => s.infoTokens);

	return useMemo(() => {
		const status = deriveWireStatus(players, moves, infoTokens);
		return { status, possessions: derivePlayerPossessions(players, status) };
	}, [players, moves, infoTokens]);
}
