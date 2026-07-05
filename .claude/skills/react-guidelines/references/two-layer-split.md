# The Two-Layer Split

Apply this reference when a control needs domain typing, domain values, or domain vocabulary, but its interaction shape (a segmented row, a toggle grid, a chip) is generic.

## The Pattern

Split the control into two components in two tiers. The **primitive** owns the control mechanics and shape; the **wrapper** owns everything the game defines:

| Layer | Owns | Example responsibilities |
| --- | --- | --- |
| Primitive (`primitives/`) | Selection semantics, keyboard/ARIA behavior, layout shell, base styling | single vs multi mode, repeat-tap re-commit, max-cap with oldest-drop, the ⋯ overflow menu, the grid/row layout |
| Wrapper (`tracker/`) | The domain projected onto the primitive's generic props | value sets, glyphs and accessible names, colour variants, orderings, string↔value mapping |

The wrapper is *thin*: it maps domain data to the primitive's option shape and back, and adds nothing behavioral.

## Worked Example: ToggleGrid ← WirePad

`ToggleGrid` knows only string-valued cells; `WirePad` projects the wire domain onto them:

```tsx
// tracker/wire-pad/wire-pad.tsx — the wrapper owns the domain
const option = (value: WireValueOrUnknown, variant?: string): ToggleGridOption => ({
	value: toKey(value),                       // string↔value mapping
	label: formatWire(value),                  // glyph
	ariaLabel: wireLabel(value),               // accessible name
	className: clsx(css.wire, variant),        // wire colour variants
	"data-testid": `${itemTestIdPrefix}-${toKey(value)}`,
});

const options = [
	...BLUE_WIRE_VALUES.map((n) => option(n)), // the domain value set
	...(blueOnly ? [] : [option("yellow", css.yellow)]),
	...(allowUnknown ? [option("unknown", css.unknown)] : []),
];
```

The single/multi discriminated union, the repeat-tap re-commit rule, and the multi cap all live in `ToggleGrid`; `wire-pad.module.css` holds only the wire colour classes.

## Worked Example: SegmentedPicker ← PlayerPicker

`PlayerPicker` takes the roster (`Player[]`) directly and owns the domain mapping — seat/play ordering and the rare self-target folded into the ⋯ overflow menu with a "(self)" label — then renders through `SegmentedPicker`, which owns the one-tap row, the multi mode, and the overflow-menu mechanics:

```tsx
// tracker/player-picker/player-picker.tsx — domain mapping only
const ordered =
	foldSelfId === undefined ? players : targetPlayerOrder(players, foldSelfId);
const rowOptions = ordered.filter((p) => p.id !== foldSelfId).map(toOption);
const menuOptions = ordered
	.filter((p) => p.id === foldSelfId)
	.map((p) => ({ value: p.id, label: `${p.name} (self)` }));
```

Consumers say `players={players}` and `foldSelfId={fields.actorId}` — the mapping is not their concern (it used to live inline in `move-form`).

## When Not to Split

`OutcomeToggle` and `RevealDialog` moved to `tracker/` whole. Their shells are already compositions of primitives (a fieldset with two toggle buttons; a `BottomSheet` around a `WirePad`), and their remaining substance — success/fail semantics, the fail-opens-reveal flow — *is* the domain. A split would leave an empty primitive with one consumer.

**Guidelines:**

- MUST split when a primitive would otherwise need a domain import or domain vocabulary to exist.
- MUST keep every domain fact — value sets, glyphs, labels, colour variants, orderings, id mappings — in the wrapper, and every interaction rule — selection semantics, caps, menus, keyboard behavior — in the primitive.
- MUST give the wrapper a domain-first API (`players: Player[]`, `value: WireValueOrUnknown`), not a pass-through of the primitive's generic options; the wrapper exists to own that mapping.
- MUST NOT split when the leftover shell would be a single-consumer primitive with no generic behavior of its own; move the control to `tracker/` whole instead.
- MUST preserve the pre-split DOM roles, accessible names, and `data-testid`s exactly; the e2e suite is the contract that the split changed nothing.
- SHOULD name the primitive for its interaction shape (`segmented-picker`, `toggle-grid`, `chip`) and the wrapper for its domain concept (`player-picker`, `wire-pad`, `wire-chip`).
