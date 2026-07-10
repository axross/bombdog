---
name: react-guidelines
description: Apply this skill when writing, placing, reviewing, or refactoring any React component or hook function in bombdog. Covers the two-tier design system (domain-agnostic src/components/primitives vs domain src/components/tracker) and the placement decision, the primitives import rule, the two-layer split of a domain control into a generic shell plus a thin domain wrapper, the existing component catalog, extending a primitive's styling via className at zero specificity, primitive promotion, the hooks/lib split for domain logic, kebab-case naming and named exports, the Server/Client boundary and "use client", the CSS Modules + @layer + @scope styling pattern, clsx, design tokens and ramp steps, motion and dialog enter/leave animations, next/image and next/font, baseline accessibility, data-testid test hooks, and colocated tests. Use for "where does this component go", "should this be a primitive", or any mention of a component, page, hook, styling, "use client", "@scope", "data-testid", or accessibility.
---

# React Guidelines

Apply this skill for any React work in bombdog: components, pages, layouts, hooks, and their styling. The app uses the Next.js App Router (React 19) with CSS Modules. It is the source of truth for both the component separation/composition strategy and the implementation mechanics; the project's UI-appearance conventions own which appearance treatment a surface gets (color roles, elevation, control selection, modal vs bottom sheet — consult them before styling a new component or state), and the project's project-structure guidelines own where the files live on disk.

The composition strategy in one sentence: **strictly domain-agnostic primitives compose upward into domain components, domain content enters only through wrapper components and hooks, and consumers extend primitives via `className` instead of re-declaring their styling.**

## Component Catalog

See [component-catalog.md](./references/component-catalog.md) for:

- the current primitive and domain-component inventory, with variants and sizes
- composing an existing control instead of re-implementing its look
- where to route a control that is missing, needs domain content, or needs a surface-specific look

## Tiers and Placement

See [tiers-and-placement.md](./references/tiers-and-placement.md) for:

- what qualifies a component for `primitives/` vs `tracker/`, with the placement decision procedure
- the strict primitives import rule and how to check it
- when a repeated pattern is promoted into a new primitive, and when a one-off stays local

## The Two-Layer Split

See [two-layer-split.md](./references/two-layer-split.md) for:

- splitting a domain-typed control into a generic shell primitive plus a thin domain wrapper
- worked examples: `SegmentedPicker`←`PlayerPicker`, `ToggleGrid`←`WirePad`, `Chip`←`WireChip`
- what each layer owns (mechanics vs value sets, glyphs, colour variants, orderings)
- when a domain control is left unsplit (`OutcomeToggle`, `RevealDialog`)

## Styling Composition

See [styling-composition.md](./references/styling-composition.md) for:

- extending a primitive from a consumer via `className` instead of re-declaring its rules
- why primitives declare variants at zero specificity, and how caller overrides win
- surface-specific extension examples (the two tab strips, the filter trigger over the ghost Button)
- keeping a consumer's CSS module down to layout, positioning, and disclosed overrides

## Domain Logic and Hooks

See [domain-logic-and-hooks.md](./references/domain-logic-and-hooks.md) for:

- deciding whether logic belongs in a pure `src/lib` module, a `src/hooks/` hook, or the component
- the bare-selector exception (when a direct `useTrackerStore` call is correct)
- worked examples: `use-move-draft` shared by composer and editor, `use-player-setup-form` leaving a render-only component
- keeping hooks and lib modules testable next to their specs

## Component Anatomy

See [component-anatomy.md](./references/component-anatomy.md) for:

- kebab-case file naming, named exports, and explicit return types
- typing props with `ComponentProps<T>` and passing through `className`
- defaulting to Server Components, when `"use client"` is justified, and what must not cross the boundary
- `data-testid` test hooks and `data-*` state attributes for e2e targeting
- colocating a component with its CSS module and unit spec

## CSS Modules Styling

See [css-modules-styling.md](./references/css-modules-styling.md) for:

- the global CSS trio (`layers.css`, `globals.css`, `variables.css`) and the token system
- the `@layer components` + `@scope` module pattern and `clsx` class merging
- which color-ramp step matches which element role
- what a component's root element may and may not set

## Motion and Transitions

See [motion-and-transitions.md](./references/motion-and-transitions.md) for:

- motion tokens, reduced-motion fallbacks, and collapse/expand animation
- enter and leave animations for Radix-portaled dialogs and overlays
- where `@keyframes` live in a CSS module

## Accessibility and Assets

See [accessibility-and-assets.md](./references/accessibility-and-assets.md) for:

- semantic elements, accessible names, focus states, and heading structure
- keyboard operability and viewport checks for new interactive surfaces
- `next/image` and `next/font` usage
