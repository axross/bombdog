import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RevealDialog } from "./reveal-dialog";

afterEach(() => {
	vi.clearAllMocks();
});

describe("<RevealDialog>", () => {
	it("renders wire chips 1–12 plus Yellow and Unknown when open", () => {
		render(
			<RevealDialog
				open
				onOpenChange={vi.fn()}
				onSelect={vi.fn()}
				current={null}
			/>,
		);

		for (let n = 1; n <= 12; n++) {
			expect(
				screen.getByRole("radio", { name: `Wire ${n}` }),
			).toBeInTheDocument();
		}
		expect(
			screen.getByRole("radio", { name: "Yellow wire" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("radio", { name: "Unknown wire" }),
		).toBeInTheDocument();
	});

	it("selecting a numeric chip reports the value and closes", async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();
		const onOpenChange = vi.fn();
		render(
			<RevealDialog
				open
				onOpenChange={onOpenChange}
				onSelect={onSelect}
				current={null}
			/>,
		);

		await user.click(screen.getByRole("radio", { name: "Wire 8" }));

		expect(onSelect).toHaveBeenCalledWith(8);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('selecting Yellow reports "yellow" and closes', async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();
		const onOpenChange = vi.fn();
		render(
			<RevealDialog
				open
				onOpenChange={onOpenChange}
				onSelect={onSelect}
				current={null}
			/>,
		);

		await user.click(screen.getByRole("radio", { name: "Yellow wire" }));

		expect(onSelect).toHaveBeenCalledWith("yellow");
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('selecting Unknown reports "unknown" and closes', async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();
		const onOpenChange = vi.fn();
		render(
			<RevealDialog
				open
				onOpenChange={onOpenChange}
				onSelect={onSelect}
				current={null}
			/>,
		);

		await user.click(screen.getByRole("radio", { name: "Unknown wire" }));

		expect(onSelect).toHaveBeenCalledWith("unknown");
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("marks the currently-recorded value checked, and only it", () => {
		render(
			<RevealDialog
				open
				onOpenChange={vi.fn()}
				onSelect={vi.fn()}
				current={8}
			/>,
		);

		expect(screen.getByRole("radio", { name: "Wire 8" })).toBeChecked();
		expect(screen.getByRole("radio", { name: "Wire 7" })).not.toBeChecked();
		expect(
			screen.getByRole("radio", { name: "Yellow wire" }),
		).not.toBeChecked();
	});

	it("re-picking the recorded value still reports it and closes", async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();
		const onOpenChange = vi.fn();
		render(
			<RevealDialog
				open
				onOpenChange={onOpenChange}
				onSelect={onSelect}
				current={8}
			/>,
		);

		// the pad re-commits the active value on a repeat tap, so confirming the
		// recorded value behaves like any other pick instead of dead-ending.
		await user.click(screen.getByRole("radio", { name: "Wire 8" }));

		expect(onSelect).toHaveBeenCalledWith(8);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
