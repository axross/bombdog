import { describe, expect, it } from "vitest";
import {
	filterMoves,
	formatWire,
	getPlayerName,
	isFilterActive,
	isMoveVisible,
	nextActorId,
	targetPlayerOrder,
	wireLabel,
} from "./game";
import {
	type DualCutMove,
	EMPTY_MOVE_FILTER,
	type Move,
	type Player,
} from "./types";

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

function equipmentMove(actorId: string, seq: number): Move {
	return {
		id: `m${seq}`,
		seq,
		at: seq,
		type: "equipment",
		actorId,
		equipment: "Radar",
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
	it("formats a blue value as its number", () => {
		expect(formatWire(9)).toBe("9");
	});

	it("formats yellow as 'Y'", () => {
		expect(formatWire("yellow")).toBe("Y");
	});

	it("formats an unknown wire as '?'", () => {
		expect(formatWire("unknown")).toBe("?");
	});
});

describe("wireLabel()", () => {
	it("labels a blue value with its number", () => {
		expect(wireLabel(9)).toBe("Wire 9");
	});

	it("labels yellow", () => {
		expect(wireLabel("yellow")).toBe("Yellow wire");
	});

	it("labels an unknown wire", () => {
		expect(wireLabel("unknown")).toBe("Unknown wire");
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
		// last actor sits in the final seat, so play wraps to seat 0.
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

	it("does not advance the turn for an equipment move", () => {
		// Alice cut, so Bob is up; Bob using equipment keeps the turn on Bob.
		const moves: Move[] = [dualCut("a", 1), equipmentMove("b", 2)];
		expect(nextActorId(players, 0, moves)).toBe("b");
	});

	it("ignores off-turn equipment when advancing", () => {
		// Alice cut (Bob is up); Carol fires equipment off-turn — still Bob's turn.
		const moves: Move[] = [dualCut("a", 1), equipmentMove("c", 2)];
		expect(nextActorId(players, 0, moves)).toBe("b");
	});

	it("skips trailing equipment moves back to the last cut", () => {
		const moves: Move[] = [
			dualCut("a", 1),
			equipmentMove("b", 2),
			equipmentMove("c", 3),
		];
		expect(nextActorId(players, 0, moves)).toBe("b");
	});

	it("suggests the Captain when only equipment moves exist", () => {
		expect(nextActorId(players, 1, [equipmentMove("a", 1)])).toBe("b");
	});
});

// shared move fixtures for the filter contracts below.
const failedDual: DualCutMove = {
	id: "d-fail",
	seq: 1,
	at: 1,
	type: "dual-cut",
	actorId: "a",
	targetId: "b",
	value: 4,
	outcome: "fail",
	revealed: 8,
};
const successDual = dualCut("a", 2);
const solo: Move = {
	id: "s",
	seq: 3,
	at: 3,
	type: "solo-cut",
	actorId: "a",
	value: 5,
};
const equipment: Move = {
	id: "e",
	seq: 4,
	at: 4,
	type: "equipment",
	actorId: "b",
	equipment: "Radar",
};
const filterMovesFixture: Move[] = [failedDual, successDual, solo, equipment];

describe("isMoveVisible()", () => {
	it("shows everything under the empty filter", () => {
		for (const move of filterMovesFixture) {
			expect(isMoveVisible(move, EMPTY_MOVE_FILTER)).toBe(true);
		}
	});

	it("hides only successful dual cuts, keeping failed ones", () => {
		const filter = { ...EMPTY_MOVE_FILTER, excludeSuccessfulDualCut: true };
		expect(isMoveVisible(successDual, filter)).toBe(false);
		expect(isMoveVisible(failedDual, filter)).toBe(true);
	});

	it("hides solo cuts", () => {
		const filter = { ...EMPTY_MOVE_FILTER, excludeSoloCut: true };
		expect(isMoveVisible(solo, filter)).toBe(false);
		expect(isMoveVisible(successDual, filter)).toBe(true);
	});
});

describe("filterMoves()", () => {
	it("returns the input list unchanged when nothing is excluded", () => {
		expect(filterMoves(filterMovesFixture, EMPTY_MOVE_FILTER)).toBe(
			filterMovesFixture,
		);
	});

	it("drops both excluded types while preserving order", () => {
		const filter = {
			excludeSuccessfulDualCut: true,
			excludeSoloCut: true,
		};
		expect(filterMoves(filterMovesFixture, filter)).toEqual([
			failedDual,
			equipment,
		]);
	});
});

describe("isFilterActive()", () => {
	it("is false for the empty filter", () => {
		expect(isFilterActive(EMPTY_MOVE_FILTER)).toBe(false);
	});

	it("is true when any exclusion is set", () => {
		expect(isFilterActive({ ...EMPTY_MOVE_FILTER, excludeSoloCut: true })).toBe(
			true,
		);
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
