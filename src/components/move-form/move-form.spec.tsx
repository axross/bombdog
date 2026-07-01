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
 * `fields`. `onTypeChange` mirrors the composer's clearing rule (drop an
 * incompatible yellow when switching to a blue-only detector) so the same
 * behaviour is exercised through the form's public props.
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
		if (next === "double-detector" && fields.value === "yellow") {
			setFields({ ...fields, value: null });
		}
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
		for (const label of [
			"Dual cut",
			"Solo cut",
			"Double detector",
			"Equipment",
		]) {
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
		// Yellow is offered for a dual cut (not blue-only).
		expect(
			screen.getByRole("radio", { name: "Yellow wire" }),
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

	it("switching to Double detector shows target, wire, and result and hides Yellow", async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.click(screen.getByRole("tab", { name: "Double detector" }));

		expect(
			screen.getByRole("radiogroup", { name: "Target" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("radiogroup", { name: "Wire" }),
		).toBeInTheDocument();
		expect(screen.getByRole("group", { name: "Result" })).toBeInTheDocument();
		// Blue-only: the Yellow option is not rendered.
		expect(
			screen.queryByRole("radio", { name: "Yellow wire" }),
		).not.toBeInTheDocument();
	});

	it("switching to Equipment shows the equipment picker and note field", async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.click(screen.getByRole("tab", { name: "Equipment" }));

		expect(
			screen.getByRole("combobox", { name: "Equipment" }),
		).toBeInTheDocument();
		expect(screen.getByPlaceholderText(/moved detonator/)).toBeInTheDocument();
		// Cut-only controls are gone.
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

	it("choosing Success reports the outcome via onFieldsChange", async () => {
		const user = userEvent.setup();
		const onFieldsChange = vi.fn();
		render(<Harness onFieldsChangeSpy={onFieldsChange} />);

		await user.click(screen.getByRole("button", { name: "Success" }));

		expect(onFieldsChange).toHaveBeenCalledWith(
			expect.objectContaining({ outcome: "success", revealed: null }),
		);
	});

	it("typing a note reports it via onFieldsChange in equipment mode", async () => {
		const user = userEvent.setup();
		const onFieldsChange = vi.fn();
		render(<Harness onFieldsChangeSpy={onFieldsChange} />);

		await user.click(screen.getByRole("tab", { name: "Equipment" }));
		await user.type(screen.getByPlaceholderText(/moved detonator/), "x");

		expect(onFieldsChange).toHaveBeenCalledWith(
			expect.objectContaining({ note: "x" }),
		);
	});

	it("clears an incompatible yellow selection when switching to Double detector", async () => {
		const user = userEvent.setup();
		render(
			<Harness initialFields={{ ...emptyDraftFields("a"), value: "yellow" }} />,
		);

		// Yellow is selected while on the (default) dual-cut tab.
		const dualWire = screen.getByRole("radiogroup", { name: "Wire" });
		expect(
			within(dualWire).getByRole("radio", { name: "Yellow wire" }),
		).toHaveAttribute("aria-checked", "true");

		await user.click(screen.getByRole("tab", { name: "Double detector" }));

		// Yellow is gone and no wire is checked after the clear.
		expect(
			screen.queryByRole("radio", { name: "Yellow wire" }),
		).not.toBeInTheDocument();
		const detectorWire = screen.getByRole("radiogroup", { name: "Wire" });
		for (const radio of within(detectorWire).getAllByRole("radio")) {
			expect(radio).toHaveAttribute("aria-checked", "false");
		}
	});

	describe("edit mode (no onTypeChange)", () => {
		it("renders a static action header instead of interactive tabs", () => {
			render(<Harness initialType="double-detector" withTabs={false} />);

			expect(screen.getByText("Double detector")).toBeInTheDocument();
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
