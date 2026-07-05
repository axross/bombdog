import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox";

describe("<Checkbox>", () => {
	it("renders a native checkbox named by its label text", () => {
		render(
			<Checkbox checked={false} onChange={vi.fn()}>
				Skip starting info tokens
			</Checkbox>,
		);
		expect(
			screen.getByRole("checkbox", { name: "Skip starting info tokens" }),
		).not.toBeChecked();
	});

	it("fires onChange when the label text is clicked", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<Checkbox checked={false} onChange={onChange}>
				Skip
			</Checkbox>,
		);
		await user.click(screen.getByText("Skip"));
		expect(onChange).toHaveBeenCalledTimes(1);
	});

	it("reflects the checked state", () => {
		render(
			<Checkbox checked onChange={vi.fn()}>
				Skip
			</Checkbox>,
		);
		expect(screen.getByRole("checkbox")).toBeChecked();
	});
});
