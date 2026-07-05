---
name: component-composition
description: Apply this skill when creating a React component, deciding whether it belongs in src/components/primitives or src/components/tracker, splitting a domain control into a generic shell plus a domain wrapper, extending a primitive's styling from a consumer, extracting repeated UI into a new primitive, or moving domain logic out of a component into a hook or lib module. Covers the two-tier design system (strictly domain-agnostic primitives vs domain components), the primitives import rule, the two-layer split pattern (SegmentedPicker←PlayerPicker, ToggleGrid←WirePad, Chip←WireChip), className-extension styling composition at zero specificity, promotion criteria for new primitives, and the hooks/lib split for business logic. Use for "where does this component go", "should this be a primitive", "make this reusable", "extract a component", or any new control that mixes generic shape with game vocabulary.
---

# Component Composition

Apply this skill whenever you create, place, split, extend, or extract a React component in bombdog, or move business logic out of one. It is the source of truth for the project's component separation and composition strategy; [Project Structure](../project-structure/SKILL.md) owns only where the files live on disk, and [UI and Components](../ui-and-components/SKILL.md) owns implementation mechanics (naming, CSS Modules pattern, Server/Client boundaries, test hooks).

The strategy in one sentence: **strictly domain-agnostic primitives compose upward into domain components, domain content enters only through wrapper components and hooks, and consumers extend primitives via `className` instead of re-declaring their styling.**

## Tiers and Placement

See [tiers-and-placement.md](./references/tiers-and-placement.md) for:

- what qualifies a component for `primitives/` vs `tracker/`, with the placement decision procedure
- the strict primitives import rule and how to check it
- the current primitive and domain-component catalogs
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
