import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useTrackerStore } from "@/lib/tracker-store";
import type { Player } from "@/lib/types";
import { StartingInfo } from "./starting-info";

const players: Player[] = [
	{ id: "a", name: "Alice" },
	{ id: "b", name: "Bob" },
	{ id: "c", name: "Carol" },
];

function reset() {
	useTrackerStore.setState({
		players: [],
		captainIndex: 0,
		moves: [],
		infoTokens: {},
		redoStack: [],
		previousPlayers: [],
		previousCaptainIndex: 0,
	});
}

beforeEach(reset);
afterEach(reset);

describe("<StartingInfo>", () => {
	it("renders nothing when no info tokens were recorded", () => {
		useTrackerStore.setState({ players, infoTokens: {} });

		const { container } = render(<StartingInfo />);

		expect(container).toBeEmptyDOMElement();
		expect(screen.queryByTestId("starting-info")).not.toBeInTheDocument();
	});

	it("renders a chip per player that placed a token, in seat order", () => {
		useTrackerStore.setState({ players, infoTokens: { a: 9, c: 4 } });

		render(<StartingInfo />);

		const tokens = screen.getAllByTestId("starting-info-token");
		expect(tokens).toHaveLength(2);
		// seat order: Alice (a) then Carol (c); Bob (b) placed no token.
		expect(tokens[0]).toHaveAttribute("data-player", "Alice");
		expect(tokens[1]).toHaveAttribute("data-player", "Carol");

		expect(within(tokens[0]).getByText("Alice")).toBeInTheDocument();
		expect(
			within(tokens[0]).getByRole("img", { name: "Wire 9" }),
		).toHaveTextContent("9");
		expect(
			within(tokens[1]).getByRole("img", { name: "Wire 4" }),
		).toHaveTextContent("4");
	});

	it("omits players without a token", () => {
		useTrackerStore.setState({ players, infoTokens: { b: 7 } });

		render(<StartingInfo />);

		const tokens = screen.getAllByTestId("starting-info-token");
		expect(tokens).toHaveLength(1);
		expect(tokens[0]).toHaveAttribute("data-player", "Bob");
	});

	it("opens the editor from the Edit control when tokens exist", () => {
		useTrackerStore.setState({ players, infoTokens: { a: 9 } });

		render(<StartingInfo />);

		// the editor is closed until the trigger is activated.
		expect(
			screen.queryByTestId("starting-info-editor"),
		).not.toBeInTheDocument();

		fireEvent.click(screen.getByTestId("edit-starting-info"));

		expect(screen.getByTestId("starting-info-editor")).toBeInTheDocument();
	});
});
