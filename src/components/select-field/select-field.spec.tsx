import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SelectField, type SelectOption } from "./select-field";

const options: SelectOption[] = [
	{ value: "a", label: "Alice" },
	{ value: "b", label: "Bob" },
];

afterEach(() => {
	vi.clearAllMocks();
});

describe("<SelectField>", () => {
	it("renders a visible label by default", () => {
		render(
			<SelectField
				label="Target"
				value=""
				onValueChange={vi.fn()}
				options={options}
			/>,
		);

		expect(screen.getByText("Target")).toBeInTheDocument();
		// The trigger is still labelled via aria-label for assistive tech.
		expect(
			screen.getByRole("combobox", { name: "Target" }),
		).toBeInTheDocument();
	});

	it("keeps the label screen-reader only when hideLabel is set", () => {
		render(
			<SelectField
				label="Target"
				value=""
				onValueChange={vi.fn()}
				options={options}
				hideLabel
			/>,
		);

		// The accessible name still resolves through the trigger's aria-label.
		expect(screen.getByLabelText("Target")).toBeInTheDocument();
		expect(
			screen.getByRole("combobox", { name: "Target" }),
		).toBeInTheDocument();
	});

	it("shows the placeholder when the value is empty", () => {
		render(
			<SelectField
				label="Target"
				value=""
				onValueChange={vi.fn()}
				options={options}
				placeholder="Pick a player"
			/>,
		);

		expect(screen.getByText("Pick a player")).toBeInTheDocument();
	});

	it("shows the selected option's label when a value is set", () => {
		render(
			<SelectField
				label="Target"
				value="b"
				onValueChange={vi.fn()}
				options={options}
			/>,
		);

		expect(screen.getByText("Bob")).toBeInTheDocument();
	});
});
