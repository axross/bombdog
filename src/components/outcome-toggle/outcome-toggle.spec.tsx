import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OutcomeToggle } from "./outcome-toggle";

afterEach(() => {
	vi.clearAllMocks();
});

describe("<OutcomeToggle>", () => {
	it("clicking Success reports success with a cleared reveal", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<OutcomeToggle outcome={null} revealed={null} onChange={onChange} />,
		);

		await user.click(screen.getByRole("button", { name: /Success/ }));

		expect(onChange).toHaveBeenCalledWith("success", null);
	});

	it("clicking Fail opens the reveal dialog to record the value", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<OutcomeToggle outcome={null} revealed={null} onChange={onChange} />,
		);

		expect(screen.queryByTestId("reveal-dialog")).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /Fail/ }));

		expect(screen.getByTestId("reveal-dialog")).toBeInTheDocument();
		// opening the dialog alone does not record an outcome.
		expect(onChange).not.toHaveBeenCalled();
	});

	it("choosing a value in the dialog reports fail with that value", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<OutcomeToggle outcome={null} revealed={null} onChange={onChange} />,
		);

		await user.click(screen.getByRole("button", { name: /Fail/ }));
		await user.click(screen.getByRole("button", { name: "Wire 8" }));

		expect(onChange).toHaveBeenCalledWith("fail", 8);
	});

	it("shows the recorded reveal on the Fail button when failed", () => {
		render(<OutcomeToggle outcome="fail" revealed={8} onChange={vi.fn()} />);

		const fail = screen.getByRole("button", { name: /Fail/ });
		expect(fail).toHaveTextContent("(8)");
		expect(fail).toHaveAttribute("aria-pressed", "true");
	});

	it("does not append a reveal suffix while the outcome is success", () => {
		render(
			<OutcomeToggle outcome="success" revealed={null} onChange={vi.fn()} />,
		);

		const fail = screen.getByRole("button", { name: /Fail/ });
		expect(fail).not.toHaveTextContent("(");
		expect(screen.getByRole("button", { name: /Success/ })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	it("renders an optional label above the buttons", () => {
		render(
			<OutcomeToggle
				outcome={null}
				revealed={null}
				onChange={vi.fn()}
				label="Result"
			/>,
		);

		expect(screen.getByText("Result")).toBeInTheDocument();
		expect(screen.getByRole("group", { name: "Result" })).toBeInTheDocument();
	});

	it('labels the fieldset "Outcome" when no label is given', () => {
		render(<OutcomeToggle outcome={null} revealed={null} onChange={vi.fn()} />);

		expect(screen.getByRole("group", { name: "Outcome" })).toBeInTheDocument();
	});
});
