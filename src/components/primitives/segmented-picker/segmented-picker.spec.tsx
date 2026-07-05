import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SelectOption } from "@/components/primitives/select-field/select-field";
import { SegmentedPicker } from "./segmented-picker";

const options: SelectOption[] = [
	{ value: "a", label: "Alice" },
	{ value: "b", label: "Bob" },
	{ value: "c", label: "Carol" },
];

afterEach(() => {
	vi.clearAllMocks();
});

describe("<SegmentedPicker>", () => {
	it("renders one control per option and labels the group", () => {
		render(
			<SegmentedPicker
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

	it("selecting an option reports its value", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<SegmentedPicker
				label="Actor"
				value=""
				onValueChange={onValueChange}
				options={options}
			/>,
		);

		await user.click(screen.getByRole("radio", { name: "Bob" }));

		expect(onValueChange).toHaveBeenCalledWith("b");
	});

	it("reflects the selected option as checked", () => {
		render(
			<SegmentedPicker
				label="Actor"
				value="c"
				onValueChange={vi.fn()}
				options={options}
			/>,
		);

		expect(screen.getByRole("radio", { name: "Carol" })).toBeChecked();
		expect(screen.getByRole("radio", { name: "Alice" })).not.toBeChecked();
	});

	it("ignores tapping the already-selected option (no clear)", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<SegmentedPicker
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

	describe("overflow menu", () => {
		const menuOptions: SelectOption[] = [{ value: "d", label: "Dave (self)" }];

		it("renders the ⋯ trigger only when menuOptions is non-empty", () => {
			const { rerender } = render(
				<SegmentedPicker
					label="Target"
					value=""
					onValueChange={vi.fn()}
					options={options}
				/>,
			);
			expect(
				screen.queryByRole("button", { name: "Other targets" }),
			).not.toBeInTheDocument();

			rerender(
				<SegmentedPicker
					label="Target"
					value=""
					onValueChange={vi.fn()}
					options={options}
					menuOptions={menuOptions}
					menuLabel="Other targets"
				/>,
			);
			expect(
				screen.getByRole("button", { name: "Other targets" }),
			).toBeInTheDocument();
		});

		it("does not render menu options as top-level segmented radios", () => {
			render(
				<SegmentedPicker
					label="Target"
					value=""
					onValueChange={vi.fn()}
					options={options}
					menuOptions={menuOptions}
					menuLabel="Other targets"
				/>,
			);

			expect(
				screen.queryByRole("radio", { name: "Dave (self)" }),
			).not.toBeInTheDocument();
		});

		it("opening the menu and choosing an item reports that option's id", async () => {
			const user = userEvent.setup();
			const onValueChange = vi.fn();
			render(
				<SegmentedPicker
					label="Target"
					value=""
					onValueChange={onValueChange}
					options={options}
					menuOptions={menuOptions}
					menuLabel="Other targets"
				/>,
			);

			await user.click(screen.getByRole("button", { name: "Other targets" }));
			await user.click(
				screen.getByRole("menuitemradio", { name: "Dave (self)" }),
			);

			expect(onValueChange).toHaveBeenCalledWith("d");
		});

		it("marks the ⋯ trigger active when the selection lives in the menu", () => {
			render(
				<SegmentedPicker
					label="Target"
					value="d"
					onValueChange={vi.fn()}
					options={options}
					menuOptions={menuOptions}
					menuLabel="Other targets"
				/>,
			);

			expect(
				screen.getByRole("button", { name: "Other targets" }),
			).toHaveAttribute("data-active", "on");
		});

		it("leaves the ⋯ trigger inactive when a segmented option is selected", () => {
			render(
				<SegmentedPicker
					label="Target"
					value="a"
					onValueChange={vi.fn()}
					options={options}
					menuOptions={menuOptions}
					menuLabel="Other targets"
				/>,
			);

			expect(
				screen.getByRole("button", { name: "Other targets" }),
			).not.toHaveAttribute("data-active");
		});
	});

	describe("multi-select mode", () => {
		it("labels the group and reports an option toggled on", async () => {
			const user = userEvent.setup();
			const onValuesChange = vi.fn();
			render(
				<SegmentedPicker
					label="Holders"
					multiple
					values={["a"]}
					onValuesChange={onValuesChange}
					options={options}
				/>,
			);

			// the multi root exposes Radix's toolbar role with the field's label.
			expect(
				screen.getByRole("toolbar", { name: "Holders" }),
			).toBeInTheDocument();
			await user.click(screen.getByRole("button", { name: "Bob" }));
			expect(onValuesChange).toHaveBeenCalledWith(["a", "b"]);
		});

		it("reflects the selected subset as pressed", () => {
			render(
				<SegmentedPicker
					label="Holders"
					multiple
					values={["a", "c"]}
					onValuesChange={vi.fn()}
					options={options}
				/>,
			);

			expect(screen.getByRole("button", { name: "Alice" })).toHaveAttribute(
				"aria-pressed",
				"true",
			);
			expect(screen.getByRole("button", { name: "Bob" })).toHaveAttribute(
				"aria-pressed",
				"false",
			);
		});

		it("toggling a pressed option off reports the remaining subset", async () => {
			const user = userEvent.setup();
			const onValuesChange = vi.fn();
			render(
				<SegmentedPicker
					label="Holders"
					multiple
					values={["a", "b"]}
					onValuesChange={onValuesChange}
					options={options}
				/>,
			);

			// unlike single mode, deselecting is legal: an empty subset is valid.
			await user.click(screen.getByRole("button", { name: "Alice" }));
			expect(onValuesChange).toHaveBeenCalledWith(["b"]);
		});
	});
});
