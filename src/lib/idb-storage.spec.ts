import { describe, expect, it } from "vitest";
import { createMemoryStorage, idbStorage, STORAGE_KEY } from "./idb-storage";

describe("createMemoryStorage()", () => {
	it("round-trips values by key", async () => {
		const storage = createMemoryStorage();

		expect(await storage.getItem("k")).toBeNull();

		await storage.setItem("k", "value");
		expect(await storage.getItem("k")).toBe("value");

		await storage.removeItem("k");
		expect(await storage.getItem("k")).toBeNull();
	});

	it("keeps separate instances isolated", async () => {
		const a = createMemoryStorage();
		const b = createMemoryStorage();

		await a.setItem("k", "in-a");
		expect(await b.getItem("k")).toBeNull();
	});
});

describe("idbStorage", () => {
	it("exposes a defined storage adapter and a stable key", () => {
		expect(idbStorage).toBeDefined();
		expect(STORAGE_KEY).toBe("bombdog:tracker");
	});

	it("round-trips values (memory fallback under jsdom)", async () => {
		// jsdom has no IndexedDB, so this exercises the memory fallback path.
		expect(await idbStorage.getItem("missing")).toBeNull();

		await idbStorage.setItem("k", "value");
		expect(await idbStorage.getItem("k")).toBe("value");

		await idbStorage.removeItem("k");
		expect(await idbStorage.getItem("k")).toBeNull();
	});
});
