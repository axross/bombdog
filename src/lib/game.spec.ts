import { beforeEach, describe, expect, it } from "vitest";
import {
	deriveWireStatus,
	filterMoves,
	formatWire,
	getPlayerName,
	isFilterActive,
	isMoveVisible,
	nextActorId,
	targetPlayerOrder,
	WIRE_COPIES,
	type WireStatus,
	wireLabel,
} from "./game";
import {
	type BlueWireValue,
	type BlueWireValueOrUnknown,
	type DetectorKind,
	type DetectorMove,
	type DualCutMove,
	EMPTY_MOVE_FILTER,
	type Move,
	type Outcome,
	type Player,
	type RevealedWire,
	type SoloCutMove,
	type WireValueOrUnknown,
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

describe("deriveWireStatus()", () => {
	let seq = 0;

	function dual(
		value: WireValueOrUnknown,
		outcome: Outcome,
		opts: { actorId?: string; targetId?: string; revealed?: RevealedWire } = {},
	): DualCutMove {
		seq += 1;
		return {
			id: `m${seq}`,
			seq,
			at: seq,
			type: "dual-cut",
			actorId: opts.actorId ?? "a",
			targetId: opts.targetId ?? "b",
			value,
			outcome,
			...(opts.revealed !== undefined ? { revealed: opts.revealed } : {}),
		};
	}

	function detector(
		detector: DetectorKind,
		values: BlueWireValueOrUnknown[],
		outcome: Outcome,
		opts: {
			actorId?: string;
			targetId?: string;
			revealed?: RevealedWire;
			cutValue?: BlueWireValueOrUnknown;
		} = {},
	): DetectorMove {
		seq += 1;
		return {
			id: `m${seq}`,
			seq,
			at: seq,
			type: "detector",
			detector,
			actorId: opts.actorId ?? "a",
			targetId: opts.targetId ?? "b",
			values,
			outcome,
			...(opts.revealed !== undefined ? { revealed: opts.revealed } : {}),
			...(opts.cutValue !== undefined ? { cutValue: opts.cutValue } : {}),
		};
	}

	function solo(value: WireValueOrUnknown, actorId = "a"): SoloCutMove {
		seq += 1;
		return { id: `m${seq}`, seq, at: seq, type: "solo-cut", actorId, value };
	}

	function derive(
		moves: Move[],
		infoTokens: Record<string, BlueWireValue> = {},
	): WireStatus {
		return deriveWireStatus(players, moves, infoTokens);
	}

	function row(status: WireStatus, value: BlueWireValue) {
		const found = status.blue.find((r) => r.value === value);
		if (!found) throw new Error(`no row for ${value}`);
		return found;
	}

	function holderNames(status: WireStatus, value: BlueWireValue): string[] {
		return row(status, value).holders.map((p) => p.name);
	}

	beforeEach(() => {
		seq = 0;
	});

	it("lists all twelve blue values fully uncut with no moves", () => {
		const status = derive([]);
		expect(status.blue).toHaveLength(12);
		for (const r of status.blue) {
			expect(r.cut).toBe(0);
			expect(r.revealed).toBe(0);
			expect(r.uncut).toBe(WIRE_COPIES);
			expect(r.holders).toEqual([]);
		}
		expect(status.yellowHolders).toEqual([]);
	});

	describe("cut counts", () => {
		it("counts a successful dual cut as two copies (actor + target)", () => {
			const status = derive([dual(9, "success")]);
			expect(row(status, 9).cut).toBe(2);
			expect(row(status, 9).uncut).toBe(2);
		});

		it("does not count a failed dual cut", () => {
			const status = derive([dual(9, "fail", { revealed: 3 })]);
			expect(row(status, 9).cut).toBe(0);
		});

		it("ignores an unknown-value cut in the per-number counts", () => {
			const status = derive([dual("unknown", "success")]);
			for (const r of status.blue) expect(r.cut).toBe(0);
		});

		it("does not count a yellow cut against the blue numbers", () => {
			const status = derive([dual("yellow", "success")]);
			for (const r of status.blue) expect(r.cut).toBe(0);
		});

		it("counts double, triple, and super detectors as two copies each", () => {
			for (const kind of ["double", "triple", "super"] as const) {
				const status = derive([detector(kind, [6], "success")]);
				expect(row(status, 6).cut).toBe(2);
			}
		});

		it("counts an X-or-Y-Ray by its captured actual value, not the names", () => {
			const status = derive([
				detector("x-or-y-ray", [4, 7], "success", { cutValue: 7 }),
			]);
			expect(row(status, 7).cut).toBe(2);
			expect(row(status, 4).cut).toBe(0);
		});

		it("ignores an X-or-Y-Ray success with no captured value", () => {
			const status = derive([detector("x-or-y-ray", [4, 7], "success")]);
			expect(row(status, 4).cut).toBe(0);
			expect(row(status, 7).cut).toBe(0);
		});

		it("marks a solo cut's value fully cut", () => {
			const status = derive([solo(5)]);
			expect(row(status, 5).cut).toBe(WIRE_COPIES);
			expect(row(status, 5).uncut).toBe(0);
		});

		it("completes a value when a solo cut takes the remaining pair", () => {
			// a pair cut earlier (+2), then the last pair solo-cut → fully cut.
			const status = derive([dual(5, "success"), solo(5)]);
			expect(row(status, 5).cut).toBe(WIRE_COPIES);
		});

		it("clamps the cut count at the four copies that exist", () => {
			const status = derive([
				dual(7, "success"),
				dual(7, "success"),
				dual(7, "success"),
			]);
			expect(row(status, 7).cut).toBe(WIRE_COPIES);
			expect(row(status, 7).uncut).toBe(0);
		});
	});

	describe("possession", () => {
		it("marks a starting info token holder", () => {
			const status = derive([], { a: 3 });
			expect(holderNames(status, 3)).toEqual(["Alice"]);
		});

		it("records the target as holder on a failed dual cut", () => {
			const status = derive([dual(2, "fail", { targetId: "c", revealed: 8 })]);
			expect(holderNames(status, 8)).toEqual(["Carol"]);
		});

		it("records a failed detector reveal against the target", () => {
			const status = derive([
				detector("double", [2], "fail", { targetId: "b", revealed: 10 }),
			]);
			expect(holderNames(status, 10)).toEqual(["Bob"]);
		});

		it("records a yellow reveal among the yellow holders, not a blue row", () => {
			const status = derive([
				dual(2, "fail", { targetId: "b", revealed: "yellow" }),
			]);
			expect(status.yellowHolders.map((p) => p.name)).toEqual(["Bob"]);
			for (const r of status.blue) expect(r.holders).toEqual([]);
		});

		it("skips an unknown reveal (it can't be placed on a value)", () => {
			const status = derive([
				dual(2, "fail", { targetId: "b", revealed: "unknown" }),
			]);
			for (const r of status.blue) expect(r.holders).toEqual([]);
			expect(status.yellowHolders).toEqual([]);
		});

		it("consumes a known copy from both actor and target on a success", () => {
			// Alice and Bob each known to hold a 9; a successful 9-cut between them
			// consumes one copy on each side, clearing both.
			const status = derive(
				[dual(9, "success", { actorId: "a", targetId: "b" })],
				{
					a: 9,
					b: 9,
				},
			);
			expect(holderNames(status, 9)).toEqual([]);
		});

		it("leaves an untouched holder in place after a success elsewhere", () => {
			// Carol holds a 9; a 9-cut between Alice and Bob doesn't touch Carol.
			const status = derive(
				[dual(9, "success", { actorId: "a", targetId: "b" })],
				{
					c: 9,
				},
			);
			expect(holderNames(status, 9)).toEqual(["Carol"]);
		});

		it("clears every known holder of a solo-cut value", () => {
			const status = derive([solo(6)], { a: 6, b: 6 });
			expect(holderNames(status, 6)).toEqual([]);
		});

		it("consumes the X-or-Y-Ray's captured value from both sides", () => {
			const status = derive(
				[
					detector("x-or-y-ray", [4, 7], "success", {
						actorId: "a",
						targetId: "b",
						cutValue: 7,
					}),
				],
				{ a: 7, b: 7 },
			);
			expect(holderNames(status, 7)).toEqual([]);
		});

		it("lists holders once, in seat order", () => {
			// Bob revealed a 5, then Alice's info token is a 5: deduped, seat order.
			const status = derive([dual(1, "fail", { targetId: "b", revealed: 5 })], {
				a: 5,
			});
			expect(holderNames(status, 5)).toEqual(["Alice", "Bob"]);
		});
	});

	describe("revealed count", () => {
		it("counts one revealed copy per starting info token", () => {
			const status = derive([], { a: 3 });
			expect(row(status, 3).revealed).toBe(1);
			expect(row(status, 3).cut).toBe(0);
		});

		it("counts a failed-cut reveal as one uncut-but-revealed copy", () => {
			const status = derive([dual(2, "fail", { targetId: "b", revealed: 8 })]);
			expect(row(status, 8).revealed).toBe(1);
		});

		it("counts one revealed copy per distinct known holding", () => {
			// two players each reveal a 5 → two uncut-but-revealed copies.
			const status = derive([dual(1, "fail", { targetId: "b", revealed: 5 })], {
				a: 5,
			});
			expect(row(status, 5).revealed).toBe(2);
		});

		it("drops the revealed count when a cut consumes the copy", () => {
			// Alice's 9 is revealed, then a 9-cut against her consumes it.
			const status = derive(
				[dual(9, "success", { actorId: "b", targetId: "a" })],
				{ a: 9 },
			);
			expect(row(status, 9).revealed).toBe(0);
			expect(row(status, 9).cut).toBe(2);
		});

		it("never reveals more copies than remain uncut", () => {
			// an inconsistent log: three fail-reveals pile three 5s onto Carol while a
			// separate cut removes two 5s elsewhere. Only 4 - 2 = 2 copies can remain,
			// so the revealed count is clamped to 2 despite three known holdings.
			const status = derive([
				dual(1, "fail", { targetId: "c", revealed: 5 }),
				dual(1, "fail", { targetId: "c", revealed: 5 }),
				dual(1, "fail", { targetId: "c", revealed: 5 }),
				dual(5, "success", { actorId: "a", targetId: "b" }),
			]);
			expect(row(status, 5).cut).toBe(2);
			expect(row(status, 5).revealed).toBe(2);
		});
	});

	it("orders replay by seq regardless of array order", () => {
		// a reveal (seq 2) then a consuming success (seq 1) passed out of order:
		// replayed by seq, the success precedes the reveal, so the holder remains.
		const success = dual(9, "success", { actorId: "a", targetId: "b" });
		const reveal = dual(1, "fail", { targetId: "b", revealed: 9 });
		const status = derive([reveal, success], {});
		expect(holderNames(status, 9)).toEqual(["Bob"]);
	});
});
