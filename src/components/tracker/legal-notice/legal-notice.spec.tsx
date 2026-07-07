import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalNotice } from "./legal-notice";

describe("<LegalNotice>", () => {
	it("disclaims any affiliation with the game's rights holders", () => {
		render(<LegalNotice />);
		expect(
			screen.getByText(/unofficial, fan-made companion/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/not affiliated with, endorsed by/i),
		).toBeInTheDocument();
	});

	it("attributes Bomb Busters to Cocktail Games and their owners", () => {
		render(<LegalNotice />);
		expect(
			screen.getByText(/trademarks and copyright of Cocktail Games/i),
		).toBeInTheDocument();
	});

	it("shows Bombdog's own copyright line", () => {
		render(<LegalNotice />);
		expect(screen.getByText("© 2026 axross")).toBeInTheDocument();
	});

	it("exposes a contentinfo landmark linking the game to BoardGameGeek", () => {
		render(<LegalNotice />);
		const landmark = screen.getByRole("contentinfo");
		expect(landmark.tagName).toBe("FOOTER");
		expect(
			within(landmark).getByRole("link", { name: "Bomb Busters" }),
		).toHaveAttribute(
			"href",
			"https://boardgamegeek.com/boardgame/413246/bomb-busters",
		);
	});
});
