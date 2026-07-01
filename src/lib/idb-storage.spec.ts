import { describe, expect, it } from "vitest";
import { createMemoryStorage } from "./idb-storage";

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
