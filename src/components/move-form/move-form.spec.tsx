import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type JSX, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MoveType, Player } from "@/lib/types";
import { type DraftFields, emptyDraftFields } from "./draft";
import { MoveForm } from "./move-form";

const players: Player[] = [
	{ id: "a", name: "Alice" },
	{ id: "b", name: "Bob" },
	{ id: "c", name: "Carol" },
];

/**
 * MoveForm is fully controlled, so drive it from a harness that owns `type` and
 * `fields`, mirroring the composer's plumbing so the form is exercised through
 * its public props.
 */
function Harness({
	initialType = "dual-cut",
	initialFields,
	withTabs = true,
	onTypeChangeSpy,
	onFieldsChangeSpy,
}: {
	initialType?: MoveType;
	initialFields?: DraftFields;
	withTabs?: boolean;
	onTypeChangeSpy?: (type: MoveType) => void;
	onFieldsChangeSpy?: (fields: DraftFields) => void;
}): JSX.Element {
	const [type, setType] = useState<MoveType>(initialType);
	const [fields, setFields] = useState<DraftFields>(
		() => initialFields ?? emptyDraftFields("a"),
	);

	const handleTypeChange = (next: MoveType) => {
		onTypeChangeSpy?.(next);
		setType(next);
	};

	const handleFieldsChange = (next: DraftFields) => {
		onFieldsChangeSpy?.(next);
		setFields(next);
	};

	return (
		<MoveForm
			players={players}
			type={type}
			onTypeChange={withTabs ? handleTypeChange : undefined}
			fields={fields}
			onFieldsChange={handleFieldsChange}
		/>
	);
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("<MoveForm>", () => {
	it("renders the four action tabs in add mode", () => {
		render(<Harness />);
		for (const label of ["Dual cut", "Solo cut", "Detectors", "Misc"]) {
			expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
		}
	});

	it("shows the acting selector labelled by the current player", () => {
		render(<Harness />);
		expect(
			screen.getByRole("combobox", { name: "Acting" }),
		).toBeInTheDocument();
	});

	it("renders target, wire, and result for a dual cut", () => {
		render(<Harness initialType="dual-cut" />);
		expect(
			screen.getByRole("radiogroup", { name: "Target" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("radiogroup", { name: "Wire" }),
		).toBeInTheDocument();
		expect(screen.getByRole("group", { name: "Result" })).toBeInTheDocument();
		// yellow is offered for a dual cut (not blue-only).
		expect(
			screen.getByRole("radio", { name: "Yellow wire" }),
		).toBeInTheDocument();
		// the "?" (unknown) option is offered for the cut wire.
		expect(
			screen.getByRole("radio", { name: "Unknown wire" }),
		).toBeInTheDocument();
	});

	it("switching to Solo cut calls onTypeChange and shows only the wire", async () => {
		const user = userEvent.setup();
		const onTypeChange = vi.fn();
		render(<Harness onTypeChangeSpy={onTypeChange} />);

		await user.click(screen.getByRole("tab", { name: "Solo cut" }));

		expect(onTypeChange).toHaveBeenCalledWith("solo-cut");
		expect(
			screen.getByRole("radiogroup", { name: "Wire" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("radiogroup", { name: "Target" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("group", { name: "Result" }),
		).not.toBeInTheDocument();
	});

	it("switching to Detectors shows the card picker, target, value, and result and hides Yellow", async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.click(screen.getByRole("tab", { name: "Detectors" }));

		// the detector-card dropdown (labelled "Equipment") picks which detector.
		expect(
			screen.getByRole("combobox", { name: "Equipment" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("radiogroup", { name: "Target" }),
		).toBeInTheDocument();
		// the value pad is a multi-select toolbar of blue wires.
		expect(screen.getByRole("toolbar", { name: "Value" })).toBeInTheDocument();
		expect(screen.getByRole("group", { name: "Result" })).toBeInTheDocument();
		// blue-only: the Yellow option is not rendered.
		expect(
			screen.queryByRole("radio", { name: "Yellow wire" }),
		).not.toBeInTheDocument();
		// the "?" (unknown) option is still offered for a detector value.
		expect(
			screen.getByRole("button", { name: "Unknown wire" }),
		).toBeInTheDocument();
	});

	it("offers a two-value pad for the X or Y Ray and reports picked values", async () => {
		const user = userEvent.setup();
		const onFieldsChange = vi.fn();
		render(
			<Harness
				initialType="detector"
				initialFields={{ ...emptyDraftFields("a"), detector: "x-or-y-ray" }}
				onFieldsChangeSpy={onFieldsChange}
			/>,
		);

		// the X or Y Ray names two values, so the pad is a two-slot multi-select.
		expect(
			screen.getByRole("toolbar", { name: "Values (pick two)" }),
		).toBeInTheDocument();

		await user.click(screen.getByTestId("wire-4"));
		expect(onFieldsChange).toHaveBeenCalledWith(
			expect.objectContaining({ values: [4] }),
		);
	});

	it("asks which named value a successful X or Y Ray cut, and reports it", async () => {
		const user = userEvent.setup();
		const onFieldsChange = vi.fn();
		render(
			<Harness
				initialType="detector"
				initialFields={{
					...emptyDraftFields("a"),
					detector: "x-or-y-ray",
					targetId: "b",
					values: [4, 9],
					outcome: "success",
				}}
				onFieldsChangeSpy={onFieldsChange}
			/>,
		);

		// the picker offers exactly the two named candidates.
		const picker = screen.getByRole("group", { name: "Actual cut value" });
		expect(within(picker).getByTestId("cut-value-4")).toBeInTheDocument();
		expect(within(picker).getByTestId("cut-value-9")).toBeInTheDocument();

		await user.click(within(picker).getByTestId("cut-value-9"));
		expect(onFieldsChange).toHaveBeenCalledWith(
			expect.objectContaining({ cutValue: 9 }),
		);
	});

	it("hides the actual-value picker unless the ray succeeded", () => {
		render(
			<Harness
				initialType="detector"
				initialFields={{
					...emptyDraftFields("a"),
					detector: "x-or-y-ray",
					targetId: "b",
					values: [4, 9],
					outcome: "fail",
				}}
			/>,
		);
		expect(
			screen.queryByRole("group", { name: "Actual cut value" }),
		).not.toBeInTheDocument();
	});

	it("labels the target as a whole stand for the Super Detector", () => {
		render(
			<Harness
				initialType="detector"
				initialFields={{ ...emptyDraftFields("a"), detector: "super" }}
			/>,
		);

		expect(
			screen.getByRole("radiogroup", { name: "Target (whole stand)" }),
		).toBeInTheDocument();
	});

	it("switching to Misc shows the equipment picker and note field", async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.click(screen.getByRole("tab", { name: "Misc" }));

		expect(
			screen.getByRole("combobox", { name: "Equipment" }),
		).toBeInTheDocument();
		expect(screen.getByPlaceholderText(/moved detonator/)).toBeInTheDocument();
		// cut-only controls are gone.
		expect(
			screen.queryByRole("radiogroup", { name: "Wire" }),
		).not.toBeInTheDocument();
	});

	it("selecting a wire calls onFieldsChange with the value", async () => {
		const user = userEvent.setup();
		const onFieldsChange = vi.fn();
		render(<Harness onFieldsChangeSpy={onFieldsChange} />);

		await user.click(screen.getByRole("radio", { name: "Wire 7" }));

		expect(onFieldsChange).toHaveBeenCalledWith(
			expect.objectContaining({ value: 7 }),
		);
	});

	it("selecting a target calls onFieldsChange with the target id", async () => {
		const user = userEvent.setup();
		const onFieldsChange = vi.fn();
		render(<Harness onFieldsChangeSpy={onFieldsChange} />);

		const target = screen.getByRole("radiogroup", { name: "Target" });
		await user.click(within(target).getByText("Bob"));

		expect(onFieldsChange).toHaveBeenCalledWith(
			expect.objectContaining({ targetId: "b" }),
		);
	});

	it("folds the acting player's self-target into the ⋯ overflow menu", async () => {
		const user = userEvent.setup();
		const onFieldsChange = vi.fn();
		// actor is Alice ("a"), so Alice is the self-target.
		render(<Harness onFieldsChangeSpy={onFieldsChange} />);

		const target = screen.getByRole("radiogroup", { name: "Target" });
		// the other players stay one-tap segmented radios...
		expect(within(target).getByText("Bob")).toBeInTheDocument();
		expect(within(target).getByText("Carol")).toBeInTheDocument();
		// ...but the actor is not a top-level radio; it lives in the menu.
		expect(
			screen.queryByRole("radio", { name: "Alice (self)" }),
		).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Other targets" }));
		await user.click(
			screen.getByRole("menuitemradio", { name: "Alice (self)" }),
		);

		expect(onFieldsChange).toHaveBeenCalledWith(
			expect.objectContaining({ targetId: "a" }),
		);
	});

	it("choosing Success reports the outcome via onFieldsChange", async () => {
		const user = userEvent.setup();
		const onFieldsChange = vi.fn();
		render(<Harness onFieldsChangeSpy={onFieldsChange} />);

		await user.click(screen.getByRole("button", { name: "Success" }));

		expect(onFieldsChange).toHaveBeenCalledWith(
			expect.objectContaining({ outcome: "success", revealed: null }),
		);
	});

	it("typing a note reports it via onFieldsChange in Misc mode", async () => {
		const user = userEvent.setup();
		const onFieldsChange = vi.fn();
		render(<Harness onFieldsChangeSpy={onFieldsChange} />);

		await user.click(screen.getByRole("tab", { name: "Misc" }));
		await user.type(screen.getByPlaceholderText(/moved detonator/), "x");

		expect(onFieldsChange).toHaveBeenCalledWith(
			expect.objectContaining({ note: "x" }),
		);
	});

	describe("when in edit mode (no onTypeChange)", () => {
		it("renders a static action header instead of interactive tabs", () => {
			render(<Harness initialType="detector" withTabs={false} />);

			expect(screen.getByText("Detectors")).toBeInTheDocument();
			expect(screen.queryByRole("tab")).not.toBeInTheDocument();
		});

		it("still renders the fields for the fixed action type", () => {
			render(<Harness initialType="dual-cut" withTabs={false} />);

			expect(
				screen.getByRole("radiogroup", { name: "Target" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("radiogroup", { name: "Wire" }),
			).toBeInTheDocument();
			expect(screen.getByRole("group", { name: "Result" })).toBeInTheDocument();
		});
	});
});
