import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button/button";
import { ConfirmDialog } from "./confirm-dialog";

function renderDialog(onConfirm = vi.fn()) {
	render(
		<ConfirmDialog
			trigger={<Button variant="danger-ghost">Reset</Button>}
			title="Reset the tracker?"
			description="This clears the logged moves. It can't be undone."
			confirmLabel="Reset"
			onConfirm={onConfirm}
			data-testid="reset-dialog"
			confirmTestId="reset-confirm"
		/>,
	);
	return { onConfirm };
}

describe("<ConfirmDialog>", () => {
	it("stays closed until the trigger is pressed", () => {
		renderDialog();
		expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
	});

	it("opens on trigger press, showing title and description", async () => {
		const user = userEvent.setup();
		renderDialog();
		await user.click(screen.getByRole("button", { name: "Reset" }));
		const dialog = await screen.findByRole("alertdialog", {
			name: "Reset the tracker?",
		});
		expect(dialog).toHaveAttribute("data-testid", "reset-dialog");
		expect(
			screen.getByText("This clears the logged moves. It can't be undone."),
		).toBeInTheDocument();
	});

	it("fires onConfirm and closes on the confirm action", async () => {
		const user = userEvent.setup();
		const { onConfirm } = renderDialog();
		await user.click(screen.getByRole("button", { name: "Reset" }));
		await screen.findByRole("alertdialog");
		await user.click(screen.getByTestId("reset-confirm"));
		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
	});

	it("closes without confirming on Cancel", async () => {
		const user = userEvent.setup();
		const { onConfirm } = renderDialog();
		await user.click(screen.getByRole("button", { name: "Reset" }));
		await screen.findByRole("alertdialog");
		await user.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onConfirm).not.toHaveBeenCalled();
		expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
	});
});
