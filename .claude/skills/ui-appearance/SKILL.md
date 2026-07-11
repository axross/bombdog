---
name: ui-appearance
description: How any bombdog surface should look. Covers which color role to use (accent vs success/danger vs wire hues vs neutrals), borders/shadows/background fills and elevation, which control element fits a decision (segmented toggle, chip toggle-group, dropdown select, check-toggle, checkbox), modal dialog vs bottom sheet, how wire states are drawn (uncut/revealed/cut/selected), and how successful vs failed cuts are expressed.
when_to_use: Apply when deciding how a surface should look — before styling any new component or state, and when reviewing UI for appearance consistency, even if the user only mentions a color, a shadow, a dialog, a chip, a wire, or an outcome badge.
user-invocable: false
---

# UI Appearance

The design vocabulary for bombdog's UI: which appearance treatment each surface, control, and state gets. This skill owns the *decisions*; the project's React guidelines own the implementation mechanics (CSS Modules, `@scope`, ramp-step usage, motion/keyframe placement), and `src/app/variables.css` is the only home for token values.

## Color Roles

Every color in the app belongs to exactly one role. The ramps (see `variables.css`) map to meanings, not decoration:

| Role | Tokens | Used for |
| ---- | ------ | -------- |
| Neutral (slate) | `--surface*`, `--border*`, `--text*` | Chrome, cards, resting controls, text |
| Accent (blue) | `--accent`, `--accent-hover`, `--accent-contrast` | The single primary action of a surface; selection emphasis for **non-wire** choices (players, tabs, filter checks) |
| Success (grass) | `--success`, `--success-soft`, `--success-text` | Successful cut outcomes only |
| Danger (tomato) | `--danger*`, `--danger-tint` | Failed cut outcomes, destructive actions, invalid-field marking |
| Wire blue (sky) | `--wire-blue*` | Blue-wire identity only |
| Wire yellow (amber) | `--wire-yellow*` | Yellow-wire identity only |
| On-solid | `--on-solid` | Text/icons sitting on any solid step-9 fill (accent, success, danger) |

**Guidelines:**

- MUST give each screen or sheet at most one accent-solid primary action; secondary actions stay neutral (`--surface-3` + `--border`), and destructive triggers stay `--danger-text` on a neutral fill, filling solid danger only inside a confirm dialog.
- MUST reserve green/red (grass/tomato) for action outcomes, destructive actions, and invalid-input signals; MUST NOT use them to encode wire identity or wire state.
- MUST color wire-value UI with the wire hue tokens (sky for blue values, amber for yellow); MUST NOT use `--accent` for a wire-value choice, even a two-option one.
- MUST use `--on-solid` for text and icons on solid success/danger/accent fills; MUST NOT hard-code white or reuse `--accent-contrast` outside accent fills.
- MUST pick ramp steps by role per the step table in the project's React guidelines (css-modules-styling rules) (soft rest 3, hover 4, border 7, solid 9, text 11).

## Surfaces, Borders, Shadows

Elevation has a deliberate split — each floating layer type has one delineation language, and they do not mix:

| Surface kind | Treatment |
| ------------ | --------- |
| In-flow card / panel | `--surface-2` fill + 1px `--border` + `--radius`; no shadow |
| Anchored popover (select menu, dropdown menu) | `--surface-2` + 1px `--border` + `--shadow-popover`; no scrim |
| Modal surface (bottom sheet, dialog, confirm) | `--surface` + 1px `--border` under a `--scrim` overlay (with 2px backdrop blur); no shadow |

**Guidelines:**

- MUST NOT introduce new `box-shadow` values; the only sanctioned shadow is `--shadow-popover`, and only on anchored popovers.
- MUST dim every modal with the shared `--scrim` token on its overlay; MUST NOT re-declare an inline scrim `color-mix`.
- MUST use the radius roles: `--radius-sm` for controls and chips, `--radius` for cards and popovers, `--radius-lg` for modal surfaces; `50%` only for genuinely circular dots/radios.
- MUST derive hover fills from the adjacent ramp step, per the project's React guidelines (css-modules-styling rules) (never an ad-hoc `color-mix`).
- SHOULD reserve `--border-strong` for emphasized outlines: checkbox rests, the status strip's tiny copy squares, neutral row accents.

## Control Selection

Match the control to the shape of the decision, and reuse the existing component for it:

