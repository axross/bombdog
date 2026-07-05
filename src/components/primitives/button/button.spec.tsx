import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("<Button>", () => {
	it("renders a button with its children as the accessible name", () => {
		render(<Button>Save</Button>);
		expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
	});

	it("defaults to type button so it never submits a form by accident", () => {
		render(<Button>Save</Button>);
		expect(screen.getByRole("button")).toHaveAttribute("type", "button");
	});

	it("accepts type submit for a form's submitting action", () => {
		render(<Button type="submit">Log move</Button>);
		expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
	});

	it("fires onClick when pressed", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		render(<Button onClick={onClick}>Save</Button>);
		await user.click(screen.getByRole("button"));
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it("does not fire onClick while disabled", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		render(
			<Button onClick={onClick} disabled>
				Save
			</Button>,
		);
		await user.click(screen.getByRole("button"));
		expect(onClick).not.toHaveBeenCalled();
	});

	it("merges an incoming className with its own classes", () => {
		render(<Button className="custom">Save</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("custom");
		// its own root class stays alongside the caller's.
		expect(button.className.split(" ").length).toBeGreaterThan(1);
	});

	it("passes through arbitrary props such as data-testid and aria-label", () => {
		render(<Button data-testid="undo" aria-label="Undo" size="icon" />);
		expect(screen.getByTestId("undo")).toHaveAccessibleName("Undo");
	});
});
