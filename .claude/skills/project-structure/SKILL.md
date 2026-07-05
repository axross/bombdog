---
name: project-structure
description: Use this skill when navigating the bombdog repository, locating a file, deciding where a new module/route/component/test belongs, or checking stack and directory conventions. Covers the top-level layout, the Next.js App Router structure under src/app, where unit tests and Playwright e2e tests live, the tooling stack (npm, Biome, Vitest, Playwright), and the agent-harness files under .claude. Use even when the user only mentions "where does X go", file placement, the folder layout, or the project's stack.
---

# Project Structure

Apply this skill to navigate bombdog and to place new files consistently. bombdog is a Next.js (App Router) + TypeScript web app.

## Stack

- **Runtime / framework:** Next.js 16 (App Router), React 19.
- **Language:** TypeScript (strict). Import alias `@/*` maps to `src/*`.
- **Package manager:** npm (`package-lock.json` is the source of truth). Node version pinned in `.nvmrc`.
- **Lint + format:** Biome (`biome.json`). Tab indentation, double quotes.
- **Unit tests:** Vitest + Testing Library (jsdom environment).
- **E2E tests:** Playwright (Chromium).
- **Styling:** CSS Modules (`*.module.css`). No CSS framework.

## Top-Level Layout

| Path | Owns |
|---|---|
| `src/app/` | App Router routes, `layout.tsx`, `page.tsx`, and the global CSS trio `layers.css` / `globals.css` / `variables.css` |
| `src/components/ui/<name>/` | Generic, prop-driven primitives (`button`, `bottom-sheet`, `select-field`, `wire-pad`, …), one kebab-case folder each, colocating `<name>.tsx`, `<name>.module.css`, and `<name>.spec.tsx` |
| `src/components/tracker/<name>/` | Domain compositions — components that read/write the tracker store or encode game rules — with the same colocation |
| `src/hooks/` | Reusable hook functions (`use-<name>.ts`) binding domain logic to React state + colocated `*.spec.ts(x)` |
| `src/lib/` | Non-UI application code (kebab-case: `tracker-store.ts`, `idb-storage.ts`, `game.ts`, `move-draft.ts`, `types.ts`) + colocated `*.spec.ts` |
| `e2e/tests/` | Playwright end-to-end specs (`*.test.ts`) |
| `e2e/helpers/` | Reusable e2e helpers (page setup, chained-locator shortcuts) |
| `public/` | Static assets served from the site root |
| `.claude/` | Claude Code harness binding (commands, hooks, settings) |
| `.claude/skills/` | Project skill library, routed from `AGENTS.md` |
| `biome.json`, `vitest.config.ts`, `playwright.config.ts`, `next.config.ts`, `tsconfig.json` | Tooling configuration |

## File Placement

New files follow fixed placement rules by kind — routes, components, non-UI modules, and their colocated tests each have a home.

**Guidelines:**

- MUST use **kebab-case** for all file and folder names (`move-composer/move-composer.tsx`).
- MUST place routes under `src/app/` following App Router conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, route segment folders).
- MUST place components in the tier that matches their coupling: generic, prop-driven primitives under `src/components/ui/<name>/`, domain compositions under `src/components/tracker/<name>/`, and non-UI modules under `src/lib/`.
- MUST NOT import `@/lib/tracker-store`, game-rule derivations, `@/lib/move-draft`, or anything under `components/tracker/` from a `components/ui/` module — ui-tier components stay prop-driven. Domain value types from `@/lib/types` and the formatting helpers `formatWire` / `wireLabel` are allowed.
- MUST place reusable hook functions under `src/hooks/` as `use-<name>.ts`; a component needing domain state or derivations consumes them through a hook (or a pure `src/lib` module) rather than inlining the logic.
- MUST colocate a **unit** test next to its subject as `<name>.spec.ts(x)`; Vitest picks up `src/**/*.{test,spec}.{ts,tsx}`.
- MUST place **end-to-end** specs under `e2e/tests/` as `<name>.test.ts` (Playwright `testDir` is `e2e/tests`) and shared e2e helpers under `e2e/helpers/`.
- MUST colocate a component's styles as `<name>.module.css` and import them as `css`.
- SHOULD use the `@/` alias for imports from `src/` rather than long relative paths.
