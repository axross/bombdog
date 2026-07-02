# bombdog

A **Bomb Busters move tracker** — a phone-first companion for the board game
[Bomb Busters](https://boardgamegeek.com/boardgame/413246/bomb-busters). Log every
player's turn (dual cut, solo cut, detectors, equipment) with a running
history that persists in the browser until you reset. Built with
[Next.js](https://nextjs.org) (App Router) and TypeScript.

## What it does

- Configure the number of players (2–5), their names, and the Captain.
- Log each move with the acting player, target player, wire value(s), and outcome.
- See the full history (oldest → newest) above the composer.
- **Undo/redo** as a stack, and **edit any past move** in place to correct it.
- State is stored in **IndexedDB** (via zustand `persist`) and survives reloads
  until you **Reset**.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (strict), path alias `@/*` → `src/*`
- **Radix UI** primitives, styled with **CSS Modules** (`@layer` + `@scope`) and **OKLCH / Display-P3** color tokens (no Tailwind)
- **zustand** (+ `persist`) with **idb-keyval** for IndexedDB persistence
- **Biome** — linting + formatting
- **Vitest** + **Testing Library** — unit tests
- **Playwright** — end-to-end tests
- **npm** for package management (Node version pinned in `.nvmrc`)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

The app is a client-rendered Next.js app and deploys to Vercel with zero extra
configuration. Import the GitHub repo at [vercel.com/new](https://vercel.com/new)
(**Import Git Repository → `axross/bombdog`**); the default framework preset and
build settings work as-is, and pushes then deploy automatically.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run format` | Format with Biome |
| `npm run lint` | Lint (and check formatting) with Biome |
| `npm run lint:fix` | Lint + auto-fix and format |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run test` / `npm run test:unit` | Run Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Run Playwright e2e tests |

### Running e2e tests

Playwright is configured in `playwright.config.ts` and starts the dev server automatically. Specs live in `e2e/`.

```bash
npm run test:e2e
```

If you need to point Playwright at a system-provided Chromium instead of its managed download, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to the browser binary.

## Project Layout

- `src/app/` — App Router routes, layout, and global styles
- `src/components/` — UI components (each with its `*.module.css` and `*.test.tsx`)
- `src/lib/` — domain types, the zustand store, IndexedDB storage adapter, helpers
- `e2e/` — Playwright specs
- `public/` — static assets
- `AGENTS.md` + `.agents/skills/` — agent working agreement and skill index
- `.claude/` — Claude Code harness (hooks + settings)

## Working with AI agents

This repo ships an [`AGENTS.md`](./AGENTS.md)-driven skill system (adapted from
[axross/repo-agents](https://github.com/axross/repo-agents)). `AGENTS.md` is the
routing index; detailed conventions live under `.agents/skills/`. Claude Code
loads it via [`CLAUDE.md`](./CLAUDE.md), and the hooks in `.claude/` provision
the toolchain, format on edit, and run lint + unit tests before a task
completes.
