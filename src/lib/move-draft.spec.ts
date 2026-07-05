import { describe, expect, it } from "vitest";
import {
	type BlueWireValue,
	type DetectorMove,
	type DualCutMove,
	type EquipmentMove,
	GENERAL_RADAR_EQUIPMENT,
	type MoveType,
	POST_IT_EQUIPMENT,
	type SoloCutMove,
} from "@/lib/types";
import {
	buildDraft,
	detectorValues,
	emptyDraftFields,
	fieldsFromMove,
	invalidFields,
} from "@/lib/move-draft";

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
			cutValue: null,
			equipment: "",
			holderIds: [],
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
			// a successful ray also needs its cut value; set it so the value-count
			// rule is the only thing under test here.
			cutValue: 9 as const,
		};
		// one value is not enough for a two-value ray.
		expect(buildDraft("detector", { ...base, values: [4] })).toBeNull();
		// a repeated value is not two distinct wires.
		expect(buildDraft("detector", { ...base, values: [4, 4] })).toBeNull();
		expect(buildDraft("detector", { ...base, values: [4, 9] })).toMatchObject({
			type: "detector",
			detector: "x-or-y-ray",
			values: [4, 9],
		});
	});

	it("requires the actual cut value for a successful X or Y Ray", () => {
		const base = {
			...emptyDraftFields("a"),
			detector: "x-or-y-ray" as const,
			targetId: "b",
			values: [4, 9] as BlueWireValue[],
			outcome: "success" as const,
		};
		// success is ambiguous across the two names until the cut value is recorded.
		expect(buildDraft("detector", base)).toBeNull();
		expect(buildDraft("detector", { ...base, cutValue: 9 })).toMatchObject({
			type: "detector",
			detector: "x-or-y-ray",
			values: [4, 9],
			outcome: "success",
			cutValue: 9,
		});
	});

	it("omits the cut value for a non-ray detector and on failure", () => {
		// a single-value detector never needs disambiguation, even with a stray
		// cutValue in the fields.
		expect(
			buildDraft("detector", {
				...emptyDraftFields("a"),
				detector: "triple",
				targetId: "b",
				values: [4],
				outcome: "success",
				cutValue: 9,
			}),
		).not.toHaveProperty("cutValue");
		// a failed ray records `revealed`, not `cutValue`.
		expect(
			buildDraft("detector", {
				...emptyDraftFields("a"),
				detector: "x-or-y-ray",
				targetId: "b",
				values: [4, 9],
				outcome: "fail",
				revealed: 8,
				cutValue: 9,
			}),
		).not.toHaveProperty("cutValue");
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

	describe("when the equipment is the Post-it", () => {
		const base = { ...emptyDraftFields("a"), equipment: POST_IT_EQUIPMENT };

		it("requires both the target and the revealed wire", () => {
			expect(buildDraft("equipment", base)).toBeNull();
			expect(buildDraft("equipment", { ...base, targetId: "b" })).toBeNull();
			expect(buildDraft("equipment", { ...base, value: 7 })).toBeNull();
			expect(
				buildDraft("equipment", { ...base, targetId: "b", value: 7 }),
			).toEqual({
				type: "equipment",
				actorId: "a",
				equipment: POST_IT_EQUIPMENT,
				targetId: "b",
				value: 7,
			});
		});

		it("rejects a non-blue wire value", () => {
			// the pad is blue-only, but the shared field can carry a leftover pick
			// from another tab; the card deals in numbered wires only.
			expect(
				buildDraft("equipment", { ...base, targetId: "b", value: "yellow" }),
			).toBeNull();
		});

		it("keeps the optional note alongside the structured fields", () => {
			expect(
				buildDraft("equipment", {
					...base,
					targetId: "b",
					value: 7,
					note: "  own wire  ",
				}),
			).toMatchObject({ targetId: "b", value: 7, note: "own wire" });
		});
	});

	describe("when the equipment is the General Radar", () => {
		const base = {
			...emptyDraftFields("a"),
			equipment: GENERAL_RADAR_EQUIPMENT,
		};

		it("requires the announced value", () => {
			expect(buildDraft("equipment", base)).toBeNull();
			expect(buildDraft("equipment", { ...base, value: "unknown" })).toBeNull();
		});

		it("allows zero holders — the radar can find no one", () => {
			expect(buildDraft("equipment", { ...base, value: 4 })).toEqual({
				type: "equipment",
				actorId: "a",
				equipment: GENERAL_RADAR_EQUIPMENT,
				value: 4,
				holderIds: [],
			});
		});

		it("keeps every selected holder", () => {
			expect(
				buildDraft("equipment", { ...base, value: 4, holderIds: ["b", "c"] }),
			).toMatchObject({ value: 4, holderIds: ["b", "c"] });
		});
	});
});

