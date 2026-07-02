import { describe, expect, it } from "vitest";
import { DETECTOR_OPTIONS, type DetectorKind, detectorOption } from "./types";

describe("detectorOption()", () => {
	it("returns the matching option for every detector kind", () => {
		for (const option of DETECTOR_OPTIONS) {
			expect(detectorOption(option.kind)).toBe(option);
		}
	});

	it("throws for an unknown kind rather than substituting a default", () => {
		// only reachable via corrupt persisted data or a kind added to the union
		// without a matching option; a cast simulates that invalid input.
		expect(() => detectorOption("laser" as DetectorKind)).toThrow(
			/Unknown detector kind: laser/,
		);
	});
});
