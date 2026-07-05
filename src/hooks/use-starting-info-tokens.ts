"use client";

import { useMemo } from "react";
import { useTrackerStore } from "@/lib/tracker-store";
import type { BlueWireValue, Player } from "@/lib/types";

/**
 * A player who placed a starting info token, paired with its revealed value.
 */
export interface StartingInfoToken {
	player: Player;
	value: BlueWireValue;
}

/**
 * The recorded starting info tokens in seat order: each player joined with
 * the blue wire they revealed, skipping players who placed none. Empty when
 * the phase was skipped or nothing was recorded.
 */
export function useStartingInfoTokens(): StartingInfoToken[] {
	const players = useTrackerStore((s) => s.players);
	const infoTokens = useTrackerStore((s) => s.infoTokens);

	return useMemo(
		() =>
			players
				.map((player) => ({ player, value: infoTokens[player.id] }))
				.filter((entry): entry is StartingInfoToken => entry.value != null),
		[players, infoTokens],
	);
}