describe("invalidFields()", () => {
	it("flags actor, target, wire, and result for an empty dual cut", () => {
		expect(invalidFields("dual-cut", emptyDraftFields(""))).toEqual([
			"actor",
			"target",
			"wire",
			"outcome",
		]);
	});

	it("flags the result when a dual cut fails without a revealed wire", () => {
		const failing = {
			...emptyDraftFields("a"),
			targetId: "b",
			value: 9 as const,
			outcome: "fail" as const,
		};
		expect(invalidFields("dual-cut", failing)).toEqual(["outcome"]);
		expect(invalidFields("dual-cut", { ...failing, revealed: 8 })).toEqual([]);
	});

	it("flags actor and wire for a solo cut", () => {
		expect(invalidFields("solo-cut", emptyDraftFields(""))).toEqual([
			"actor",
			"wire",
		]);
		expect(
			invalidFields("solo-cut", { ...emptyDraftFields("a"), value: 7 }),
		).toEqual([]);
	});

	it("flags the value pad until a detector names the right count", () => {
		const base = { ...emptyDraftFields("a"), targetId: "b" };
		// the X or Y Ray needs two distinct values.
		const xy = { ...base, detector: "x-or-y-ray" as const };
		expect(invalidFields("detector", xy)).toEqual(["values", "outcome"]);
		expect(invalidFields("detector", { ...xy, values: [4] })).toEqual([
			"values",
			"outcome",
		]);
		expect(
			invalidFields("detector", { ...xy, values: [4, 9], outcome: "success" }),
		).toEqual(["cutValue"]);
	});

	it("flags the actual value only for a successful X or Y Ray", () => {
		const ray = {
			...emptyDraftFields("a"),
			targetId: "b",
			detector: "x-or-y-ray" as const,
			values: [4, 9] as BlueWireValue[],
		};
		expect(invalidFields("detector", { ...ray, outcome: "success" })).toEqual([
			"cutValue",
		]);
		expect(
			invalidFields("detector", { ...ray, outcome: "success", cutValue: 9 }),
		).toEqual([]);
		// a fail needs its revealed wire, not a cut value.
		expect(invalidFields("detector", { ...ray, outcome: "fail" })).toEqual([
			"outcome",
		]);
	});

	it("flags actor and equipment for a Misc action", () => {
		expect(invalidFields("equipment", emptyDraftFields(""))).toEqual([
			"actor",
			"equipment",
		]);
		expect(
			invalidFields("equipment", {
				...emptyDraftFields("a"),
				equipment: "  ",
			}),
		).toEqual(["equipment"]);
	});

	it("flags the Post-it's target and wire until both are chosen", () => {
		const postIt = { ...emptyDraftFields("a"), equipment: POST_IT_EQUIPMENT };
		expect(invalidFields("equipment", postIt)).toEqual(["target", "wire"]);
		expect(invalidFields("equipment", { ...postIt, targetId: "b" })).toEqual([
			"wire",
		]);
		expect(
			invalidFields("equipment", { ...postIt, targetId: "b", value: 7 }),
		).toEqual([]);
	});

	it("flags the General Radar's value but never its holders", () => {
		const radar = {
			...emptyDraftFields("a"),
			equipment: GENERAL_RADAR_EQUIPMENT,
		};
		expect(invalidFields("equipment", radar)).toEqual(["wire"]);
		// zero holders is a valid selection, so a chosen value clears the flags.
		expect(invalidFields("equipment", { ...radar, value: 4 })).toEqual([]);
	});

	it("agrees with buildDraft: empty iff a draft can be built", () => {
		// the two encode the same rules independently; this pins the invariant so a
		// change to one that forgets the other is caught.
		const types: MoveType[] = ["dual-cut", "solo-cut", "detector", "equipment"];
		const fixtures = [
			emptyDraftFields(""),
			emptyDraftFields("a"),
			{ ...emptyDraftFields("a"), targetId: "b", value: 9 as const },
			{
				...emptyDraftFields("a"),
				targetId: "b",
				value: 9 as const,
				outcome: "success" as const,
			},
			{
				...emptyDraftFields("a"),
				targetId: "b",
				outcome: "fail" as const,
				revealed: 8 as const,
			},
			{
				...emptyDraftFields("a"),
				detector: "x-or-y-ray" as const,
				targetId: "b",
				values: [4, 9] as BlueWireValue[],
				outcome: "success" as const,
			},
			{
				...emptyDraftFields("a"),
				detector: "x-or-y-ray" as const,
				targetId: "b",
				values: [4, 9] as BlueWireValue[],
				outcome: "success" as const,
				cutValue: 9 as const,
			},
			{ ...emptyDraftFields("a"), value: 7 as const },
			{ ...emptyDraftFields("a"), equipment: "Radar" },
			// the structured cards, in partial and complete states.
			{ ...emptyDraftFields("a"), equipment: POST_IT_EQUIPMENT },
			{
				...emptyDraftFields("a"),
				equipment: POST_IT_EQUIPMENT,
				targetId: "b",
				value: 7 as const,
			},
			{ ...emptyDraftFields("a"), equipment: GENERAL_RADAR_EQUIPMENT },
			{
				...emptyDraftFields("a"),
				equipment: GENERAL_RADAR_EQUIPMENT,
				value: 4 as const,
				holderIds: ["b", "c"],
			},
		];
		for (const type of types) {
			for (const f of fixtures) {
				const empty = invalidFields(type, f).length === 0;
				const built = buildDraft(type, f) !== null;
				expect(empty, `${type} ${JSON.stringify(f)}`).toBe(built);
			}
		}
	});
});

