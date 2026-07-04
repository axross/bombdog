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

	it("stays unmarked and paints no overlay while valid", () => {
		render(
			<FieldHighlight invalid={false} nudge={0} data-testid="wrap">
				<button type="button">Target</button>
			</FieldHighlight>,
		);
		const wrap = screen.getByTestId("wrap");
		expect(wrap).not.toHaveAttribute("data-invalid");
		// the decorative pulse overlay is only present when invalid.
		expect(wrap.querySelector("[aria-hidden]")).toBeNull();
	});

	it("marks the field and paints a decorative overlay when invalid", () => {
		render(
			<FieldHighlight invalid={true} nudge={1} data-testid="wrap">
				<button type="button">Target</button>
			</FieldHighlight>,
		);
		const wrap = screen.getByTestId("wrap");
		expect(wrap).toHaveAttribute("data-invalid");
		const overlay = wrap.querySelector("[aria-hidden]");
		expect(overlay).not.toBeNull();
		// decorative only: it must not carry a role or accessible text.
		expect(overlay).toBeEmptyDOMElement();
	});

	it("keeps exactly one overlay as the nudge counter advances", () => {
		const { rerender } = render(
			<FieldHighlight invalid={true} nudge={1} data-testid="wrap">
				<button type="button">Target</button>
			</FieldHighlight>,
		);
		rerender(
			<FieldHighlight invalid={true} nudge={2} data-testid="wrap">
				<button type="button">Target</button>
			</FieldHighlight>,
		);
		expect(
			screen.getByTestId("wrap").querySelectorAll("[aria-hidden]"),
		).toHaveLength(1);
	});
});
