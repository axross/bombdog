import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RadioGroup, RadioGroupItem } from "./radio-group";

function renderGroup(onValueChange = vi.fn()) {
	render(
		<RadioGroup value="0" onValueChange={onValueChange} aria-label="Captain">
			<RadioGroupItem value="0" aria-label="Seat one" />
			<RadioGroupItem value="1" aria-label="Seat two" />
		</RadioGroup>,
	);
	return { onValueChange };
}

describe("<RadioGroup>", () => {
	it("renders a labelled group with the current value checked", () => {
		renderGroup();
		expect(
			screen.getByRole("radiogroup", { name: "Captain" }),
		).toBeInTheDocument();
		expect(screen.getByRole("radio", { name: "Seat one" })).toBeChecked();
		expect(screen.getByRole("radio", { name: "Seat two" })).not.toBeChecked();
	});

	it("reports the newly chosen value", async () => {
		const user = userEvent.setup();
		const { onValueChange } = renderGroup();
		await user.click(screen.getByRole("radio", { name: "Seat two" }));
		expect(onValueChange).toHaveBeenCalledWith("1");
	});
});
