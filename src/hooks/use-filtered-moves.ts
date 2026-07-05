"use client";

import { useMemo } from "react";
import { filterMoves } from "@/lib/game";
import { useTrackerStore } from "@/lib/tracker-store";
import type { Move, MoveFilter } from "@/lib/types";

/**
 * The logged moves that pass the given filter, memoized against the store's
 * move list.
 */
export function useFilteredMoves(filter: MoveFilter): Move[] {
	const moves = useTrackerStore((s) => s.moves);
	return useMemo(() => filterMoves(moves, filter), [moves, filter]);
}
