# CSS Modules Styling

Apply this reference when styling any component: writing a CSS module, choosing tokens or ramp steps, or deciding what a root element may set.

## The Global CSS Trio

Global CSS lives in three files under `src/app/`, imported in this order by `layout.tsx`:
`layers.css` (declares `@layer variables, base, components;`), `globals.css` (resets in `@layer base`),
and `variables.css` (design tokens in `@layer variables`, declared at zero specificity via
`:where(:root)`). Colour tokens are authored in **OKLCH** as Radix-style perceptual ramps (`--slate-*`,
`--blue-*`, `--amber-*`, `--red-*`, `--grass-*`; step 1 = lightest background … 12 = highest-contrast
text); high-chroma solids render in Display P3 on capable screens. Dark mode re-declares the ramp steps
under `:where(:root.dark)`, so the semantic tokens flip automatically.

## Module Rules

**Guidelines:**

- MUST style components with CSS Modules (`<component>.module.css`) imported as `import css from "./<component>.module.css"` (the identifier is `css`, not `styles`); there is no CSS framework.
- MUST wrap every module's rules in `@layer components { @scope (.<root>) { :where(:scope) { … } .child { … } } }`. `:where(:scope)` styles the component root at zero specificity so `className` overrides win.
- MUST give Radix-portaled content (Select/Dialog/AlertDialog `Content`, `Overlay`) its **own** `@scope` block, since the portal escapes the root's DOM subtree.
- MUST merge the component's own class with an incoming `className` via `clsx(css.root, className)` (from `clsx`); never join class names with template literals.
- MUST NOT set `position`, `margin`, or non-full `width`/`height` on a component's root element — pass those from the parent via `className` (page-level screen shells are the documented exception).
- MUST NOT import another component's CSS Module.

## Tokens and Ramp Steps

**Guidelines:**

- MUST draw color, spacing, radius, and font values from the tokens in `variables.css`; do not hard-code them. Prefer logical properties (`margin-block`, `padding-inline`, `min-block-size`, `inset-inline-*`) and `@container` queries over `@media` for width-driven layout (`body` is a container).
- MUST pick the color-ramp step that matches the element's role, per the Radix scale: **1** app background, **2** subtle background, **3** UI-element background (rest), **4** hovered UI-element background, **5** active/selected UI-element background, **6** subtle borders/separators, **7** interactive element borders & focus rings, **8** hovered element border, **9** solid fill, **10** hovered solid fill, **11** low-contrast (muted) text, **12** high-contrast text. A tinted control follows rest **3** → hover **4** → selected solid **9**; do not use a hover step (4) as a rest background. Derive hover/active from an adjacent step, not an ad-hoc `color-mix`.
