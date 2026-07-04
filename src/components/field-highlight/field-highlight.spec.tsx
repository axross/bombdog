import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldHighlight } from "./field-highlight";

describe("<FieldHighlight>", () => {
	it("renders its child field", () => {
		render(
			<FieldHighlight invalid={false} nudge={0}>
				<button type="button">Target</button>
			</FieldHighlight>,
		);
		expect(screen.getByRole("button", { name: "Target" })).toBeInTheDocument();
	});

	it("stays unmarked while valid", () => {
		render(
			<FieldHighlight invalid={false} nudge={0} data-testid="wrap">
				<button type="button">Target</button>
			</FieldHighlight>,
		);
		expect(screen.getByTestId("wrap")).not.toHaveAttribute("data-invalid");
	});

	it("marks the field when invalid", () => {
		render(
			<FieldHighlight invalid={true} nudge={1} data-testid="wrap">
				<button type="button">Target</button>
			</FieldHighlight>,
		);
		expect(screen.getByTestId("wrap")).toHaveAttribute("data-invalid");
	});

	it("keeps the same child instance as the nudge counter advances", () => {
		// the shake replays via a reflow, not by remounting — so a repeat press
		// must not tear down the field's interactive children.
		const { rerender } = render(
			<FieldHighlight invalid={true} nudge={1} data-testid="wrap">
				<button type="button">Target</button>
			</FieldHighlight>,
		);
		const button = screen.getByRole("button", { name: "Target" });
		rerender(
			<FieldHighlight invalid={true} nudge={2} data-testid="wrap">
				<button type="button">Target</button>
			</FieldHighlight>,
		);
		// same DOM node — not replaced by a remount.
		expect(screen.getByRole("button", { name: "Target" })).toBe(button);
		expect(screen.getByTestId("wrap")).toHaveAttribute("data-invalid");
	});
});
