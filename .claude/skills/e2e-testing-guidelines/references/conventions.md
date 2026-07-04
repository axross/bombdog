# E2E Test Conventions

Conventions for writing Playwright specs in bombdog. The suite drives the real UI through shared helpers in `e2e/helpers/tracker.ts`; bombdog is a client-only app, so there is no backend, API, or auth to script against.

## Locator Usage

Elements are targeted by stable `data-testid` hooks scoped through their container, never by visible text, so copy changes never break a spec.

**Example:**

```ts
import { expect, type Locator, test } from "@playwright/test";

test("logs a move into the history", async ({ page }) => {
	const log = page.getByTestId("move-log");

	await test.step("Verify the empty state", async () => {
		await expect(log.getByText(/No moves yet/)).toBeVisible();
	});

	await test.step("Verify the first row appears", async () => {
		const row: Locator = log.locator('[data-testid="move"][data-seq="1"]');
		await expect(row).toBeVisible();
	});
});
```

**Guidelines:**

- MUST locate elements with `getByTestId` (kebab-case ids), scoping through the container locator instead of querying globally (`moveLog(page).locator(...)`).
- MUST use `getByRole` for accessible controls (buttons, radios, portaled `option`/`menuitemradio` items) that have no test id, matching by accessible name.
- MUST NOT locate by visible text (`getByText`) except when asserting copy such as the empty-state message.
- SHOULD add a new `data-testid` to the component when no stable hook exists rather than reaching for a structural CSS selector.

## Assertions

Prefer the framework's native auto-waiting assertions (visibility, focus, attribute, class, text, count) over pulling DOM state back into the test for manual comparison. Native assertions auto-wait and produce clearer failure messages; e.g., assert focus directly on the locator instead of reading `document.activeElement` and comparing it yourself.

To assert state that no native assertion covers (such as a computed style or a pseudo-element property), read it inside an in-browser evaluation on the host locator and wrap the call in a polling helper so scroll-driven or transition-driven changes have time to settle.

**Guidelines:**

- MUST prefer the framework's native auto-waiting assertions (visibility, focus, attribute, class, text, count) over evaluating DOM state and comparing it manually in the test. Native assertions auto-wait and produce clearer failure messages.
- MUST NOT use fixed sleeps to "let the animation finish" (see [flakiness-tolerance.md](../../quality-assurance-guidelines/references/flakiness-tolerance.md)).
- MUST use a polling / wait-for-condition helper to re-sample state until the expected value is reached when no native assertion covers it, such as scroll position, computed styles, scroll-driven animations, transitions, or intersection-observer-driven classes.

## Setup and Hooks

Navigation and setup go through the shared helpers so every spec boots the app the same way. `gotoApp` also neutralises the Next.js dev-tools badge that otherwise intercepts pointer events on the composer.

**Example:**

```ts
import { expect, test } from "@playwright/test";
import { composer, gotoApp, startTracking } from "../helpers/tracker";

test.beforeEach(async ({ page }) => {
	await test.step("Open the app on the setup screen", async () => {
		await gotoApp(page);
	});
});

test("starts a game", async ({ page }) => {
	await startTracking(page);
	await expect(composer(page)).toBeVisible();
});
```

**Guidelines:**

- SHOULD use a before-each hook for setup that does not depend on the test case, and an after-each hook for case-independent cleanup.
- MUST navigate through the `gotoApp` helper rather than a bare `page.goto("/")`, so the dev-tools-badge workaround applies.

## Reusable Helpers

Domain actions live in `e2e/helpers/tracker.ts` as named-exported functions that drive the UI (`startTracking`, `logDualCut`, `logDetector`, `moveRow`, `composer`, `moveLog`). Specs import them by relative path and compose them, keeping test cases readable and the UI wiring in one place.

**Example:**

```ts
import { expect, test } from "@playwright/test";
import { logDualCut, moveRow, startTracking } from "../helpers/tracker";

test("logging a move adds it to the history", async ({ page }) => {
	await startTracking(page);
	await logDualCut(page, { target: "Player 2", wire: 9, outcome: "success" });
	await expect(moveRow(page, 1)).toBeVisible();
});
```

**Guidelines:**

- MUST place reusable e2e helpers in `e2e/helpers/` and import them by relative path (`../helpers/tracker`); the `@/*` alias maps to `src/*` and does not resolve `e2e/` paths.
- SHOULD named-export each helper, take `page` as the first argument, and use kebab-case file names.
- SHOULD reuse an existing helper rather than re-driving the same UI flow inline in a spec.
- MUST NOT introduce API/network or authentication helpers; bombdog persists to IndexedDB in the browser and exposes no server API to call.
