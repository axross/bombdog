import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CheckToggle } from "./check-toggle";

describe("<CheckToggle>", () => {
	it("renders an unpressed toggle button with its label", () => {
		render(
			<CheckToggle pressed={false} onClick={vi.fn()}>
				Exclude solo cuts
			</CheckToggle>,
		);
		const button = screen.getByRole("button", { name: "Exclude solo cuts" });
		expect(button).toHaveAttribute("aria-pressed", "false");
	});

	it("marks the toggle pressed", () => {
		render(
			<CheckToggle pressed onClick={vi.fn()}>
				Exclude solo cuts
			</CheckToggle>,
		);
		expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
	});

	it("fires onClick when pressed", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		render(
			<CheckToggle pressed={false} onClick={onClick}>
				Exclude solo cuts
			</CheckToggle>,
		);
		await user.click(screen.getByRole("button"));
		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
