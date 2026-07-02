import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WirePad } from "./wire-pad";

afterEach(() => {
	vi.clearAllMocks();
});

describe("<WirePad>", () => {
	it("renders wires 1–12 and Yellow by default", () => {
		render(<WirePad value={null} onValueChange={vi.fn()} />);

		for (let n = 1; n <= 12; n++) {
			expect(
				screen.getByRole("radio", { name: `Wire ${n}` }),
			).toBeInTheDocument();
		}
		expect(
			screen.getByRole("radio", { name: "Yellow wire" }),
		).toBeInTheDocument();
	});

	it("selecting a blue wire reports its numeric value", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(<WirePad value={null} onValueChange={onValueChange} />);

		await user.click(screen.getByRole("radio", { name: "Wire 8" }));

		expect(onValueChange).toHaveBeenCalledWith(8);
	});

	it('selecting Yellow reports the "yellow" value', async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(<WirePad value={null} onValueChange={onValueChange} />);

		await user.click(screen.getByRole("radio", { name: "Yellow wire" }));

		expect(onValueChange).toHaveBeenCalledWith("yellow");
	});

	it("reflects the selected blue value as checked", () => {
		render(<WirePad value={8} onValueChange={vi.fn()} />);

		expect(screen.getByRole("radio", { name: "Wire 8" })).toBeChecked();
		expect(screen.getByRole("radio", { name: "Wire 1" })).not.toBeChecked();
	});

	it("reflects the selected Yellow value as checked", () => {
		render(<WirePad value="yellow" onValueChange={vi.fn()} />);

		expect(screen.getByRole("radio", { name: "Yellow wire" })).toBeChecked();
	});

	it("ignores deselecting the current wire (no empty-value change)", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(<WirePad value={8} onValueChange={onValueChange} />);

		// Radix single-toggle emits "" when the active item is toggled off; the
		// guard drops it so a chosen wire cannot be cleared to null.
		await user.click(screen.getByRole("radio", { name: "Wire 8" }));

		expect(onValueChange).not.toHaveBeenCalled();
	});

	it("hides the Yellow option in blue-only mode", () => {
		render(<WirePad value={null} onValueChange={vi.fn()} blueOnly />);

		expect(screen.getByRole("radio", { name: "Wire 1" })).toBeInTheDocument();
		expect(
			screen.queryByRole("radio", { name: "Yellow wire" }),
		).not.toBeInTheDocument();
	});

	it('omits the "?" option unless allowUnknown is set', () => {
		render(<WirePad value={null} onValueChange={vi.fn()} />);

		expect(
			screen.queryByRole("radio", { name: "Unknown wire" }),
		).not.toBeInTheDocument();
	});

	it('renders the "?" option when allowUnknown is set', () => {
		render(<WirePad value={null} onValueChange={vi.fn()} allowUnknown />);

		expect(
			screen.getByRole("radio", { name: "Unknown wire" }),
		).toBeInTheDocument();
	});

	it('selecting "?" reports the "unknown" value', async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(<WirePad value={null} onValueChange={onValueChange} allowUnknown />);

		await user.click(screen.getByRole("radio", { name: "Unknown wire" }));

		expect(onValueChange).toHaveBeenCalledWith("unknown");
	});

	it('reflects the selected "?" value as checked', () => {
		render(<WirePad value="unknown" onValueChange={vi.fn()} allowUnknown />);

		expect(screen.getByRole("radio", { name: "Unknown wire" })).toBeChecked();
	});

	it("renders an optional label and uses it as the group's accessible name", () => {
		render(
			<WirePad value={null} onValueChange={vi.fn()} label="Announced value" />,
		);

		expect(screen.getByText("Announced value")).toBeInTheDocument();
		expect(
			screen.getByRole("radiogroup", { name: "Announced value" }),
		).toBeInTheDocument();
	});

	it('labels the group "Wire value" when no label is given', () => {
		render(<WirePad value={null} onValueChange={vi.fn()} />);

		expect(
			screen.getByRole("radiogroup", { name: "Wire value" }),
		).toBeInTheDocument();
	});

	describe("when in multiple mode", () => {
		it("reports the selected values as an array", async () => {
			const user = userEvent.setup();
			const onValuesChange = vi.fn();
			render(
				<WirePad
					multiple
					values={[]}
					onValuesChange={onValuesChange}
					blueOnly
				/>,
			);

			await user.click(screen.getByRole("button", { name: "Wire 3" }));

			expect(onValuesChange).toHaveBeenCalledWith([3]);
		});

		it("reflects the selected values as pressed", () => {
			render(
				<WirePad multiple values={[3, 11]} onValuesChange={vi.fn()} blueOnly />,
			);

			// multi-select renders toggle buttons whose selection is the ARIA
			// pressed state (single-select uses radios + checked instead).
			expect(screen.getByRole("button", { name: "Wire 3" })).toHaveAttribute(
				"aria-pressed",
				"true",
			);
			expect(screen.getByRole("button", { name: "Wire 1" })).toHaveAttribute(
				"aria-pressed",
				"false",
			);
		});

		it("adds to the selection when no max is set", async () => {
			const user = userEvent.setup();
			const onValuesChange = vi.fn();
			render(
				<WirePad
					multiple
					values={[3]}
					onValuesChange={onValuesChange}
					blueOnly
				/>,
			);

			await user.click(screen.getByRole("button", { name: "Wire 7" }));

			expect(onValuesChange).toHaveBeenCalledWith([3, 7]);
		});

		it("caps the selection at max, dropping the oldest pick", async () => {
			const user = userEvent.setup();
			const onValuesChange = vi.fn();
			render(
				<WirePad
					multiple
					values={[3, 11]}
					onValuesChange={onValuesChange}
					max={2}
					blueOnly
				/>,
			);

			await user.click(screen.getByRole("button", { name: "Wire 5" }));

			// the third pick pushes out the earliest (3), keeping the last two.
			expect(onValuesChange).toHaveBeenCalledWith([11, 5]);
		});

		it("allows deselecting a chosen value (unlike single mode)", async () => {
			const user = userEvent.setup();
			const onValuesChange = vi.fn();
			render(
				<WirePad
					multiple
					values={[3]}
					onValuesChange={onValuesChange}
					blueOnly
				/>,
			);

			await user.click(screen.getByRole("button", { name: "Wire 3" }));

			expect(onValuesChange).toHaveBeenCalledWith([]);
		});

		it('reports "unknown" when the "?" option is picked', async () => {
			const user = userEvent.setup();
			const onValuesChange = vi.fn();
			render(
				<WirePad
					multiple
					values={[]}
					onValuesChange={onValuesChange}
					blueOnly
					allowUnknown
				/>,
			);

			await user.click(screen.getByRole("button", { name: "Unknown wire" }));

			expect(onValuesChange).toHaveBeenCalledWith(["unknown"]);
		});
	});
});
