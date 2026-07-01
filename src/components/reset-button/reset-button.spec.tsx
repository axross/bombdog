import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { useTrackerStore } from "@/lib/tracker-store";
import { ResetButton } from "./reset-button";

afterEach(() => {
	useTrackerStore.setState({
		players: [],
		captainIndex: 0,
		moves: [],
		redoStack: [],
	});
});

describe("<ResetButton>", () => {
	it("clears state only after the confirmation is accepted", async () => {
		const user = userEvent.setup();
		useTrackerStore.setState({
			players: [{ id: "a", name: "Alice" }],
			captainIndex: 0,
			moves: [],
			redoStack: [],
		});

		render(<ResetButton />);
		await user.click(screen.getByRole("button", { name: "Reset" }));

		const dialog = screen.getByRole("alertdialog");
		expect(within(dialog).getByText("Reset the tracker?")).toBeInTheDocument();
		// Still intact until confirmed.
		expect(useTrackerStore.getState().players).toHaveLength(1);

		await user.click(within(dialog).getByRole("button", { name: "Reset" }));
		expect(useTrackerStore.getState().players).toHaveLength(0);
	});
});
