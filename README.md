# bombdog

A [Next.js](https://nextjs.org) (App Router) web app written in TypeScript. Early-stage scaffold.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (strict), path alias `@/*` → `src/*`
- **Biome** — linting + formatting
- **Vitest** + **Testing Library** — unit tests
- **Playwright** — end-to-end tests
- **CSS Modules** for styling
- **npm** for package management (Node version pinned in `.nvmrc`)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Edit `src/app/page.tsx` and the page hot-reloads.

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

- `src/app/` — App Router routes, layouts, and pages
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
