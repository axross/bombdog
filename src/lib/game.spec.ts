import { describe, expect, it } from "vitest";
import {
	formatRevealed,
	formatWire,
	getPlayerName,
	nextActorId,
	targetPlayerOrder,
} from "./game";
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

describe("getPlayerName()", () => {
	it("resolves a known player", () => {
		expect(getPlayerName(players, "b")).toBe("Bob");
	});

	it("falls back for an unknown id", () => {
		expect(getPlayerName(players, "zzz")).toBe("Unknown");
	});
});

describe("formatWire()", () => {
	it("formats blue values as numbers", () => {
		expect(formatWire(9)).toBe("9");
	});

	it("formats yellow", () => {
		expect(formatWire("yellow")).toBe("Yellow");
	});
});

describe("formatRevealed()", () => {
	it("labels an unknown wire as '?'", () => {
		expect(formatRevealed("unknown")).toBe("?");
	});

	it("labels yellow as 'Y'", () => {
		expect(formatRevealed("yellow")).toBe("Y");
	});

	it("labels a blue value as its number", () => {
		expect(formatRevealed(9)).toBe("9");
	});
});

describe("nextActorId()", () => {
	it("returns undefined when there are no players", () => {
		expect(nextActorId([], 0, [])).toBeUndefined();
	});

	it("suggests the Captain when no moves have been made", () => {
		expect(nextActorId(players, 1, [])).toBe("b");
	});

	it("wraps the captain index around the seat count", () => {
		// captainIndex 3 with 3 seats wraps to seat 0.
		expect(nextActorId(players, 3, [])).toBe("a");
	});

	it("advances clockwise from the last actor", () => {
		expect(nextActorId(players, 0, [dualCut("a", 1)])).toBe("b");
		expect(nextActorId(players, 0, [dualCut("c", 1)])).toBe("a");
	});

	it("wraps around clockwise after the last seat acts", () => {
		// Last actor sits in the final seat, so play wraps to seat 0.
		expect(nextActorId(players, 0, [dualCut("c", 1)])).toBe("a");
	});

	it("uses only the most recent move to advance", () => {
		expect(nextActorId(players, 0, [dualCut("a", 1), dualCut("b", 2)])).toBe(
			"c",
		);
	});

	it("falls back to the Captain when the last actor is unknown", () => {
		expect(nextActorId(players, 2, [dualCut("gone", 1)])).toBe("c");
	});
});

describe("targetPlayerOrder()", () => {
	it("moves the acting player to the end", () => {
		expect(targetPlayerOrder(players, "a").map((p) => p.id)).toEqual([
			"b",
			"c",
			"a",
		]);
	});

	it("keeps seat order when the actor is not in the list", () => {
		expect(targetPlayerOrder(players, "zzz").map((p) => p.id)).toEqual([
			"a",
			"b",
			"c",
		]);
	});
});
