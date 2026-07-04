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
| `src/components/<name>/` | UI components, one kebab-case folder each, colocating `<name>.tsx`, `<name>.module.css`, and `<name>.spec.tsx` |
| `src/lib/` | Non-UI application code (kebab-case: `tracker-store.ts`, `idb-storage.ts`, `game.ts`, `types.ts`) + colocated `*.spec.ts` |
| `e2e/tests/` | Playwright end-to-end specs (`*.test.ts`) |
| `e2e/helpers/` | Reusable e2e helpers (page setup, chained-locator shortcuts) |
| `public/` | Static assets served from the site root |
| `.claude/` | Claude Code harness binding (commands, hooks, settings) |
| `.claude/skills/` | Project skill library, routed from `AGENTS.md` |
| `biome.json`, `vitest.config.ts`, `playwright.config.ts`, `next.config.ts`, `tsconfig.json` | Tooling configuration |

## File Placement

- MUST use **kebab-case** for all file and folder names (`move-composer/move-composer.tsx`).
- MUST place routes under `src/app/` following App Router conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, route segment folders).
- MUST place shared components under `src/components/<name>/` and non-UI modules under `src/lib/`.
- MUST colocate a **unit** test next to its subject as `<name>.spec.ts(x)`; Vitest picks up `src/**/*.{test,spec}.{ts,tsx}`.
- MUST place **end-to-end** specs under `e2e/tests/` as `<name>.test.ts` (Playwright `testDir` is `e2e/tests`) and shared e2e helpers under `e2e/helpers/`.
- MUST colocate a component's styles as `<name>.module.css` and import them as `css`.
- SHOULD use the `@/` alias for imports from `src/` rather than long relative paths.