| Decision shape | Control |
| -------------- | ------- |
| 2–3 exclusive options that must stay visible | Segmented buttons (`aria-pressed`) — outcome toggle, cut-value picker |
| Pick wire value(s) | `WirePad` chip grid (Radix ToggleGroup) |
| Pick player(s) | `PlayerPicker` chips (+ `⋯` overflow menu for rare choices) |
| One choice from a list of ≥4 named options | `SelectField` dropdown |
| Multi-select filters | Check-toggle buttons (check-in-box + `aria-pressed`) |
| Plain boolean form field | Native checkbox with `accent-color` |
| Committing a destructive action | Centered `AlertDialog` confirm |

**Guidelines:**

- MUST reuse the existing control component for a decision shape instead of hand-rolling a lookalike (any wire-value choice renders `WirePad`).
- MUST express selection through Radix `data-state` on Radix controls and `aria-pressed` on plain buttons; MUST NOT add bespoke `selected` classes.
- MUST render a selected chip/segment as a solid fill (accent for non-wire choices, wire hue for wire values), not a border-only change.
- MUST size tap targets at ≥44px for primary-flow controls and ≥36px for compact toolbar triggers.
- MUST style disabled controls as `opacity: 0.5` with `cursor: not-allowed`; no other disabled opacities.

## Modal Dialogs vs Bottom Sheets

Two modal surface types exist, split by what the user is doing:

- **Any multi-field create/edit/filter flow** opens the shared `BottomSheet` component: a bottom sheet on narrow viewports, a centered dialog on wide ones, with drag-to-dismiss and depth-aware nesting.
- **Destructive confirmations** (reset, delete) use a compact centered `AlertDialog` — `min(92vw, 26rem)`, `--radius-lg` — whose confirming action is the only solid-danger button on screen.

**Guidelines:**

- MUST open form-like modal flows in the shared `BottomSheet`; MUST NOT hand-roll overlay/sheet chrome per component.
- MUST reserve `AlertDialog` for destructive commitments; a data-entry flow is never an `AlertDialog`.
- MUST give every modal overlay and content both enter and leave animations plus a reduced-motion fallback, per the project's React guidelines (motion-and-transitions rules).
- MUST order confirm actions as neutral Cancel then trailing solid-danger confirm.

## Wire Indicator States

Wire visuals are a layered language: **hue carries identity, fill carries knowledge, strikethrough/hollow carries cut** — each layer moves independently:

| Wire state | Treatment |
| ---------- | --------- |
| Picker chip at rest | Soft hue background (step 3) + hue border (step 7) + hue text (step 11) |
| Selected in a picker | Solid hue fill (step 9) + `--wire-*-contrast` text |
| Known / revealed / held (uncut) | Same solid hue fill as selected — "we know this wire" |
| In play, location unknown | Dashed neutral outline (`--border`; `--border-strong` for tiny glyphs) + muted text or transparent fill |
| Cut | Strikethrough on the wire number; copy squares hollow (`--surface-3` + `--border-strong`); never an outcome color |
| Unknown value ("?") | Neutral: `--surface-3`/`--border` at rest, solid `--text-muted` when selected |

**Guidelines:**

- MUST render passive known-wire indicators (status player cells, move-log chips, starting-info chips, revealed status copies) as solid hue fills.
- MUST render in-play-but-unlocated wire facts as dashed outlines, and cut wires with a non-color cue (strikethrough and/or hollow squares) so color is never the only channel.
- MUST NOT tint any wire state with success/danger colors; outcomes belong to moves, not wires.
- MUST keep the "?"/unknown value on the neutral treatment so it never masquerades as a real hue.

## Cut Outcome Treatment

Success/fail intensity is split by whether the element is interactive:

- **Interactive pressed state** (outcome toggle): solid `--success`/`--danger` fill, `--on-solid` text, Check/X icon.
- **Passive indicator** (move-log badge): soft tint (`--success-soft`/`--danger-soft`) + step-11 text (`--success-text`/`--danger-text`) + small Check/X icon.
- **Row edge accent** (move-log): 3px solid `--success`/`--danger`, `--border-strong` for neutral moves.

**Guidelines:**

- MUST use solid outcome fills only on interactive pressed states; passive read-only indicators use the soft-tint treatment.
- MUST pair every outcome color with a Check/X icon or explicit wording, so the outcome reads without color.
- MUST keep the status strip outcome-colorless; a cut is expressed through the wire-state layer (strikethrough + hollow), not green/red.
