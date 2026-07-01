import { beforeEach, describe, expect, it } from "vitest";
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
		redoStack: [],
	});
});

describe("configurePlayers()", () => {
	it("stores players and the captain", () => {
		state().configurePlayers(players, 2);
		expect(state().players).toHaveLength(3);
		expect(state().captainIndex).toBe(2);
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
});
