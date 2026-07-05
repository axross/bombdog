import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Player } from "@/lib/types";
import { PlayerPicker } from "./player-picker";

const players: Player[] = [
	{ id: "a", name: "Alice" },
	{ id: "b", name: "Bob" },
	{ id: "c", name: "Carol" },
];

describe("<PlayerPicker>", () => {
	it("renders every player as a one-tap option in seat order", () => {
		render(
			<PlayerPicker
				label="Target"
				players={players}
				value=""
				onValueChange={vi.fn()}
			/>,
		);
		const radios = screen.getAllByRole("radio");
		expect(radios.map((r) => r.textContent)).toEqual(["Alice", "Bob", "Carol"]);
	});

	it("reports the chosen player's id", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<PlayerPicker
				label="Target"
				players={players}
				value=""
				onValueChange={onValueChange}
			/>,
		);
		await user.click(screen.getByRole("radio", { name: "Bob" }));
		expect(onValueChange).toHaveBeenCalledWith("b");
	});

	it("folds the self entry into the overflow menu with a (self) label", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<PlayerPicker
				label="Target"
				players={players}
				value=""
				onValueChange={onValueChange}
				foldSelfId="b"
				menuLabel="Other targets"
			/>,
		);

		// Bob (the actor) leaves the one-tap row…
		expect(
			screen.queryByRole("radio", { name: "Bob" }),
		).not.toBeInTheDocument();
		// …and the remaining targets keep their seat order.
		const radios = screen.getAllByRole("radio");
		expect(radios.map((r) => r.textContent)).toEqual(["Alice", "Carol"]);

		await user.click(screen.getByRole("button", { name: "Other targets" }));
		await user.click(screen.getByRole("menuitemradio", { name: "Bob (self)" }));
		expect(onValueChange).toHaveBeenCalledWith("b");
	});

	it("toggles any subset of players in multi mode", async () => {
		const user = userEvent.setup();
		const onValuesChange = vi.fn();
		render(
			<PlayerPicker
				label="Holders"
				multiple
				players={players}
				values={["a"]}
				onValuesChange={onValuesChange}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Carol" }));
		expect(onValuesChange).toHaveBeenCalledWith(["a", "c"]);
	});
});
