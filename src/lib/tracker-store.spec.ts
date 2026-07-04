import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTrackerStore } from "./tracker-store";
import type { MoveDraft, Player } from "./types";

const players: Player[] = [
	{ id: "a", name: "Alice" },
	{ id: "b", name: "Bob" },
	{ id: "c", name: "Carol" },
];

const dual: MoveDraft = {
	type: "dual-cut",
	actorId: "a",
	targetId: "b",
	value: 9,
	outcome: "success",
};
const solo: MoveDraft = { type: "solo-cut", actorId: "b", value: 7 };
const equip: MoveDraft = {
	type: "equipment",
	actorId: "c",
	equipment: "Radar",
};

function state() {
	return useTrackerStore.getState();
}

beforeEach(() => {
	useTrackerStore.setState({
		players: [],
		captainIndex: 0,
		moves: [],
		infoTokens: {},
		redoStack: [],
		previousPlayers: [],
		previousCaptainIndex: 0,
	});
});

describe("configurePlayers()", () => {
	it("stores players and the captain", () => {
		state().configurePlayers(players, 2);
		expect(state().players).toHaveLength(3);
		expect(state().captainIndex).toBe(2);
	});

	it("stores the starting info tokens passed at game start", () => {
		state().configurePlayers(players, 1, { a: 9, c: 3 });
		expect(state().infoTokens).toEqual({ a: 9, c: 3 });
	});

	it("defaults info tokens to an empty record when the phase is skipped", () => {
		state().configurePlayers(players, 0, { a: 5 });
		// starting a fresh game with no tokens (omitted arg) clears any prior ones.
		state().configurePlayers(players, 0);
		expect(state().infoTokens).toEqual({});
	});
});

describe("setCaptain()", () => {
	it("updates only the captain seat", () => {
		state().configurePlayers(players, 0);
		state().setCaptain(2);
		expect(state().captainIndex).toBe(2);
		expect(state().players).toHaveLength(3);
	});
});

describe("setInfoToken()", () => {
	it("updates an existing token's value, leaving the others untouched", () => {
		state().configurePlayers(players, 0, { a: 9, c: 4 });

		state().setInfoToken("a", 2);

		expect(state().infoTokens).toEqual({ a: 2, c: 4 });
	});

	it("is a no-op for a player who has no token (never adds one)", () => {
		state().configurePlayers(players, 0, { a: 9 });

		state().setInfoToken("b", 5);

		expect(state().infoTokens).toEqual({ a: 9 });
	});
});

describe("addMove()", () => {
	it("appends moves with monotonic seq and generated fields", () => {
		state().addMove(dual);
		state().addMove(solo);
		const moves = state().moves;
		expect(moves).toHaveLength(2);
		expect(moves[0].seq).toBe(1);
		expect(moves[1].seq).toBe(2);
		expect(moves[0].id).toBeTruthy();
		expect(moves[0].id).not.toBe(moves[1].id);
		expect(moves[0]).toMatchObject(dual);
	});

	it("records every action type", () => {
		state().addMove(dual);
		state().addMove(solo);
		state().addMove(equip);
		expect(state().moves.map((m) => m.type)).toEqual([
			"dual-cut",
			"solo-cut",
			"equipment",
		]);
	});

	describe("when crypto.randomUUID is unavailable", () => {
		// unconditional restore that survives an early failure and doesn't depend
		// on crypto.randomUUID being present at load time.
		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it("still generates a non-empty fallback id", () => {
			vi.stubGlobal("crypto", { randomUUID: undefined });

			state().addMove(dual);
			const move = state().moves[0];
			expect(move.id).toBeTruthy();
			expect(move.id.startsWith("m_")).toBe(true);
		});
	});
});

