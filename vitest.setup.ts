import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Radix primitives (DropdownMenu, Select) drive open/close through Pointer
// Capture and scroll APIs that jsdom does not implement. Stub them so those
// menus can be opened and navigated in unit tests.
for (const method of [
	"hasPointerCapture",
	"setPointerCapture",
	"releasePointerCapture",
	"scrollIntoView",
] as const) {
	if (!(method in Element.prototype)) {
		Object.defineProperty(Element.prototype, method, {
			configurable: true,
			value: method === "hasPointerCapture" ? () => false : () => {},
		});
	}
}

// jsdom lacks ResizeObserver, which Radix popper content observes on mount.
if (!("ResizeObserver" in globalThis)) {
	globalThis.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}

afterEach(() => {
	cleanup();
});
