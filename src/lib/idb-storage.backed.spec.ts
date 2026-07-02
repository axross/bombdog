import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// exercises the IndexedDB-backed branch of `idbStorage`. under jsdom there is
// no `indexedDB`, so the module normally resolves to the in-memory fallback
// (covered in idb-storage.spec.ts). here we stub a global `indexedDB` and mock
// idb-keyval, then re-import the module so it selects the idb-backed adapter.

const get = vi.fn();
const set = vi.fn();
const del = vi.fn();

vi.mock("idb-keyval", () => ({
	get: (...args: unknown[]) => get(...args),
	set: (...args: unknown[]) => set(...args),
	del: (...args: unknown[]) => del(...args),
}));

describe("idbStorage (IndexedDB-backed adapter)", () => {
	beforeEach(() => {
		vi.resetModules();
		get.mockReset();
		set.mockReset();
		del.mockReset();
		// make isIndexedDbAvailable() true when the module is evaluated.
		vi.stubGlobal("indexedDB", {} as IDBFactory);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("reads through idb-keyval get(), mapping a missing value to null", async () => {
		const { idbStorage } = await import("./idb-storage");

		get.mockResolvedValueOnce("state-blob");
		await expect(idbStorage.getItem("k")).resolves.toBe("state-blob");
		expect(get).toHaveBeenCalledWith("k");

		get.mockResolvedValueOnce(undefined);
		await expect(idbStorage.getItem("absent")).resolves.toBeNull();
	});

	it("writes through set() and deletes through del()", async () => {
		set.mockResolvedValueOnce(undefined);
		del.mockResolvedValueOnce(undefined);
		const { idbStorage } = await import("./idb-storage");

		await idbStorage.setItem("k", "v");
		expect(set).toHaveBeenCalledWith("k", "v");

		await idbStorage.removeItem("k");
		expect(del).toHaveBeenCalledWith("k");
	});
});
