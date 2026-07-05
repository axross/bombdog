import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

function renderTabs(onValueChange?: (value: string) => void) {
	render(
		<Tabs defaultValue="one" onValueChange={onValueChange}>
			<TabsList aria-label="Views">
				<TabsTrigger value="one">One</TabsTrigger>
				<TabsTrigger value="two">Two</TabsTrigger>
			</TabsList>
			<TabsContent value="one">First panel</TabsContent>
			<TabsContent value="two">Second panel</TabsContent>
		</Tabs>,
	);
}

describe("<Tabs>", () => {
	it("renders a labelled tab list with the default tab selected", () => {
		renderTabs();
		expect(screen.getByRole("tablist", { name: "Views" })).toBeInTheDocument();
		expect(
			screen.getByRole("tab", { name: "One", selected: true }),
		).toBeInTheDocument();
		expect(screen.getByText("First panel")).toBeVisible();
	});

	it("switches the visible panel when another tab is pressed", async () => {
		const user = userEvent.setup();
		renderTabs();
		await user.click(screen.getByRole("tab", { name: "Two" }));
		expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByText("Second panel")).toBeVisible();
	});
});
