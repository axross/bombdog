# Tiers and Placement

Apply this reference when placing a new component, auditing an existing one, or deciding whether a repeated pattern deserves a new primitive.

## The Two Tiers

`src/components` has exactly two tiers. The boundary is **domain knowledge**, not component size or statefulness:

| Tier | Holds | Knows about |
| --- | --- | --- |
| `src/components/primitives/<name>/` | Strictly domain-agnostic building blocks, named after the common design-system vocabulary (shadcn/ui, Radix Primitives): `button`, `tabs`, `input`, `checkbox`, `radio-group`, `select-field`, `segmented-picker`, `toggle-grid`, `check-toggle`, `chip`, `badge`, `spinner`, `empty-state`, `field-label`, `field-highlight`, `bottom-sheet`, `confirm-dialog` | Nothing about the game. No store, no domain types, no game rules, no domain vocabulary — not even in prop names or doc comments |
| `src/components/tracker/<name>/` | Domain components: store/game-rule compositions (`move-composer`, `status-panel`, …) **and** thin domain wrappers over primitives (`wire-pad`, `wire-chip`, `player-picker`, `outcome-toggle`, `reveal-dialog`) | Players, wires, moves, outcomes — the game |

**Guidelines:**

- MUST place a component that never mentions the game — in imports, prop types, prop names, or copy defaults — under `primitives/`.
- MUST place everything else under `tracker/`, including prop-driven components whose *concept* is domain-specific (a wire pad is domain even though it never touches the store).
- MUST NOT create a third tier or nest components inside each other's folders; composition is expressed through imports, not directory depth.
- MUST name primitives after the mainstream design-system vocabulary (shadcn/ui, Radix Primitives) when a matching concept exists, so the catalog stays recognizable.

## The Primitives Import Rule

The tier boundary is enforced by imports. A primitive that imports domain code stops being reusable and silently couples the design system to the game.

**Allowed in `primitives/`:** `react`, `radix-ui`, `lucide-react`, `clsx`, sibling `primitives/` modules, its own CSS module.

**Forbidden in `primitives/`:** anything under `@/lib` (types, store, game rules, `move-draft`, …) and anything under `components/tracker/`.

Check it the way reviews do:

```sh
grep -rn "@/lib\|components/tracker" src/components/primitives --include="*.tsx"
```

**Guidelines:**

- MUST NOT import anything from `@/lib` or `components/tracker/` in a `components/primitives/` module — no exceptions, including type-only imports.
- MUST split a control instead of weakening the rule when it needs domain typing or content: the generic shell stays a primitive and a `tracker/` wrapper supplies the domain (see [two-layer-split.md](./two-layer-split.md)).
- MUST let `tracker/` components import freely from `primitives/`, `@/lib`, `@/hooks`, and each other.
- SHOULD run the grep above after touching anything under `primitives/`.

## Placement Decision Procedure

For a new component, walk this order:

1. Is an existing primitive or wrapper already this control? **Compose it** — do not re-create it.
2. Does it read/write the store, or orchestrate a flow across controls? → `tracker/` composition (with logic in a hook, per [domain-logic-and-hooks.md](./domain-logic-and-hooks.md)).
3. Is it a control whose *shape* is generic but whose values/labels/colours are game concepts? → **two-layer split**: primitive shell + `tracker/` wrapper.
4. Is it fully generic? → `primitives/`, named per the design-system vocabulary.
5. Is it a one-off arrangement of the above? → keep it inside its parent component (a local sub-component or plain JSX), not a new folder.

**Guidelines:**

- MUST check the existing catalogs (this file and the wrappers list) before writing any new control markup.
- MUST route a component that fails step 2 or 3 into `tracker/`; only step 4 earns `primitives/`.
- SHOULD keep one-off arrangements local until a second consumer appears.

## Promotion: When a Pattern Becomes a Primitive

A pattern earns a primitive when it repeats across components, or when it is a recognized design-system concept that a domain control is carrying inline.

**Examples from this codebase:**

> `Button` was promoted after near-identical button CSS appeared in eight modules — four primary, six secondary, and duplicated danger variants.

> `FieldLabel` was promoted after the same three-declaration label rule appeared in six modules.

> The X-or-Y-Ray cut-value picker in `move-form` was **not** promoted: it is a wire-palette control with a single consumer, so it stays local JSX.

**Guidelines:**

- MUST promote a pattern once it is duplicated across two or more components.
- SHOULD promote a single-consumer pattern only when it is a standard design-system concept (e.g. `Spinner`, `EmptyState`) whose extraction removes inline generic UI from a domain component.
- MUST NOT build a speculative primitive for a pattern with zero current consumers.
- MUST, when unifying duplicates, either preserve each duplicate's exact appearance via caller extensions or normalize the drift deliberately and disclose the pixel-level change in the PR (see [styling-composition.md](./styling-composition.md)).
- MUST update the catalog list in [UI and Components](../../ui-and-components/SKILL.md) and this file's tier table when a primitive is added, renamed, or removed.
