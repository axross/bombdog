"use client";

import { nextActorId } from "@/lib/game";
import { useTrackerStore } from "@/lib/tracker-store";
import type { MoveDraft } from "@/lib/types";

/**
 * The turn-suggestion rule bound to the store: who should act next.
 */
export interface NextActorSuggestion {
	/**
	 * The suggested next actor's id, derived from the logged moves. Falls back
	 * to the first player (or `""` before setup) when the rule has no answer.
	 */
	suggestedActor: string;
	/**
	 * The suggestion as it will read once `draft` is logged, so a form can seed
	 * its next entry without waiting for the store update. Runs the same
	 * {@link nextActorId} rule a reload rehydrates through — one source of
	 * truth, so the live suggestion matches what a reload would show.
	 */
	suggestAfterLogging: (draft: MoveDraft) => string;
}

/**
 * Suggest the acting player for the next move, per the game's turn rule
 * (equipment moves keep the turn in place; everything else advances clockwise
 * from the Captain).
 */
export function useNextActor(): NextActorSuggestion {
	const players = useTrackerStore((s) => s.players);
	const captainIndex = useTrackerStore((s) => s.captainIndex);
	const moves = useTrackerStore((s) => s.moves);

	const suggestedActor =
		nextActorId(players, captainIndex, moves) ?? players[0]?.id ?? "";

	const suggestAfterLogging = (draft: MoveDraft): string =>
		// the id/seq/at are placeholders: nextActorId only reads `type` and
		// `actorId`.
		nextActorId(players, captainIndex, [
			...moves,
			{ ...draft, id: "", seq: 0, at: 0 },
		]) ?? draft.actorId;

	return { suggestedActor, suggestAfterLogging };
}
