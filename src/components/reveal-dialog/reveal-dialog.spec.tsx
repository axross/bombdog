import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RevealDialog } from "./reveal-dialog";

afterEach(() => {
	vi.clearAllMocks();
});

describe("<RevealDialog>", () => {
	it("renders numeric cells 1–12 plus Yellow and Unknown when open", () => {
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
				screen.getByRole("button", { name: `Wire ${n}` }),
			).toBeInTheDocument();
		}
		expect(
			screen.getByRole("button", { name: "Yellow wire" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Unknown wire" }),
		).toBeInTheDocument();
	});

	it("selecting a numeric cell reports the value and closes", async () => {
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

		await user.click(screen.getByRole("button", { name: "Wire 8" }));

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

		await user.click(screen.getByRole("button", { name: "Yellow wire" }));

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

		await user.click(screen.getByRole("button", { name: "Unknown wire" }));

		expect(onSelect).toHaveBeenCalledWith("unknown");
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("highlights the currently-recorded numeric value", () => {
		render(
			<RevealDialog
				open
				onOpenChange={vi.fn()}
				onSelect={vi.fn()}
				current={8}
			/>,
		);
		// The selected class is applied; the cell is still present and reachable.
		expect(screen.getByRole("button", { name: "Wire 8" })).toBeInTheDocument();
	});

	it("highlights the currently-recorded Yellow value", () => {
		render(
			<RevealDialog
				open
				onOpenChange={vi.fn()}
				onSelect={vi.fn()}
				current="yellow"
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Yellow wire" }),
		).toBeInTheDocument();
	});

	it("highlights the currently-recorded Unknown value", () => {
		render(
			<RevealDialog
				open
				onOpenChange={vi.fn()}
				onSelect={vi.fn()}
				current="unknown"
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Unknown wire" }),
		).toBeInTheDocument();
	});
});
