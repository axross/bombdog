import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SelectOption } from "@/components/select-field/select-field";
import { PlayerPicker } from "./player-picker";

const options: SelectOption[] = [
	{ value: "a", label: "Alice" },
	{ value: "b", label: "Bob" },
	{ value: "c", label: "Carol" },
];

afterEach(() => {
	vi.clearAllMocks();
});

describe("<PlayerPicker>", () => {
	it("renders one option per player and labels the group", () => {
		render(
			<PlayerPicker
				label="Actor"
				value=""
				onValueChange={vi.fn()}
				options={options}
			/>,
		);

		expect(screen.getByText("Actor")).toBeInTheDocument();
		expect(
			screen.getByRole("radiogroup", { name: "Actor" }),
		).toBeInTheDocument();
		for (const option of options) {
			expect(
				screen.getByRole("radio", { name: option.label }),
			).toBeInTheDocument();
		}
	});

	it("selecting an option reports that player's id", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<PlayerPicker
				label="Actor"
				value=""
				onValueChange={onValueChange}
				options={options}
			/>,
		);

		await user.click(screen.getByRole("radio", { name: "Bob" }));

		expect(onValueChange).toHaveBeenCalledWith("b");
	});

	it("reflects the selected player as checked", () => {
		render(
			<PlayerPicker
				label="Actor"
				value="c"
				onValueChange={vi.fn()}
				options={options}
			/>,
		);

		expect(screen.getByRole("radio", { name: "Carol" })).toBeChecked();
		expect(screen.getByRole("radio", { name: "Alice" })).not.toBeChecked();
	});

	it("ignores tapping the already-selected player (no clear)", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<PlayerPicker
				label="Actor"
				value="a"
				onValueChange={onValueChange}
				options={options}
			/>,
		);

		await user.click(screen.getByRole("radio", { name: "Alice" }));

		// Radix emits the empty value on deselect; the guard drops it.
		expect(onValueChange).not.toHaveBeenCalled();
	});
});
