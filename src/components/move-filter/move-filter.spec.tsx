import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EMPTY_MOVE_FILTER, type MoveFilter as Filter } from "@/lib/types";
import { MoveFilter } from "./move-filter";

const bothExcluded: Filter = {
	excludeSuccessfulDualCut: true,
	excludeSoloCut: true,
};

/**
 * Render with a spy onChange and open the dialog.
 */
async function open(filter: Filter = EMPTY_MOVE_FILTER) {
	const onChange = vi.fn();
	const user = userEvent.setup();
	render(<MoveFilter filter={filter} onChange={onChange} />);
	await user.click(screen.getByTestId("filter"));
	expect(screen.getByTestId("filter-dialog")).toBeInTheDocument();
	return { user, onChange };
}

describe("<MoveFilter>", () => {
	it("marks the trigger active — for sighted and screen-reader users — only when the filter excludes something", () => {
		const { rerender } = render(
			<MoveFilter filter={EMPTY_MOVE_FILTER} onChange={vi.fn()} />,
		);
		// inactive: no dot, and the accessible name is a plain "Filter".
		expect(screen.queryByTestId("filter-active")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument();

		rerender(<MoveFilter filter={bothExcluded} onChange={vi.fn()} />);
		// active: the dot appears and the accessible name announces the state,
		// so the cue is not colour-only.
		expect(screen.getByTestId("filter-active")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Filter (active)" }),
		).toBeInTheDocument();
	});

	it("toggles the successful-dual-cut exclusion", async () => {
		const { user, onChange } = await open();
		await user.click(screen.getByTestId("filter-exclude-dual-cut"));
		expect(onChange).toHaveBeenCalledWith({
			excludeSuccessfulDualCut: true,
			excludeSoloCut: false,
		});
	});

	it("toggles the solo-cut exclusion", async () => {
		const { user, onChange } = await open();
		await user.click(screen.getByTestId("filter-exclude-solo-cut"));
		expect(onChange).toHaveBeenCalledWith({
			excludeSuccessfulDualCut: false,
			excludeSoloCut: true,
		});
	});

	it("turns on both exclusions from the shortcut", async () => {
		const { user, onChange } = await open();
		await user.click(screen.getByTestId("filter-exclude-both"));
		expect(onChange).toHaveBeenCalledWith(bothExcluded);
	});

	it("clears both from the shortcut once both are set", async () => {
		const { user, onChange } = await open(bothExcluded);
		await user.click(screen.getByTestId("filter-exclude-both"));
		expect(onChange).toHaveBeenCalledWith({
			excludeSuccessfulDualCut: false,
			excludeSoloCut: false,
		});
	});

	it("resets to the empty filter when active", async () => {
		const { user, onChange } = await open(bothExcluded);
		const reset = screen.getByTestId("filter-reset");
		expect(reset).toHaveAttribute("aria-disabled", "false");
		await user.click(reset);
		expect(onChange).toHaveBeenCalledWith(EMPTY_MOVE_FILTER);
	});

	it("marks Clear aria-disabled and no-ops it when nothing is excluded", async () => {
		const { user, onChange } = await open();
		const reset = screen.getByTestId("filter-reset");
		expect(reset).toHaveAttribute("aria-disabled", "true");
		// kept focusable (not the `disabled` attribute) so activating it never
		// drops focus out of the dialog; the handler simply does nothing.
		expect(reset).toBeEnabled();
		await user.click(reset);
		expect(onChange).not.toHaveBeenCalled();
	});

	it("labels the shortcut 'Exclude both' when nothing is excluded", async () => {
		await open();
		expect(screen.getByTestId("filter-exclude-both")).toHaveTextContent(
			"Exclude both",
		);
	});

	it("labels the shortcut 'Clear both' when both are excluded", async () => {
		await open(bothExcluded);
		expect(screen.getByTestId("filter-exclude-both")).toHaveTextContent(
			"Clear both",
		);
	});

	it("reflects current exclusions via aria-pressed on the toggles", async () => {
		await open({ excludeSuccessfulDualCut: true, excludeSoloCut: false });
		expect(screen.getByTestId("filter-exclude-dual-cut")).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByTestId("filter-exclude-solo-cut")).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		// the shortcut is a plain action, not a toggle: it carries no aria-pressed.
		expect(screen.getByTestId("filter-exclude-both")).not.toHaveAttribute(
			"aria-pressed",
		);
	});
});
