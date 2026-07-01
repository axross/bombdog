import { describe, expect, it } from "vitest";
import type { DualCutMove, EquipmentMove } from "@/lib/types";
import { buildDraft, emptyDraftFields, fieldsFromMove } from "./draft";

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
		};
		expect(fieldsFromMove(move)).toMatchObject({
			actorId: "a",
			targetId: "b",
			value: 5,
			outcome: "fail",
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
});
