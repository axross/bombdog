"use client";

import { Bomb } from "lucide-react";
import { type JSX, useEffect } from "react";
import { MoveComposer } from "@/components/move-composer/move-composer";
import { MoveLog } from "@/components/move-log/move-log";
import { PlayerSetup } from "@/components/player-setup/player-setup";
import { ResetButton } from "@/components/reset-button/reset-button";
import { getPlayerName, nextActorId } from "@/lib/game";
import { useTrackerStore } from "@/lib/tracker-store";
import css from "./tracker-app.module.css";

/**
 * Top-level client shell. Drives IndexedDB rehydration, then routes between the
 * loading, setup, and tracker states.
 */
export function TrackerApp(): JSX.Element {
	const hasHydrated = useTrackerStore((s) => s.hasHydrated);
	const players = useTrackerStore((s) => s.players);
	const captainIndex = useTrackerStore((s) => s.captainIndex);
	const moves = useTrackerStore((s) => s.moves);

	// Hydration is deferred (skipHydration) so server and first client render
	// match; kick it off once mounted.
	useEffect(() => {
		void useTrackerStore.persist.rehydrate();
	}, []);

	if (!hasHydrated) {
		return (
			<main className={css.loading} aria-busy="true" data-testid="loading">
				<span className={css.spinner} aria-hidden="true" />
				<span className={css.loadingText}>Loading…</span>
			</main>
		);
	}

	if (players.length === 0) {
		return <PlayerSetup />;
	}

	const currentActorId = nextActorId(players, captainIndex, moves);

	return (
		<div className={css.app} data-testid="app">
			<header className={css.header} data-testid="header">
				<h1 className={css.brand}>
					<Bomb className={css.brandIcon} size={22} aria-hidden />
					Bombdog
				</h1>
				{currentActorId && (
					<span className={css.turn}>
						<span className={css.turnLabel}>Turn</span>
						<span className={css.turnName}>
							{getPlayerName(players, currentActorId)}
						</span>
					</span>
				)}
				<ResetButton />
			</header>
			<MoveLog />
			<MoveComposer />
		</div>
	);
}
