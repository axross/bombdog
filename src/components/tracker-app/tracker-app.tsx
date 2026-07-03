"use client";

import { Bomb } from "lucide-react";
import { type JSX, useEffect, useState } from "react";
import { MoveComposer } from "@/components/move-composer/move-composer";
import { MoveFilter } from "@/components/move-filter/move-filter";
import { MoveLog } from "@/components/move-log/move-log";
import { PlayerSetup } from "@/components/player-setup/player-setup";
import { ResetButton } from "@/components/reset-button/reset-button";
import { StartingInfo } from "@/components/starting-info/starting-info";
import { useTrackerStore } from "@/lib/tracker-store";
import { EMPTY_MOVE_FILTER, type MoveFilter as Filter } from "@/lib/types";
import css from "./tracker-app.module.css";

/**
 * Top-level client shell. Drives IndexedDB rehydration, then routes between the
 * loading, setup, and tracker states.
 */
export function TrackerApp(): JSX.Element {
	const hasHydrated = useTrackerStore((s) => s.hasHydrated);
	const players = useTrackerStore((s) => s.players);
	// the move-log filter lives here so its trigger can sit in the header while
	// the log below consumes the resulting filter.
	const [filter, setFilter] = useState<Filter>(EMPTY_MOVE_FILTER);

	// hydration is deferred (skipHydration) so server and first client render
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

	return (
		<div className={css.app} data-testid="app">
			<header className={css.header} data-testid="header">
				<h1 className={css.brand}>
					<Bomb className={css.brandIcon} size={22} aria-hidden />
					Bombdog
				</h1>
				<MoveFilter filter={filter} onChange={setFilter} />
				<ResetButton />
			</header>
			<StartingInfo />
			<MoveLog filter={filter} />
			<MoveComposer />
		</div>
	);
}