describe("removeMove()", () => {
	it("deletes the move with the given id, leaving the rest in order", () => {
		state().addMove(dual);
		state().addMove(solo);
		state().addMove(equip);
		const soloId = state().moves[1].id;

		state().removeMove(soloId);

		expect(state().moves.map((m) => m.type)).toEqual(["dual-cut", "equipment"]);
	});

	it("clears the redo stack when a move is deleted", () => {
		state().addMove(dual);
		state().addMove(solo);
		state().undoLastMove();
		expect(state().redoStack).toHaveLength(1);

		state().removeMove(state().moves[0].id);
		expect(state().redoStack).toHaveLength(0);
	});

	it("leaves state untouched for an unknown id", () => {
		state().addMove(dual);
		state().undoLastMove();
		const before = state();

		state().removeMove("does-not-exist");
		expect(state().moves).toEqual(before.moves);
		// the no-op guard preserves the redo stack rather than wiping it.
		expect(state().redoStack).toHaveLength(1);
	});
});

describe("undoLastMove() / redoMove()", () => {
	it("undoes repeatedly and redoes", () => {
		state().addMove(dual);
		state().addMove(solo);
		state().addMove(equip);

		state().undoLastMove();
		state().undoLastMove();
		expect(state().moves.map((m) => m.type)).toEqual(["dual-cut"]);
		expect(state().redoStack).toHaveLength(2);

		state().redoMove();
		expect(state().moves.map((m) => m.type)).toEqual(["dual-cut", "solo-cut"]);
		expect(state().redoStack).toHaveLength(1);
	});

	it("does nothing when stacks are empty", () => {
		state().undoLastMove();
		state().redoMove();
		expect(state().moves).toHaveLength(0);
		expect(state().redoStack).toHaveLength(0);
	});

	it("clears the redo stack when a new move is added", () => {
		state().addMove(dual);
		state().undoLastMove();
		expect(state().redoStack).toHaveLength(1);

		state().addMove(solo);
		expect(state().redoStack).toHaveLength(0);
	});
});

describe("updateMove()", () => {
	it("corrects fields in place, preserving id and seq", () => {
		state().addMove(dual);
		const before = state().moves[0];

		state().updateMove(before.id, { ...dual, outcome: "fail", value: 3 });
		const after = state().moves[0];

		expect(after.id).toBe(before.id);
		expect(after.seq).toBe(before.seq);
		expect(after).toMatchObject({
			type: "dual-cut",
			outcome: "fail",
			value: 3,
		});
	});

	it("ignores a patch whose type does not match the move", () => {
		state().addMove(dual);
		const id = state().moves[0].id;

		state().updateMove(id, solo);
		expect(state().moves[0]).toMatchObject(dual);
	});

	it("ignores an unknown move id", () => {
		state().addMove(dual);
		const before = state().moves[0];

		state().updateMove("does-not-exist", { ...dual, outcome: "fail" });
		expect(state().moves).toHaveLength(1);
		expect(state().moves[0]).toEqual(before);
	});

	it("clears the redo stack", () => {
		state().addMove(dual);
		state().addMove(solo);
		state().undoLastMove();
		expect(state().redoStack).toHaveLength(1);

		state().updateMove(state().moves[0].id, { ...dual, outcome: "fail" });
		expect(state().redoStack).toHaveLength(0);
	});
});

describe("reset()", () => {
	it("clears players, moves, and redo history", () => {
		state().configurePlayers(players, 0);
		state().addMove(dual);
		state().undoLastMove();

		state().reset();
		expect(state().players).toHaveLength(0);
		expect(state().moves).toHaveLength(0);
		expect(state().redoStack).toHaveLength(0);
	});

	it("carries the roster and captain over for the next game", () => {
		state().configurePlayers(players, 2);
		state().addMove(dual);

		state().reset();
		expect(state().previousPlayers).toEqual(players);
		expect(state().previousCaptainIndex).toBe(2);
	});

	it("clears the starting info tokens", () => {
		state().configurePlayers(players, 0, { a: 5, b: 8 });

		state().reset();
		expect(state().infoTokens).toEqual({});
	});
});

