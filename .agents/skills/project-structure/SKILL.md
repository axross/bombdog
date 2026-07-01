---
name: project-structure
description: Use this skill when navigating the bombdog repository, locating a file, deciding where a new module/route/component/test belongs, or checking stack and directory conventions. Covers the top-level layout, the Next.js App Router structure under src/app, where unit tests and Playwright e2e tests live, the tooling stack (npm, Biome, Vitest, Playwright), and the agent-harness files under .claude and .agents. Use even when the user only mentions "where does X go", file placement, the folder layout, or the project's stack.
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
| `src/app/` | App Router routes, layouts, pages, and colocated component/CSS/test files |
| `src/` | Non-route application code (shared components, lib, utilities) as it grows |
| `e2e/` | Playwright end-to-end specs (`*.spec.ts`) |
| `public/` | Static assets served from the site root |
| `.agents/skills/` | Agent-agnostic skill core routed from `AGENTS.md` |
| `.claude/` | Claude Code harness binding (hooks + settings) |
| `biome.json`, `vitest.config.ts`, `playwright.config.ts`, `next.config.ts`, `tsconfig.json` | Tooling configuration |

## File Placement

- MUST place routes under `src/app/` following App Router conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, route segment folders).
- MUST colocate a unit test next to its subject as `<name>.test.ts(x)`; Vitest picks up `src/**/*.{test,spec}.{ts,tsx}`.
- MUST place end-to-end specs under `e2e/` as `<name>.spec.ts`; Playwright's `testDir` is `e2e/`.
- MUST colocate a component's styles as `<Component>.module.css` and import them as a module.
- SHOULD use the `@/` alias for imports from `src/` rather than long relative paths.
- SHOULD keep shared, non-route code out of `src/app/`; introduce a sibling folder under `src/` (e.g. `src/components`, `src/lib`) when the first reusable module appears, and record the convention here.
