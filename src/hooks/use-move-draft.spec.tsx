import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emptyDraftFields } from "@/lib/move-draft";
import { useMoveDraft } from "./use-move-draft";

describe("useMoveDraft()", () => {
	it("starts with the initial type and fields, unflagged", () => {
		const { result } = renderHook(() =>
			useMoveDraft("dual-cut", () => emptyDraftFields("p1")),
		);
		expect(result.current.type).toBe("dual-cut");
		expect(result.current.fields.actorId).toBe("p1");
		expect(result.current.nudge).toBe(0);
		expect(result.current.invalid.size).toBe(0);
	});

	it("builds no draft while the fields are incomplete", () => {
		const { result } = renderHook(() =>
			useMoveDraft("dual-cut", () => emptyDraftFields("p1")),
		);
		expect(result.current.draft).toBeNull();
	});

	it("builds the draft once the fields are complete", () => {
		const { result } = renderHook(() =>
			useMoveDraft("dual-cut", () => emptyDraftFields("p1")),
		);
		act(() => {
			result.current.setFields({
				...result.current.fields,
				targetId: "p2",
				value: 4,
				outcome: "success",
			});
		});
		expect(result.current.draft).toMatchObject({
			type: "dual-cut",
			actorId: "p1",
			targetId: "p2",
			value: 4,
		});
	});

	it("flags the missing fields only after a failed press, counting attempts", () => {
		const { result } = renderHook(() =>
			useMoveDraft("dual-cut", () => emptyDraftFields("p1")),
		);

		let flagged: ReturnType<typeof result.current.flagInvalid> | undefined;
		act(() => {
			flagged = result.current.flagInvalid();
		});
		expect(flagged?.attempt).toBe(1);
		expect(flagged?.missing).toContain("target");
		expect(result.current.nudge).toBe(1);
		expect(result.current.invalid.has("target")).toBe(true);

		act(() => {
			flagged = result.current.flagInvalid();
		});
		expect(flagged?.attempt).toBe(2);
		expect(result.current.nudge).toBe(2);
	});

	it("recomputes the invalid set live so each fix clears its own flag", () => {
		const { result } = renderHook(() =>
			useMoveDraft("dual-cut", () => emptyDraftFields("p1")),
		);
		act(() => {
			result.current.flagInvalid();
		});
		expect(result.current.invalid.has("target")).toBe(true);
		act(() => {
			result.current.setFields({ ...result.current.fields, targetId: "p2" });
		});
		expect(result.current.invalid.has("target")).toBe(false);
	});

	it("clears the flagging state when the type changes", () => {
		const { result } = renderHook(() =>
			useMoveDraft("dual-cut", () => emptyDraftFields("p1")),
		);
		act(() => {
			result.current.flagInvalid();
		});
		act(() => {
			result.current.changeType("solo-cut");
		});
		expect(result.current.type).toBe("solo-cut");
		expect(result.current.nudge).toBe(0);
		expect(result.current.invalid.size).toBe(0);
	});

	it("resets fields, type, and flags for the next entry", () => {
		const { result } = renderHook(() =>
			useMoveDraft("solo-cut", () => emptyDraftFields("p1")),
		);
		act(() => {
			result.current.flagInvalid();
		});
		act(() => {
			result.current.reset(emptyDraftFields("p2"), "dual-cut");
		});
		expect(result.current.type).toBe("dual-cut");
		expect(result.current.fields.actorId).toBe("p2");
		expect(result.current.nudge).toBe(0);
		expect(result.current.invalid.size).toBe(0);
	});
});
