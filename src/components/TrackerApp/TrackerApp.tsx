"use client";

import { useEffect } from "react";
import { MoveComposer } from "@/components/MoveComposer/MoveComposer";
import { MoveLog } from "@/components/MoveLog/MoveLog";
import { PlayerSetup } from "@/components/PlayerSetup/PlayerSetup";
import { ResetButton } from "@/components/ResetButton/ResetButton";
import { getPlayerName, nextActorId } from "@/lib/game";
import { useTrackerStore } from "@/lib/trackerStore";
import styles from "./TrackerApp.module.css";

/**
 * Top-level client shell. Drives IndexedDB rehydration, then routes between the
 * loading, setup, and tracker states.
 */
export function TrackerApp() {
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
			<main className={styles.loading} aria-busy="true">
				<span className={styles.spinner} aria-hidden="true" />
				<span className={styles.loadingText}>Loading…</span>
			</main>
		);
	}

	if (players.length === 0) {
		return <PlayerSetup />;
	}

	const currentActorId = nextActorId(players, captainIndex, moves);

	return (
		<div className={styles.app}>
			<header className={styles.header}>
				<h1 className={styles.brand}>💣 Bombdog</h1>
				{currentActorId && (
					<span className={styles.turn}>
						<span className={styles.turnLabel}>Turn</span>
						<span className={styles.turnName}>
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
