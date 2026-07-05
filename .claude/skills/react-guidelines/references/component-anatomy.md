# Component Anatomy

Apply this reference when creating a component file, naming its exports, typing its props, wiring test hooks, or deciding what sits next to it in its folder.

## File Naming and Exports

**Guidelines:**

- MUST name component files and folders in **kebab-case** (`move-composer/move-composer.tsx`), with the CSS Module sharing the base name (`move-composer.module.css`).
- MUST use named exports for components (export identifiers stay PascalCase, e.g. `MoveComposer`); reserve `export default` for Next.js route files (`page.tsx`, `layout.tsx`).
- MUST declare an explicit return type: `JSX.Element` (or `JSX.Element | null`) for Client Components, `Promise<JSX.Element>` for async Server Components.
- SHOULD type props with `ComponentProps<T> & { … }` for the root element and accept `className` plus spread `...props`.

## Test Hooks

**Guidelines:**

- MUST add `data-testid` (kebab-case, short, scope-relative) to meaningful/interactive elements so e2e can target them by test id; expose entity/state via extra `data-*` attributes (e.g. `data-seq`, `data-outcome`) instead of globally-unique ids.
- SHOULD accept `"data-testid"` as a prop and spread `...props` so callers can set it and it propagates to the root.

## Colocation and Tests

**Guidelines:**

- MUST colocate a component, its `<component>.module.css`, and its `<component>.spec.tsx` in the same folder.
- SHOULD test rendered behavior and accessible roles/names via Testing Library rather than implementation details; see [Unit Test Guidelines](../../unit-test-guidelines/SKILL.md).
- SHOULD cover user-facing flows with a Playwright spec under `e2e/tests/`; see [E2E Testing Guidelines](../../e2e-testing-guidelines/SKILL.md).
