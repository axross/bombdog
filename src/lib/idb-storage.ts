// storage adapters for zustand's `persist` middleware.
//
// the browser adapter is backed by IndexedDB (via idb-keyval). when IndexedDB
// is unavailable — server-side rendering, or a browser in private mode that
// blocks it — we fall back to an in-memory Map so the store still works (state
// simply won't survive a reload in that degraded case).

import { del, get, set } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";

/**
 * IndexedDB key under which the whole persisted state blob is stored.
 */
export const STORAGE_KEY = "bombdog:tracker";

/**
 * In-memory `StateStorage`, used for tests and as a graceful fallback.
 */
export function createMemoryStorage(): StateStorage {
	const map = new Map<string, string>();
	return {
		getItem: (name) => map.get(name) ?? null,
		setItem: (name, value) => {
			map.set(name, value);
		},
		removeItem: (name) => {
			map.delete(name);
		},
	};
}

const idbBackedStorage: StateStorage = {
	getItem: async (name) => (await get<string>(name)) ?? null,
	setItem: async (name, value) => {
		await set(name, value);
	},
	removeItem: async (name) => {
		await del(name);
	},
};

/**
 * Whether the runtime exposes a usable `indexedDB` global.
 *
 * @remarks
 * Wrapped in try/catch because reading `indexedDB` can throw in sandboxed
 * contexts; server-side rendering simply lacks the global.
 */
function isIndexedDbAvailable(): boolean {
	try {
		return typeof indexedDB !== "undefined";
	} catch {
		return false;
	}
}

/**
 * The storage used by the tracker store: IndexedDB when available, else memory.
 */
export const idbStorage: StateStorage = isIndexedDbAvailable()
	? idbBackedStorage
	: createMemoryStorage();
