import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WireChip } from "./wire-chip";

describe("<WireChip>", () => {
	it("shows a blue value's number with its accessible name", () => {
		render(<WireChip value={9} />);
		const chip = screen.getByRole("img", { name: "Wire 9" });
		expect(chip).toHaveTextContent("9");
	});

	it("shows the yellow wire as Y", () => {
		render(<WireChip value="yellow" />);
		const chip = screen.getByRole("img", { name: "Yellow wire" });
		expect(chip).toHaveTextContent("Y");
	});

	it("shows an unknown value as ?", () => {
		render(<WireChip value="unknown" />);
		const chip = screen.getByRole("img", { name: "Unknown wire" });
		expect(chip).toHaveTextContent("?");
	});
});
