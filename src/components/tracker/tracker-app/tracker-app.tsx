"use client";

import { Bomb } from "lucide-react";
import { type JSX, useState } from "react";
import { Spinner } from "@/components/primitives/spinner/spinner";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/primitives/tabs/tabs";
import { MoveComposer } from "@/components/tracker/move-composer/move-composer";
import { MoveFilter } from "@/components/tracker/move-filter/move-filter";
import { MoveLog } from "@/components/tracker/move-log/move-log";
import { PlayerSetup } from "@/components/tracker/player-setup/player-setup";
import { ResetButton } from "@/components/tracker/reset-button/reset-button";
import { StatusPanel } from "@/components/tracker/status-panel/status-panel";
import { useTrackerHydration } from "@/hooks/use-tracker-hydration";
import { useTrackerStore } from "@/lib/tracker-store";
import { EMPTY_MOVE_FILTER, type MoveFilter as Filter } from "@/lib/types";
import css from "./tracker-app.module.css";

/**
 * The tracker's two content views: the move history and the derived wire status.
 */
type Tab = "moves" | "status";

/**
 * Top-level client shell. Drives IndexedDB rehydration, then routes between the
 * loading, setup, and tracker states.
 */
export function TrackerApp(): JSX.Element {
	// hydration is deferred (skipHydration) so server and first client render
	// match; the hook kicks it off once mounted.
	const hasHydrated = useTrackerHydration();
	const players = useTrackerStore((s) => s.players);
	// the move-log filter lives here so its trigger can sit in the tab bar while
	// the log below consumes the resulting filter.
	const [filter, setFilter] = useState<Filter>(EMPTY_MOVE_FILTER);
	const [tab, setTab] = useState<Tab>("moves");

	if (!hasHydrated) {
		return (
			<main className={css.loading} aria-busy="true" data-testid="loading">
				<Spinner />
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
				<ResetButton />
			</header>
			<Tabs
				className={css.tabsRoot}
				value={tab}
				onValueChange={(next) => setTab(next as Tab)}
			>
				<div className={css.tabBar}>
					<TabsList className={css.tabs} aria-label="View">
						<TabsTrigger
							value="moves"
							className={css.tab}
							data-testid="tab-moves"
						>
							Moves
						</TabsTrigger>
						<TabsTrigger
							value="status"
							className={css.tab}
							data-testid="tab-status"
						>
							Status
						</TabsTrigger>
					</TabsList>
					{/* the filter only affects the move list, so it rides the tab bar and
					    shows only while the Moves view is active. */}
					{tab === "moves" && (
						<MoveFilter filter={filter} onChange={setFilter} />
					)}
				</div>
				<TabsContent
					value="moves"
					className={css.panel}
					data-testid="tab-panel-moves"
				>
					<MoveLog filter={filter} />
				</TabsContent>
				<TabsContent
					value="status"
					className={css.panel}
					data-testid="tab-panel-status"
				>
					<StatusPanel />
				</TabsContent>
			</Tabs>
			<MoveComposer />
		</div>
	);
}
