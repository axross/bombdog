import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BottomSheet } from "./bottom-sheet";

afterEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

/**
 * Render an open sheet and return its content plus grab handle, giving each
 * element a fixed `offsetHeight` (jsdom reports 0) so the drag threshold — a
 * third of the sheet height — is meaningful.
 */
function renderDraggable(onOpenChange: () => void) {
	render(
		<BottomSheet
			open
			onOpenChange={onOpenChange}
			title="Sheet title"
			data-testid="sheet"
		>
			<p>Body</p>
		</BottomSheet>,
	);
	const content = screen.getByTestId("sheet");
	const handle = screen.getByTestId("sheet-handle");
	Object.defineProperty(content, "offsetHeight", {
		configurable: true,
		value: 400,
	});
	return { content, handle };
}

describe("<BottomSheet>", () => {
	it("renders the title and body when open", () => {
		render(
			<BottomSheet open onOpenChange={vi.fn()} title="Sheet title">
				<p>Body content</p>
			</BottomSheet>,
		);

		expect(screen.getByText("Sheet title")).toBeInTheDocument();
		expect(screen.getByText("Body content")).toBeInTheDocument();
	});

	it("renders the optional description as the dialog's hint", () => {
		render(
			<BottomSheet
				open
				onOpenChange={vi.fn()}
				title="Sheet title"
				description="A helpful hint"
			>
				<p>Body</p>
			</BottomSheet>,
		);

		expect(screen.getByText("A helpful hint")).toBeInTheDocument();
	});

	it("mounts nothing while closed", () => {
		render(
			<BottomSheet open={false} onOpenChange={vi.fn()} title="Sheet title">
				<p>Body content</p>
			</BottomSheet>,
		);

		expect(screen.queryByText("Sheet title")).not.toBeInTheDocument();
		expect(screen.queryByText("Body content")).not.toBeInTheDocument();
	});

	it("requests close on Escape", async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();
		render(
			<BottomSheet open onOpenChange={onOpenChange} title="Sheet title">
				<p>Body</p>
			</BottomSheet>,
		);

		await user.keyboard("{Escape}");
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("stacks a nested sheet deeper and marks the parent as backgrounded", () => {
		render(
			<BottomSheet
				open
				onOpenChange={vi.fn()}
				title="Outer"
				data-testid="outer"
			>
				<BottomSheet
					open
					onOpenChange={vi.fn()}
					title="Inner"
					data-testid="inner"
				>
					<p>Inner body</p>
				</BottomSheet>
			</BottomSheet>,
		);

		const outer = screen.getByTestId("outer");
		const inner = screen.getByTestId("inner");
		// the nested sheet renders one stacking level deeper.
		expect(outer.style.getPropertyValue("--sheet-depth")).toBe("0");
		expect(inner.style.getPropertyValue("--sheet-depth")).toBe("1");
		// the outer sheet knows it is backgrounded (its overlay quiets); the
		// topmost sheet does not.
		expect(outer).toHaveAttribute("data-sheet-nested", "true");
		expect(inner).not.toHaveAttribute("data-sheet-nested");
	});

	it("clears the backgrounded state when the nested sheet closes", () => {
		const { rerender } = render(
			<BottomSheet
				open
				onOpenChange={vi.fn()}
				title="Outer"
				data-testid="outer"
			>
				<BottomSheet open onOpenChange={vi.fn()} title="Inner">
					<p>Inner body</p>
				</BottomSheet>
			</BottomSheet>,
		);
		expect(screen.getByTestId("outer")).toHaveAttribute(
			"data-sheet-nested",
			"true",
		);

		rerender(
			<BottomSheet
				open
				onOpenChange={vi.fn()}
				title="Outer"
				data-testid="outer"
			>
				<BottomSheet open={false} onOpenChange={vi.fn()} title="Inner">
					<p>Inner body</p>
				</BottomSheet>
			</BottomSheet>,
		);
		expect(screen.getByTestId("outer")).not.toHaveAttribute(
			"data-sheet-nested",
		);
	});

	it("does not fire onCloseComplete for an animationEnd while still open", () => {
		const onCloseComplete = vi.fn();
		render(
			<BottomSheet
				open
				onOpenChange={vi.fn()}
				title="Sheet title"
				data-testid="sheet"
				onCloseComplete={onCloseComplete}
			>
				<p>Body</p>
			</BottomSheet>,
		);

		// the entrance animation (or any animationEnd while open) must not unmount.
		fireEvent.animationEnd(screen.getByTestId("sheet"));
		expect(onCloseComplete).not.toHaveBeenCalled();
	});

	it("dismisses when the handle is dragged past the threshold", () => {
		const onOpenChange = vi.fn();
		const { content, handle } = renderDraggable(onOpenChange);

		fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 });
		fireEvent.pointerMove(handle, { pointerId: 1, clientY: 300 });
		// the sheet tracks the drag via the custom property.
		expect(content.style.getPropertyValue("--sheet-drag-y")).toBe("200px");
		fireEvent.pointerUp(handle, { pointerId: 1, clientY: 300 });

		// 200px > a third of the 400px sheet, so the drag dismisses.
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("springs back and does not dismiss for a short drag", () => {
		const onOpenChange = vi.fn();
		const { content, handle } = renderDraggable(onOpenChange);

		fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 });
		fireEvent.pointerMove(handle, { pointerId: 1, clientY: 150 });
		fireEvent.pointerUp(handle, { pointerId: 1, clientY: 150 });

		// 50px is under the threshold, so it snaps back rather than dismissing.
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(content.style.getPropertyValue("--sheet-drag-y")).toBe("0px");
	});

	it("resets without dismissing when the gesture is cancelled", () => {
		const onOpenChange = vi.fn();
		const { content, handle } = renderDraggable(onOpenChange);

		fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 });
		fireEvent.pointerMove(handle, { pointerId: 1, clientY: 300 });
		fireEvent.pointerCancel(handle, { pointerId: 1 });

		expect(onOpenChange).not.toHaveBeenCalled();
		expect(content.style.getPropertyValue("--sheet-drag-y")).toBe("0px");
	});

	it("ignores the drag gesture on wide viewports (centered dialog)", () => {
		// on wide the sheet is a centered dialog with no handle/drag; matchMedia
		// (keyed off body width) reports the wide breakpoint.
		vi.stubGlobal(
			"matchMedia",
			vi.fn().mockReturnValue({ matches: true } as MediaQueryList),
		);
		const onOpenChange = vi.fn();
		const { handle } = renderDraggable(onOpenChange);

		fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 });
		fireEvent.pointerMove(handle, { pointerId: 1, clientY: 400 });
		fireEvent.pointerUp(handle, { pointerId: 1, clientY: 400 });

		// the gesture never starts, so a big drag does not dismiss.
		expect(onOpenChange).not.toHaveBeenCalled();
	});
});