describe("detectorValues()", () => {
	it("keeps the most recent value for one-value detectors", () => {
		// downgrading to a one-value card drops the oldest pick, matching the pad.
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

	it("seeds the cut value from a successful X or Y Ray", () => {
		const move: DetectorMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "detector",
			detector: "x-or-y-ray",
			actorId: "a",
			targetId: "c",
			values: [4, 9],
			outcome: "success",
			cutValue: 9,
		};
		expect(fieldsFromMove(move).cutValue).toBe(9);
	});

	it("defaults the cut value to null when a detector has none", () => {
		const move: DetectorMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "detector",
			detector: "double",
			actorId: "a",
			targetId: "c",
			values: [4],
			outcome: "success",
		};
		expect(fieldsFromMove(move).cutValue).toBeNull();
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

	it("seeds the Post-it's target and wire", () => {
		const move: EquipmentMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "equipment",
			actorId: "c",
			equipment: POST_IT_EQUIPMENT,
			targetId: "b",
			value: 7,
		};
		expect(fieldsFromMove(move)).toMatchObject({
			equipment: POST_IT_EQUIPMENT,
			targetId: "b",
			value: 7,
		});
	});

	it("seeds the General Radar's value and holders", () => {
		const move: EquipmentMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "equipment",
			actorId: "c",
			equipment: GENERAL_RADAR_EQUIPMENT,
			value: 4,
			holderIds: ["a", "b"],
		};
		expect(fieldsFromMove(move)).toMatchObject({
			equipment: GENERAL_RADAR_EQUIPMENT,
			value: 4,
			holderIds: ["a", "b"],
		});
	});

	it("defaults the structured fields when equipment has none (legacy log)", () => {
		const move: EquipmentMove = {
			id: "1",
			seq: 1,
			at: 0,
			type: "equipment",
			actorId: "c",
			equipment: POST_IT_EQUIPMENT,
		};
		expect(fieldsFromMove(move)).toMatchObject({
			targetId: "",
			value: null,
			holderIds: [],
		});
	});
});
