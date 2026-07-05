# Motion and Transitions

Apply this reference when adding, changing, or reviewing any transition or animation. Transitions exist to make state changes legible (a panel expanding, a sheet entering), not for decoration.

**Guidelines:**

- MUST draw timing from the motion tokens in `variables.css` (`--motion`, `--motion-fast`, `--ease-standard`, `--ease-emphasized`); do not hard-code durations or easings.
- MUST honour `@media (prefers-reduced-motion: reduce)` by disabling or neutralising the transition/animation in the same module.
- SHOULD animate a collapsing/expanding region by transitioning a wrapper's `grid-template-rows` between `1fr` and `0fr` (inner element `overflow: hidden; min-block-size: 0`) so flex siblings reflow in step; keep the region mounted and mark it `inert` while collapsed. Delay a `visibility: hidden` on the inner (via `transition-delay: var(--motion)`) so clipped controls leave the a11y tree and stop being focusable once collapsed.
- MUST give every Radix-portaled surface (Dialog/AlertDialog `Content` **and** `Overlay`) **both** an enter and a leave animation, via `@keyframes` keyed off `&[data-state="open"]` / `&[data-state="closed"]` — a modal that pops in or vanishes with no motion is a UX defect, not a nicety. Radix keeps the node mounted for the exit animation, so the `closed` state is what plays it; omitting it silently drops the leave transition. Bottom-sheet content slides via the `translate` property (matching the centring `translate`, e.g. `-50% 100%` → `-50% 0`); switch to a fade/zoom in the wide `@container` branch.
- MUST NOT ship a new dialog/overlay by copying a static one (e.g. an un-animated confirmation) without adding these transitions: mirroring an existing modal's markup does not inherit its motion, and a nested confirmation needs its own `open`/`closed` keyframes just like the surface it sits over. Reuse the module's existing overlay/dialog keyframes when the new surface matches (a centered confirmation over the editor reuses `dialog-in`/`dialog-out` and `overlay-in`/`overlay-out`).
- MUST define such `@keyframes` inside the module's `@layer components` block: CSS Modules scope keyframe names per file, so `animation: <name>` resolves to the local definition (verified under Turbopack).
