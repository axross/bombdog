# Component Catalog

Apply this reference before writing any new control markup: every control the app needs likely already exists, and re-implementing one's look is a review finding.

## The Inventory

**From `src/components/primitives/`:**

| Primitive | Notes |
| --- | --- |
| `Button` | variants `primary` / `secondary` / `danger` / `danger-ghost` / `ghost`; sizes `md` / `sm` / `compact` / `icon` / `icon-sm` |
| `ConfirmDialog` | centered destructive confirmations |
| `BottomSheet` | form-like modals |
| `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` | tab strips |
| `SelectField` | dropdown select |
| `SegmentedPicker` | one-tap segmented row with overflow menu |
| `ToggleGrid` | string-valued toggle cell grid |
| `Input` | text input |
| `Checkbox` | compact labelled box |
| `CheckToggle` | full-width toggle row |
| `RadioGroup` / `RadioGroupItem` | radio selection |
| `FieldLabel`, `FieldHighlight` | form field chrome |
| `Chip`, `Badge` | small value/status markers |
| `Spinner`, `EmptyState` | loading and empty surfaces |

**From `src/components/tracker/`:** `WirePad` (the one wire-value picker), `WireChip`, `PlayerPicker`, `OutcomeToggle`.

**Guidelines:**

- MUST compose these existing components instead of re-implementing their look.
- MUST route a needed control that is missing, needs domain content, or needs to look different on one surface through [tiers-and-placement.md](./tiers-and-placement.md), [two-layer-split.md](./two-layer-split.md), and [styling-composition.md](./styling-composition.md) — do not inline a new variant.
