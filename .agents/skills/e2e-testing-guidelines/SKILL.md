---
name: e2e-testing-guidelines
description: Use this skill whenever writing, reviewing, refactoring, or running Playwright end-to-end tests in this project, or whenever a change requires verification via the e2e suite. Covers the test directory layout, test-file naming, structured test/step naming, stable test-id chained/scoped locators (never text matching), framework-native auto-waiting assertions over manual DOM reads, polling/wait-for-condition helpers (never fixed sleeps) for async settling such as scroll-driven or animation transitions, authenticated state reuse for API helpers, reusable API/setup helper conventions, the snapshot update flow, and commands for running tests against dev, local production, and a deployed environment. Use even when the user only mentions e2e tests, snapshots, test IDs, polling/waiting, focus assertions, or a failing test run.
---

# E2E Testing Guidelines

Apply these rules when running, writing or reviewing Playwright end-to-end tests in this project.

## End-to-End Test Commands

See [commands.md](./references/commands.md) for:

- Running end-to-end tests

## End-to-End Test Structure

See [structure.md](./references/structure.md) for:

- Understanding the end-to-end test structure
- Writing end-to-end tests
- Reviewing end-to-end tests
- Refactoring end-to-end tests

## End-to-End Test Conventions

See [conventions.md](./references/conventions.md) for:

- Writing end-to-end tests
- Reviewing end-to-end tests
- Refactoring end-to-end tests

## Project Defaults

- MUST place specs under `e2e/tests/` named `<name>.test.ts`, and reusable helpers under `e2e/helpers/` (Playwright `testDir` is `e2e/tests`).
- MUST run the suite with `npm run test:e2e`; point at a system Chromium via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` when Playwright's managed browser is unavailable.
- MUST wrap each meaningful action/assertion group of a **multi-phase** scenario (a journey with two or more distinct arrange/act/assert phases) in `test.step("<human sentence>", …)` (steps may nest). A short **atomic** test — a single arrange → act → assert, e.g. most smoke gates — MAY omit steps; do not pad it with a one-step wrapper.
- MUST locate elements with `getByTestId()`, chained to narrow scope (e.g. `composer(page).getByTestId("log-move")`); use `locator('[data-testid="…"][data-…="…"]')` for entity/state targeting. Reserve `getByRole` for elements without a test id (e.g. Radix-portaled `option`s); avoid `getByText` for control targeting.
- MUST prefer locator-native, auto-waiting assertions (`toBeVisible`, `toBeEnabled`, `toHaveAttribute`); never use fixed sleeps — use `expect.poll` / `waitForFunction` when no native assertion fits.
- SHOULD factor repeated navigation/setup into `e2e/helpers/` functions that take `page` and return `Locator`s or perform a named action.
- SHOULD organise specs by purpose: `smoke.test.ts` (a handful of shallow gates — boots, core loop of set-up → log → persist → reset), `happy-path.test.ts` (the main use cases end to end — each action type, turn rotation, undo/redo, edit, collapse, persistence), and `regressions.test.ts` (named guards for past bugs). Smoke is the first gate; if it fails, deeper suites aren't worth running.
- MUST neutralise the Next.js dev-tools badge before interacting: under `npm run dev` the `<nextjs-portal>` sits bottom-left and intercepts pointer events on bottom-anchored controls (collapse/undo/redo). Hide it once via `page.addStyleTag({ content: "nextjs-portal{display:none!important}" })` inside a shared `gotoApp(page)` helper — a no-op against a production build. Each test gets a fresh browser context, so IndexedDB starts empty per test (a reliable "boots to setup" precondition).
- MUST use Playwright's own locator API — `getByTestId`, `getByRole`, `getByLabel` — not Testing Library's `getByLabelText`. Target aria-labelled non-form elements (e.g. wire chips: `role="img"`) with `getByRole("img", { name })`.
