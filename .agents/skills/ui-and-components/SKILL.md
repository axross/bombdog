---
name: ui-and-components
description: Use this skill when writing, reviewing, or refactoring React components and user-facing surfaces in bombdog. Covers the Next.js App Router Server/Client component boundary and when to add "use client", kebab-case file naming, the CSS Modules + `@layer components` + `@scope` styling pattern, `css`/`clsx` conventions, `className` passthrough, `data-testid`, the CSS layers/variables/globals split, next/image and next/font usage, and baseline accessibility. Use even when the user only mentions a component, a page, styling, "use client", "@scope", "@layer", "data-testid", or an accessibility concern.
---

# UI and Components

Apply this skill for any user-facing work in bombdog: React components, pages, layouts, and styling. The app uses the Next.js App Router (React 19) with CSS Modules.

## File Naming and Exports

- MUST name component files and folders in **kebab-case** (`move-composer/move-composer.tsx`), with the CSS Module sharing the base name (`move-composer.module.css`).
- MUST use named exports for components (export identifiers stay PascalCase, e.g. `MoveComposer`); reserve `export default` for Next.js route files (`page.tsx`, `layout.tsx`).
- MUST declare an explicit return type: `JSX.Element` (or `JSX.Element | null`) for Client Components, `Promise<JSX.Element>` for async Server Components.
- SHOULD type props with `ComponentProps<T> & { … }` for the root element and accept `className` plus spread `...props`.

## Server and Client Components

- MUST default to Server Components. Add `"use client"` at the top of a file only when the component needs state, effects, event handlers, browser-only APIs, or React context.
- MUST keep the `"use client"` boundary as low in the tree as possible — mark the small interactive leaf, not the whole page — so server-rendered content stays on the server.
- MUST NOT import server-only code (secrets, direct filesystem/network access, `server-only` modules) into a Client Component.
- SHOULD pass data down as serializable props from Server to Client Components rather than refetching on the client.

## Styling

Global CSS lives in three files under `src/app/`, imported in this order by `layout.tsx`:
`layers.css` (declares `@layer variables, base, components;`), `globals.css` (resets in `@layer base`),
and `variables.css` (design tokens in `@layer variables`, declared at zero specificity via
`:where(:root)`). Colour tokens are authored in **OKLCH** as Radix-style perceptual ramps (`--slate-*`,
`--blue-*`, `--amber-*`, `--red-*`, `--grass-*`; step 1 = lightest background … 12 = highest-contrast
text); high-chroma solids render in Display P3 on capable screens. Dark mode re-declares the ramp steps
under `:where(:root.dark)`, so the semantic tokens flip automatically.

- MUST style components with CSS Modules (`<component>.module.css`) imported as `import css from "./<component>.module.css"` (the identifier is `css`, not `styles`); there is no CSS framework.
- MUST wrap every module's rules in `@layer components { @scope (.<root>) { :where(:scope) { … } .child { … } } }`. `:where(:scope)` styles the component root at zero specificity so `className` overrides win.
- MUST give Radix-portaled content (Select/Dialog/AlertDialog `Content`, `Overlay`) its **own** `@scope` block, since the portal escapes the root's DOM subtree.
- MUST merge the component's own class with an incoming `className` via `clsx(css.root, className)` (from `clsx`); never join class names with template literals.
- MUST NOT set `position`, `margin`, or non-full `width`/`height` on a component's root element — pass those from the parent via `className` (page-level screen shells are the documented exception).
- MUST draw color, spacing, radius, and font values from the tokens in `variables.css`; do not hard-code them. Prefer logical properties (`margin-block`, `padding-inline`, `min-block-size`, `inset-inline-*`) and `@container` queries over `@media` for width-driven layout (`body` is a container).
- MUST NOT import another component's CSS Module.

## Motion and Transitions

Transitions exist to make state changes legible (a panel expanding, a sheet entering), not for decoration.

- MUST draw timing from the motion tokens in `variables.css` (`--motion`, `--motion-fast`, `--ease-standard`, `--ease-emphasized`); do not hard-code durations or easings.
- MUST honour `@media (prefers-reduced-motion: reduce)` by disabling or neutralising the transition/animation in the same module.
- SHOULD animate a collapsing/expanding region by transitioning a wrapper's `grid-template-rows` between `1fr` and `0fr` (inner element `overflow: hidden; min-block-size: 0`) so flex siblings reflow in step; keep the region mounted and mark it `inert` while collapsed. Delay a `visibility: hidden` on the inner (via `transition-delay: var(--motion)`) so clipped controls leave the a11y tree and stop being focusable once collapsed.
- SHOULD animate Radix-portaled surfaces (Dialog/AlertDialog `Content`/`Overlay`) with `@keyframes` keyed off `&[data-state="open"]` / `&[data-state="closed"]` — Radix keeps the node mounted for the exit animation. Bottom-sheet content slides via the `translate` property (matching the centring `translate`, e.g. `-50% 100%` → `-50% 0`); switch to a fade/zoom in the wide `@container` branch.
- MUST define such `@keyframes` inside the module's `@layer components` block: CSS Modules scope keyframe names per file, so `animation: <name>` resolves to the local definition (verified under Turbopack).

## Assets and Fonts

- SHOULD use `next/image` for raster images so sizing, lazy-loading, and optimization are handled; provide meaningful `alt` text.
- SHOULD load web fonts through `next/font` to avoid layout shift and external requests, following the scaffold's existing setup.

## Accessibility and Structure

- MUST use semantic elements (`button`, `a`, `nav`, `main`, headings in order) over generic `div`/`span` with handlers.
- MUST give interactive controls an accessible name and a visible focus state.
- MUST keep one `<h1>` per page and nest headings without skipping levels.
- SHOULD verify keyboard operability and focus order for any new interactive surface, and confirm layout holds across small and large viewports.

## Test Hooks

- MUST add `data-testid` (kebab-case, short, scope-relative) to meaningful/interactive elements so e2e can target them by test id; expose entity/state via extra `data-*` attributes (e.g. `data-seq`, `data-outcome`) instead of globally-unique ids.
- SHOULD accept `"data-testid"` as a prop and spread `...props` so callers can set it and it propagates to the root.

## Colocation and Tests

- MUST colocate a component, its `<component>.module.css`, and its `<component>.spec.tsx` in the same folder.
- SHOULD test rendered behavior and accessible roles/names via Testing Library rather than implementation details; see [Unit Test Guidelines](../unit-test-guidelines/SKILL.md).
- SHOULD cover user-facing flows with a Playwright spec under `e2e/tests/`; see [E2E Testing Guidelines](../e2e-testing-guidelines/SKILL.md).