describe("persist migration (v1 → v3)", () => {
	const { migrate } = useTrackerStore.persist.getOptions();

	it("rewrites legacy double-detector moves into the unified detector shape", () => {
		const persisted = {
			players,
			captainIndex: 0,
			moves: [
				{
					id: "1",
					seq: 1,
					at: 0,
					type: "double-detector",
					actorId: "a",
					targetId: "b",
					value: 6,
					outcome: "fail",
					revealed: "unknown",
				},
				{
					id: "2",
					seq: 2,
					at: 0,
					type: "dual-cut",
					actorId: "a",
					targetId: "b",
					value: 9,
					outcome: "success",
				},
			],
		};

		const result = migrate?.(persisted, 1) as {
			moves: Record<string, unknown>[];
		};

		expect(result.moves[0]).toEqual({
			id: "1",
			seq: 1,
			at: 0,
			type: "detector",
			detector: "double",
			actorId: "a",
			targetId: "b",
			values: [6],
			outcome: "fail",
			revealed: "unknown",
		});
		// non-detector moves pass through untouched.
		expect(result.moves[1]).toMatchObject({ type: "dual-cut", value: 9 });
	});

	it("defaults values to an empty array when the legacy move had no value", () => {
		const persisted = {
			moves: [
				{
					type: "double-detector",
					actorId: "a",
					targetId: "b",
					outcome: "success",
				},
			],
		};

		const result = migrate?.(persisted, 1) as {
			moves: Record<string, unknown>[];
		};

		expect(result.moves[0]).toMatchObject({
			type: "detector",
			detector: "double",
			values: [],
		});
	});

	it("drops legacy equipment moves that logged a detector card as free text", () => {
		const persisted = {
			moves: [
				{ id: "1", seq: 1, at: 0, type: "solo-cut", actorId: "a", value: 5 },
				{
					id: "2",
					seq: 2,
					at: 0,
					type: "equipment",
					actorId: "a",
					equipment: "Triple Detector (3)",
				},
				{
					id: "3",
					seq: 3,
					at: 0,
					type: "equipment",
					actorId: "a",
					equipment: "X or Y Ray (10)",
					note: "checked seat 2",
				},
				{
					id: "4",
					seq: 4,
					at: 0,
					type: "equipment",
					actorId: "a",
					equipment: "Rewinder (6)",
				},
			],
		};

		const result = migrate?.(persisted, 1) as {
			moves: Record<string, unknown>[];
		};

		// the two detector-card equipment logs are gone; the solo cut and the
		// still-valid Rewinder equipment survive.
		expect(result.moves.map((m) => m.id)).toEqual(["1", "4"]);
	});

	it("leaves already-current state untouched", () => {
		const persisted = {
			moves: [{ type: "detector", detector: "triple", values: [3] }],
			infoTokens: { a: 7 },
		};

		const result = migrate?.(persisted, 3) as {
			moves: Record<string, unknown>[];
			infoTokens: Record<string, unknown>;
		};

		expect(result.moves[0]).toMatchObject({
			type: "detector",
			detector: "triple",
		});
		expect(result.infoTokens).toEqual({ a: 7 });
	});

	it("defaults info tokens to an empty record for pre-v3 state", () => {
		const persisted = { players, captainIndex: 0, moves: [] };

		const result = migrate?.(persisted, 2) as { infoTokens?: unknown };

		expect(result.infoTokens).toEqual({});
	});

	it("keeps info tokens already recorded on pre-v3 state", () => {
		const persisted = {
			players,
			captainIndex: 0,
			moves: [],
			infoTokens: { a: 4 },
		};

		const result = migrate?.(persisted, 2) as { infoTokens?: unknown };

		expect(result.infoTokens).toEqual({ a: 4 });
	});

	it("tolerates non-object state, a missing moves array, and odd entries", () => {
		expect(migrate?.(null, 1)).toBeNull();
		// the v3 step defaults the new info-tokens field on any surviving object.
		expect(migrate?.({ players }, 1)).toEqual({ players, infoTokens: {} });
		expect(migrate?.({ moves: "nope" }, 1)).toEqual({
			moves: "nope",
			infoTokens: {},
		});

		const withOddEntries = {
			moves: [null, "x", { type: "solo-cut", value: 5 }],
		};
		expect(migrate?.(withOddEntries, 1)).toEqual({
			...withOddEntries,
			infoTokens: {},
		});
	});
});

describe("persist.rehydrate()", () => {
	it("flips hasHydrated once rehydration completes", async () => {
		useTrackerStore.setState({ hasHydrated: false });
		expect(state().hasHydrated).toBe(false);

		await useTrackerStore.persist.rehydrate();
		expect(state().hasHydrated).toBe(true);
	});
});
