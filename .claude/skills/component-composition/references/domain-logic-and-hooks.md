# Domain Logic and Hooks

Apply this reference when a component is about to grow domain logic inline — store selectors with derivations, game-rule orchestration, multi-field form state — or when reviewing where extracted logic should live.

## The Three Homes for Logic

Logic reaches a component through one of three layers, chosen by what the logic needs:

| Layer | Choose when | Examples |
| --- | --- | --- |
| Pure `src/lib` module | The rule needs no React — it is a function of its inputs | `game.ts` derivations, `move-draft.ts` (`buildDraft`, `invalidFields`), `id.ts` |
| `src/hooks/use-<name>.ts` | The logic binds domain rules or store data to React state/memoization | `use-move-draft`, `use-wire-status`, `use-player-setup-form` |
| The component | Pure UI state with no domain meaning | an `open` flag, a scroll-on-grow effect, drag gesture math |

A hook is usually a thin binding: the actual rules stay pure in `src/lib`, and the hook adds `useState`/`useMemo`/store subscription. `use-move-draft` owns fields/type/nudge state but delegates every validity decision to `buildDraft`/`invalidFields`.

## Worked Examples

**Shared state machine — `use-move-draft`:** the composer (add) and the editor (correct) both need draft fields, the built draft, and validate-on-press flagging. The hook owns that machine once; the composer keeps only what differs (the screen-reader announcement copy, the sheet's `open` flag), and the editor uses the same hook with a fixed type.

**Render-only component — `use-player-setup-form`:** the setup screen's count/names/Captain/info-token state, clamping, seeding from the previous roster, and the `start()` roster assembly all live in the hook. `PlayerSetup` renders `form.*` and nothing else — the component is now reusable markup and the state machine is testable through either layer.

**Bare-selector exception:** `ResetButton` calls `useTrackerStore((s) => s.reset)` directly. A hook that merely renames one selector or action adds indirection without reuse — leave those direct.

**Guidelines:**

- MUST move domain logic out of a component before it grows inline: store selectors combined with derivations, game-rule orchestration, and multi-field form state all leave the component.
- MUST put the rule itself in a pure `src/lib` module whenever it can be a plain function, and keep the hook to React binding (state, memoization, store subscription).
- MUST share one hook between surfaces that run the same state machine (composer + editor share `use-move-draft`) rather than duplicating the machine per surface.
- MUST NOT wrap a bare store selector or action in a hook; direct `useTrackerStore` calls are correct until derivation or orchestration appears.
- MUST keep pure UI state — `open` flags, scroll effects, gesture math, animation gating — in the component; it is not domain logic.
- MUST colocate a spec with any hook that carries real logic (`use-move-draft.spec.tsx`); thin memoization hooks (`use-filtered-moves`, `use-wire-status`) MAY stay covered through their consumers' specs.
- SHOULD name hooks for the domain capability (`use-next-actor`, `use-wire-status`), not the implementation (`use-memoized-filter`).
