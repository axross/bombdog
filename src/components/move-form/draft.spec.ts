import { describe, expect, it } from "vitest";
import type {
	BlueWireValue,
	DetectorMove,
	DualCutMove,
	EquipmentMove,
	SoloCutMove,
} from "@/lib/types";
import {
	buildDraft,
	detectorValues,
	emptyDraftFields,
	fieldsFromMove,
} from "./draft";

describe("emptyDraftFields()", () => {
	it("returns an all-empty shape with the given actor", () => {
		expect(emptyDraftFields("a")).toEqual({
			actorId: "a",
			targetId: "",
			value: null,
			detector: "double",
			values: [],
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

	it('accepts the unknown ("?") wire value for a dual cut', () => {
		expect(
			buildDraft("dual-cut", {
				...emptyDraftFields("a"),
				targetId: "b",
				value: "unknown",
				outcome: "success",
			}),
		).toMatchObject({ type: "dual-cut", value: "unknown", outcome: "success" });
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

	it('accepts the unknown ("?") wire value for a solo cut', () => {
		expect(
			buildDraft("solo-cut", {
				...emptyDraftFields("a"),
				value: "unknown",
			}),
		).toEqual({ type: "solo-cut", actorId: "a", value: "unknown" });
	});

	it("returns null for a solo cut without an actor", () => {
		expect(
			buildDraft("solo-cut", { ...emptyDraftFields(""), value: 7 }),
		).toBeNull();
	});

	it("builds a detector draft from a blue value", () => {
		// `values` is typed BlueWireValue[], so yellow can't be constructed here —
		// the blue-only rule is a compile-time guarantee, not a runtime check.
		const f = {
			...emptyDraftFields("a"),
			targetId: "b",
			outcome: "success" as const,
		};
		expect(buildDraft("detector", { ...f, values: [4] })).toMatchObject({
			type: "detector",
			detector: "double",
			values: [4],
		});
	});

	it('accepts an unknown ("?") named value for a detector', () => {
		expect(
			buildDraft("detector", {
				...emptyDraftFields("a"),
				targetId: "b",
				values: ["unknown"],
				outcome: "success",
			}),
		).toMatchObject({
			type: "detector",
			detector: "double",
			values: ["unknown"],
		});
	});

	it("requires target, values, and outcome for a detector", () => {
		const base = emptyDraftFields("a");
		expect(buildDraft("detector", base)).toBeNull();
		expect(
			buildDraft("detector", { ...base, targetId: "b", values: [4] }),
		).toBeNull();
	});

	it("requires the revealed wire for a failed detector", () => {
		const failing = {
			...emptyDraftFields("a"),
			targetId: "b",
			values: [4] as BlueWireValue[],
			outcome: "fail" as const,
		};
		expect(buildDraft("detector", failing)).toBeNull();
		expect(buildDraft("detector", { ...failing, revealed: 8 })).toEqual({
			type: "detector",
			detector: "double",
			actorId: "a",
			targetId: "b",
			values: [4],
			outcome: "fail",
			revealed: 8,
		});
	});

	it("requires exactly two distinct values for the X or Y Ray", () => {
		const base = {
			...emptyDraftFields("a"),
			detector: "x-or-y-ray" as const,
			targetId: "b",
			outcome: "success" as const,
		};
		// One value is not enough for a two-value ray.
		expect(buildDraft("detector", { ...base, values: [4] })).toBeNull();
		// A repeated value is not two distinct wires.
		expect(buildDraft("detector", { ...base, values: [4, 4] })).toBeNull();
		expect(buildDraft("detector", { ...base, values: [4, 9] })).toMatchObject({
			type: "detector",
			detector: "x-or-y-ray",
			values: [4, 9],
		});
	});

	it("rejects a second value for a single-value detector", () => {
		const base = {
			...emptyDraftFields("a"),
			detector: "triple" as const,
			targetId: "b",
			outcome: "success" as const,
		};
		expect(buildDraft("detector", { ...base, values: [4, 9] })).toBeNull();
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

describe("detectorValues()", () => {
	it("keeps the most recent value for one-value detectors", () => {
		// Downgrading to a one-value card drops the oldest pick, matching the pad.
		expect(detectorValues([4, 9], "triple")).toEqual([9]);
		expect(detectorValues([4, 9], "super")).toEqual([9]);
	});

	it("keeps up to two values for the X or Y Ray", () => {
		expect(detectorValues([4, 9], "x-or-y-ray")).toEqual([4, 9]);
		expect(detectorValues([4], "x-or-y-ray")).toEqual([4]);
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

	it("seeds fields from a detector", () => {
		const move: DetectorMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "detector",
			detector: "x-or-y-ray",
			actorId: "a",
			targetId: "c",
			values: [4, 9],
			outcome: "fail",
			revealed: "unknown",
		};
		expect(fieldsFromMove(move)).toMatchObject({
			actorId: "a",
			detector: "x-or-y-ray",
			targetId: "c",
			values: [4, 9],
			outcome: "fail",
			revealed: "unknown",
		});
	});

	it("defaults revealed to null when a detector has none", () => {
		const move: DetectorMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "detector",
			detector: "triple",
			actorId: "a",
			targetId: "c",
			values: [4],
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

	it('seeds an unknown ("?") cut value so the editor reflects it', () => {
		const move: SoloCutMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "solo-cut",
			actorId: "b",
			value: "unknown",
		};
		expect(fieldsFromMove(move).value).toBe("unknown");
	});

	it('seeds unknown ("?") detector values so the editor reflects them', () => {
		const move: DetectorMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "detector",
			detector: "double",
			actorId: "a",
			targetId: "c",
			values: ["unknown"],
			outcome: "success",
		};
		expect(fieldsFromMove(move).values).toEqual(["unknown"]);
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
