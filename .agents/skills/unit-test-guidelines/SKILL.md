---
name: unit-test-guidelines
description: Apply this skill when writing, refactoring, reviewing, or running Vitest unit tests in this project. Covers test framework configuration, explicit test-API imports, colocated test files, describe/case naming and grouping conventions, behavior-focused test design, fixture quality, AHA test abstraction, mocks and fakes, async assertions, snapshot discipline, schema/codec tests, type-only modules, and when unit tests should yield to integration or e2e coverage.
---

# Unit Test Guidelines

Use this skill for Vitest-based unit tests. Unit tests are valuable when they exercise a small exported contract quickly, independently, and from a caller's point of view. They are harmful when they overfit implementation details or replace higher-confidence integration/e2e coverage.

## Testing Scope

See [testing-scope.md](./references/testing-scope.md) for:

- deciding whether a behavior belongs in unit, integration, or e2e coverage
- keeping pure helper tests small while routing browser, data-layer, and framework behavior to broader tests
- recognizing when a unit test would be lower confidence than an integration or e2e check

## Spec Structure and Naming

See [spec-structure-and-naming.md](./references/spec-structure-and-naming.md) for:

- adding, renaming, regrouping, or reviewing `describe(...)` and test-case blocks
- writing scenario names that read as clear verification sentences
- grouping repeated conditions or situations without duplicating function names

## Behavior and Implementation Details

See [behavior-and-implementation-details.md](./references/behavior-and-implementation-details.md) for:

- avoiding tests that overfit private helpers, dependency internals, callback mechanics, or call shapes
- keeping assertions focused on exported behavior from a caller's point of view
- deciding when an implementation detail is actually part of the public contract

## Fixtures, Fakes, and AHA

See [fixtures-fakes-and-aha.md](./references/fixtures-fakes-and-aha.md) for:

- creating fixtures, setup helpers, boundary fakes, mocks, spies, or shared constants
- choosing duplication over premature abstraction when test cases need local clarity
- keeping reusable test helpers obvious, narrow, and behavior-oriented

## Assertions, Snapshots, and Side Effects

See [assertions-snapshots-and-side-effects.md](./references/assertions-snapshots-and-side-effects.md) for:

- choosing assertions for values, async errors, side effects, and mock calls
- deciding when snapshots are appropriate and how to keep them focused
- verifying observable outcomes without relying on incidental implementation details

## Schemas and Types

See [schemas-and-types.md](./references/schemas-and-types.md) for:

- testing schemas, codecs, decoded response shapes, and collection/list response decoding
- handling type-only modules and compile-time contracts
- balancing runtime schema checks with compile-time type expectations

## Review Checklist

See [review-checklist.md](./references/review-checklist.md) for:

- implementation self-review or code review for Vitest unit tests
- checking structure, naming, fixtures, mocks, assertions, and scope
- reporting residual risk when unit tests cannot cover the behavior with enough confidence

## Project Defaults

These defaults are intentionally short. Follow the linked references for examples, edge cases, and review criteria.

**Guidelines:**

- MUST colocate Vitest tests next to their subject as `<name>.spec.ts(x)` (kebab-case).
- MUST import test APIs explicitly from `vitest` (`describe`, `it`, `expect`, `beforeEach`, …); do not rely on globals.
- MUST use `it(...)` for scenarios (not `test(...)`), and structure names as a behavior report:
  - `describe("<subject>")` groups by the exported contract under test.
  - **Callable subjects** (functions, methods) get a trailing `()`: `describe("buildDraft()")`, `describe("nextActorId()")`.
  - **React components** are written in angle brackets: `describe("<MoveComposer>")`, `describe("<MoveLog>")`.
  - **Non-callable** subjects (schemas, type/object contracts) get no suffix.
  - Nest shared conditions under `describe("when …")`; write `it(...)` names as behavior sentences ("returns…", "rejects…", "clears…"); do not repeat the subject in every `it`.
- SHOULD prefer manual fakes of the smallest boundary a unit calls over module mocks; do not mock the module under test or neighbouring pure helpers. Keep any mock near the imports it affects.
- MUST run unit tests through `npm run test` (Vitest) unless investigating a targeted failure.
- MUST run `npm run format`, `npm run lint`, and `npm run typecheck` after adding or changing unit tests.
- SHOULD prefer e2e tests when confidence depends on framework runtime wiring, the data layer, browser behavior, rendering, routing, or user-facing UI.

**Coverage and project-specific patterns:**

- MUST measure coverage with `npm run test:coverage` (V8 provider; thresholds ~95% for branch/function/line/statement). Only framework route entrypoints (`src/app/layout.tsx`, `src/app/page.tsx`) and spec files are excluded; every other module carries real branches worth covering.
- MUST assert the branch's **distinguishing observable output**, not merely that the element still renders — reaching a branch for the coverage number is necessary but not sufficient. A test that renders a conditional-highlight/state and only asserts `toBeInTheDocument()` would still pass if the branch were deleted; assert the difference (the toggled class/attribute, the changed text, the emitted call) plus a negative case where practical.
- MUST seed the zustand store directly via `useTrackerStore.setState({ players, captainIndex, moves, redoStack, hasHydrated })` and reset it in `afterEach`. For components that trigger IndexedDB rehydration on mount (e.g. `<TrackerApp>`), `vi.spyOn(useTrackerStore.persist, "rehydrate").mockResolvedValue(...)` in `beforeEach` so hydration can't clobber the seeded state.
- To cover the IndexedDB-backed storage adapter under jsdom (which has no `indexedDB`), mock `idb-keyval`, `vi.stubGlobal("indexedDB", {})`, `vi.resetModules()`, then `await import(...)` the module so it selects the backed branch (see `idb-storage.backed.spec.ts`).
- MUST query Radix primitives by their real roles: a `ToggleGroup` root is `radiogroup` (items are `radio`, selection reflected via `toBeChecked()`); a `Select` trigger is `combobox` but its **portaled listbox cannot be opened under jsdom** (`hasPointerCapture` is unimplemented), so assert Select-driven behavior from seeded state/props instead of opening it; `Dialog`/`AlertDialog` content is portaled yet reachable through `screen`.
- For branches only reachable through real browser behavior — CSS-animation close callbacks (Radix Presence unmounts synchronously under jsdom), or defensive guards the UI prevents — cover them with e2e instead and mark the unit-unreachable line with `/* v8 ignore next */` plus a one-line reason. Prefer deleting provably-dead code over ignoring it.
