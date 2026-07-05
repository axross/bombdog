"use client";

import { useEffect } from "react";
import { useTrackerStore } from "@/lib/tracker-store";

/**
 * Kick off the tracker store's deferred IndexedDB rehydration and report
 * whether it has completed. Hydration is deferred (`skipHydration`) so server
 * and first client render match; this hook starts it once mounted.
 *
 * @returns `true` once persisted state has been restored.
 */
export function useTrackerHydration(): boolean {
	const hasHydrated = useTrackerStore((s) => s.hasHydrated);

	useEffect(() => {
		void useTrackerStore.persist.rehydrate();
	}, []);

	return hasHydrated;
}
