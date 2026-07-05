# Styling Composition

Apply this reference when a consumer needs a primitive to look slightly different on its surface, or when reviewing whether a component's CSS module re-declares styling a primitive already provides.

## Zero-Specificity Primitives, Winning Callers

Primitives declare their base, variant, and size rules at **zero specificity** — `:where(:scope)` roots and `&:where(.variant)` selectors inside their CSS module. Any class a caller adds via `className` therefore wins with an ordinary `(0,1,0)` rule, with no ordering dependence between modules.

```css
/* primitives/button/button.module.css */
&:where(.primary) {
	background-color: var(--accent);
	/* … zero specificity: any caller class outranks this */
}
```

```css
/* tracker/player-setup/player-setup.module.css */
/* On top of the shared primary Button: the screen's hero call-to-action is
   taller and rounder than an in-form control. */
.start {
	min-block-size: 52px;
	border: none;
	border-radius: var(--radius);
	font-size: 1.05rem;
	font-weight: 700;
}
```

When a caller must beat a primitive's *stateful* rule (hover, active), it repeats the state in its own selector so specificity — not module order — decides:

```css
/* tracker/move-filter/move-filter.module.css — outranks the ghost hover recolour */
:where(:scope).triggerActive,
:where(:scope).triggerActive:hover {
	color: var(--accent);
	border-color: var(--accent);
}
```

## Extension, Not Re-Declaration

A consumer's CSS module holds three things only: **layout/positioning** (flex sizing, absolute pinning, grid placement — which primitives never set on their roots), **surface-specific extensions** over a primitive (the hero Button above; the tab strips' per-surface sizing), and **domain variant classes** a wrapper feeds into a primitive's option/className slots (wire colours). Everything else means either a missing primitive or a rule that belongs in one.

**Good Examples:**

> `starting-info`'s `.edit` sets only `position: absolute` + inset — the control itself is `<Button variant="ghost" size="icon-sm">`.

> The app shell's `.tab` sets only `padding-inline` and `font-size`; the underline idiom, colors, and states come from `TabsTrigger`.

**Bad Example:**

> A tracker module declaring `min-block-size: 44px; background-color: var(--surface-3); border-radius: var(--radius-sm)` on its own `.saveButton` — that is `Button variant="secondary"` re-implemented.

**Guidelines:**

- MUST compose the existing primitive and extend via `className` instead of re-declaring any control styling a primitive provides.
- MUST declare a new primitive's base, variants, and sizes at zero specificity (`:where(:scope)`, `&:where(.variant)`) so caller extensions win without `!important` or module-order luck.
- MUST repeat the state selector (`.x:hover`, `.x[data-state="active"]`) in a caller rule that needs to outrank a primitive's stateful rule.
- MUST keep positioning, margins, and non-full sizing out of primitive roots — callers own placement via `className` (per [UI and Components](../../ui-and-components/SKILL.md)).
- MUST disclose any pixel-level normalization in the PR description when unifying drifted duplicates into one primitive (e.g. the 40px seat name input joining the 44px control height); silent visual changes are review findings.
- SHOULD add a one-line comment above a caller extension naming the primitive it extends ("On top of the shared primary Button: …"), so the reader knows the rest of the styling lives elsewhere.
- SHOULD expose per-instance knobs as CSS custom properties with defaults (e.g. `--toggle-grid-columns`) when a primitive has one genuinely variable dimension, instead of a prop that injects style.
