import { describe, expect, it } from "vitest";
import { formatWire, getPlayerName, nextActorId } from "./game";
import type { DualCutMove, Player } from "./types";

const players: Player[] = [
	{ id: "a", name: "Alice" },
	{ id: "b", name: "Bob" },
	{ id: "c", name: "Carol" },
];

function dualCut(actorId: string, seq: number): DualCutMove {
	return {
		id: `m${seq}`,
		seq,
		at: seq,
		type: "dual-cut",
		actorId,
		targetId: "b",
		value: 9,
		outcome: "success",
	};
}

describe("getPlayerName", () => {
	it("resolves a known player", () => {
		expect(getPlayerName(players, "b")).toBe("Bob");
	});

	it("falls back for an unknown id", () => {
		expect(getPlayerName(players, "zzz")).toBe("Unknown");
	});
});

describe("formatWire", () => {
	it("formats blue values as numbers", () => {
		expect(formatWire(9)).toBe("9");
	});

	it("formats yellow", () => {
		expect(formatWire("yellow")).toBe("Yellow");
	});
});

describe("nextActorId", () => {
	it("returns undefined when there are no players", () => {
		expect(nextActorId([], 0, [])).toBeUndefined();
	});

	it("suggests the Captain when no moves have been made", () => {
		expect(nextActorId(players, 1, [])).toBe("b");
	});

	it("advances clockwise from the last actor", () => {
		expect(nextActorId(players, 0, [dualCut("a", 1)])).toBe("b");
		expect(nextActorId(players, 0, [dualCut("c", 1)])).toBe("a");
	});

	it("falls back to the Captain when the last actor is unknown", () => {
		expect(nextActorId(players, 2, [dualCut("gone", 1)])).toBe("c");
	});
});
