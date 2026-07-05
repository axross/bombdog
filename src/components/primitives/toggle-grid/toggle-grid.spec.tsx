import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToggleGrid, type ToggleGridOption } from "./toggle-grid";

const options: ToggleGridOption[] = [
	{ value: "1", label: "1", ariaLabel: "One" },
	{ value: "2", label: "2", ariaLabel: "Two" },
	{ value: "3", label: "3", ariaLabel: "Three" },
];

describe("<ToggleGrid>", () => {
	it("renders a labelled grid with one cell per option", () => {
		render(
			<ToggleGrid
				label="Value"
				options={options}
				value={null}
				onValueChange={vi.fn()}
			/>,
		);
		expect(screen.getByText("Value")).toBeInTheDocument();
		expect(
			screen.getByRole("radiogroup", { name: "Value" }),
		).toBeInTheDocument();
		expect(screen.getByRole("radio", { name: "Two" })).toBeInTheDocument();
	});

	it("reports a chosen cell's value", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<ToggleGrid
				label="Value"
				options={options}
				value={null}
				onValueChange={onValueChange}
			/>,
		);
		await user.click(screen.getByRole("radio", { name: "Three" }));
		expect(onValueChange).toHaveBeenCalledWith("3");
	});

	it("re-commits the active value on a repeat tap instead of clearing", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<ToggleGrid
				label="Value"
				options={options}
				value="2"
				onValueChange={onValueChange}
			/>,
		);
		await user.click(screen.getByRole("radio", { name: "Two" }));
		expect(onValueChange).toHaveBeenCalledWith("2");
	});

	it("caps a multi selection at max, dropping the oldest pick", async () => {
		const user = userEvent.setup();
		const onValuesChange = vi.fn();
		render(
			<ToggleGrid
				label="Values"
				options={options}
				multiple
				max={2}
				values={["1", "2"]}
				onValuesChange={onValuesChange}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Three" }));
		expect(onValuesChange).toHaveBeenCalledWith(["2", "3"]);
	});
});
