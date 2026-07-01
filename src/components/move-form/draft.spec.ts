import { describe, expect, it } from "vitest";
import type {
	DoubleDetectorMove,
	DualCutMove,
	EquipmentMove,
	SoloCutMove,
} from "@/lib/types";
import { buildDraft, emptyDraftFields, fieldsFromMove } from "./draft";

describe("emptyDraftFields()", () => {
	it("returns an all-empty shape with the given actor", () => {
		expect(emptyDraftFields("a")).toEqual({
			actorId: "a",
			targetId: "",
			value: null,
			outcome: null,
			revealed: null,
			equipment: "",
			note: "",
		});
	});

	it("defaults the actor to an empty string", () => {
		expect(emptyDraftFields().actorId).toBe("");
	});
});

describe("buildDraft()", () => {
	it("requires actor, target, wire, and outcome for a dual cut", () => {
		const f = emptyDraftFields("a");
		expect(buildDraft("dual-cut", f)).toBeNull();
		expect(
			buildDraft("dual-cut", { ...f, targetId: "b", value: 9 }),
		).toBeNull();
		expect(
			buildDraft("dual-cut", {
				...f,
				targetId: "b",
				value: 9,
				outcome: "success",
			}),
		).toEqual({
			type: "dual-cut",
			actorId: "a",
			targetId: "b",
			value: 9,
			outcome: "success",
		});
	});

	describe("when a cut fails", () => {
		const failing = {
			...emptyDraftFields("a"),
			targetId: "b",
			value: 9 as const,
			outcome: "fail" as const,
		};

		it("requires the revealed wire value", () => {
			expect(buildDraft("dual-cut", failing)).toBeNull();
			expect(buildDraft("dual-cut", { ...failing, revealed: 8 })).toEqual({
				type: "dual-cut",
				actorId: "a",
				targetId: "b",
				value: 9,
				outcome: "fail",
				revealed: 8,
			});
		});

		it("accepts the unknown ('?') revealed value", () => {
			expect(
				buildDraft("dual-cut", { ...failing, revealed: "unknown" }),
			).toMatchObject({ outcome: "fail", revealed: "unknown" });
		});

		it("omits the revealed value on a success", () => {
			expect(
				buildDraft("dual-cut", {
					...failing,
					outcome: "success",
					revealed: 8,
				}),
			).toEqual({
				type: "dual-cut",
				actorId: "a",
				targetId: "b",
				value: 9,
				outcome: "success",
			});
		});
	});

	it("returns null for a dual cut without an actor", () => {
		expect(
			buildDraft("dual-cut", {
				...emptyDraftFields(""),
				targetId: "b",
				value: 9,
				outcome: "success",
			}),
		).toBeNull();
	});

	it("requires only actor and wire for a solo cut, and allows yellow", () => {
		expect(buildDraft("solo-cut", emptyDraftFields("a"))).toBeNull();
		expect(
			buildDraft("solo-cut", { ...emptyDraftFields("a"), value: "yellow" }),
		).toEqual({
			type: "solo-cut",
			actorId: "a",
			value: "yellow",
		});
	});

	it("returns null for a solo cut without an actor", () => {
		expect(
			buildDraft("solo-cut", { ...emptyDraftFields(""), value: 7 }),
		).toBeNull();
	});

	it("rejects yellow for a double detector (blue only)", () => {
		const f = {
			...emptyDraftFields("a"),
			targetId: "b",
			outcome: "success" as const,
		};
		expect(buildDraft("double-detector", { ...f, value: "yellow" })).toBeNull();
		expect(buildDraft("double-detector", { ...f, value: 4 })).toMatchObject({
			type: "double-detector",
			value: 4,
		});
	});

	it("requires target, value, and outcome for a double detector", () => {
		const base = emptyDraftFields("a");
		expect(buildDraft("double-detector", base)).toBeNull();
		expect(
			buildDraft("double-detector", { ...base, targetId: "b", value: 4 }),
		).toBeNull();
	});

	it("requires the revealed wire for a failed double detector", () => {
		const failing = {
			...emptyDraftFields("a"),
			targetId: "b",
			value: 4 as const,
			outcome: "fail" as const,
		};
		expect(buildDraft("double-detector", failing)).toBeNull();
		expect(buildDraft("double-detector", { ...failing, revealed: 8 })).toEqual({
			type: "double-detector",
			actorId: "a",
			targetId: "b",
			value: 4,
			outcome: "fail",
			revealed: 8,
		});
	});

	it("requires equipment text and trims the optional note", () => {
		expect(buildDraft("equipment", emptyDraftFields("a"))).toBeNull();
		expect(
			buildDraft("equipment", {
				...emptyDraftFields("a"),
				equipment: "Radar",
				note: "  ",
			}),
		).toEqual({ type: "equipment", actorId: "a", equipment: "Radar" });
	});

	it("keeps a trimmed non-empty note on equipment", () => {
		expect(
			buildDraft("equipment", {
				...emptyDraftFields("a"),
				equipment: "  Radar  ",
				note: "  jammed  ",
			}),
		).toEqual({
			type: "equipment",
			actorId: "a",
			equipment: "Radar",
			note: "jammed",
		});
	});

	it("returns null for equipment without an actor", () => {
		expect(
			buildDraft("equipment", { ...emptyDraftFields(""), equipment: "Radar" }),
		).toBeNull();
	});
});

describe("fieldsFromMove()", () => {
	it("seeds fields from a dual cut", () => {
		const move: DualCutMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "dual-cut",
			actorId: "a",
			targetId: "b",
			value: 5,
			outcome: "fail",
			revealed: 8,
		};
		expect(fieldsFromMove(move)).toMatchObject({
			actorId: "a",
			targetId: "b",
			value: 5,
			outcome: "fail",
			revealed: 8,
		});
	});

	it("defaults revealed to null when a dual cut has none", () => {
		const move: DualCutMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "dual-cut",
			actorId: "a",
			targetId: "b",
			value: 5,
			outcome: "success",
		};
		expect(fieldsFromMove(move).revealed).toBeNull();
	});

	it("seeds fields from a double detector", () => {
		const move: DoubleDetectorMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "double-detector",
			actorId: "a",
			targetId: "c",
			value: 4,
			outcome: "fail",
			revealed: "unknown",
		};
		expect(fieldsFromMove(move)).toMatchObject({
			actorId: "a",
			targetId: "c",
			value: 4,
			outcome: "fail",
			revealed: "unknown",
		});
	});

	it("defaults revealed to null when a double detector has none", () => {
		const move: DoubleDetectorMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "double-detector",
			actorId: "a",
			targetId: "c",
			value: 4,
			outcome: "success",
		};
		expect(fieldsFromMove(move).revealed).toBeNull();
	});

	it("seeds fields from a solo cut", () => {
		const move: SoloCutMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "solo-cut",
			actorId: "b",
			value: "yellow",
		};
		expect(fieldsFromMove(move)).toMatchObject({
			actorId: "b",
			value: "yellow",
		});
	});

	it("seeds equipment fields including the note", () => {
		const move: EquipmentMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "equipment",
			actorId: "c",
			equipment: "Toolbox",
			note: "used it",
		};
		expect(fieldsFromMove(move)).toMatchObject({
			actorId: "c",
			equipment: "Toolbox",
			note: "used it",
		});
	});

	it("defaults the note to an empty string when equipment has none", () => {
		const move: EquipmentMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "equipment",
			actorId: "c",
			equipment: "Radar",
		};
		expect(fieldsFromMove(move).note).toBe("");
	});
});
