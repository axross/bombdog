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
- `.claude/` — Claude Code harness (hooks, settings, and slash commands)
- `.github/workflows/` — CI (`merge-checks.yaml`) and the automated reviewer (`claude-review.yaml`)

## Working with AI agents

This repo ships an [`AGENTS.md`](./AGENTS.md)-driven skill system (adapted from
[axross/repo-agents](https://github.com/axross/repo-agents)). `AGENTS.md` is the
routing index; detailed conventions live under `.agents/skills/`. Claude Code
loads it via [`CLAUDE.md`](./CLAUDE.md), and the hooks in `.claude/` provision
the toolchain, format on edit, and run lint + unit tests before a task
completes.

### Slash commands

Two Claude Code slash commands (in [`.claude/commands/`](./.claude/commands)) drive delivery:

- **`/address <issue | pull request | prompt>`** — takes one unit of work from intake to a review-ready pull request in a single continuing session: plan → implement → request an independent review → respond to it. It polls CI and the review autonomously (via `send_later`, capped at 2 hours) and ends the turn at every human-gated decision; resume a paused run with **`/address continue`**. See [`.claude/commands/address.md`](./.claude/commands/address.md).
- **`/review <pull request | ref-range | (empty)>`** — a comprehensive review against this repo's [Code Review Guideline](./.agents/skills/code-review-guideline/SKILL.md). It is the single source of truth for how review is done here: run it ad-hoc, and the CI reviewer invokes the same command. See [`.claude/commands/review.md`](./.claude/commands/review.md).

### Automated code review

[`.github/workflows/claude-review.yaml`](./.github/workflows/claude-review.yaml) runs an **independent** review — a separate Claude Code session on a GitHub runner, under a bot identity distinct from the author — whenever a trusted user comments **`@claude review`** on a pull request. It runs the official `code-review` plugin — the same practice `/review` runs locally — and posts findings as a single **COMMENT**-type GitHub review (inline comments anchored to the diff, plus a summary). It never approves or requests changes — GitHub rejects those from a pull request's own author — and never leaves loose conversation comments.

Review **policy** — severity calibration, skip rules, repo-specific checks, and reporting format — lives in [`REVIEW.md`](./REVIEW.md) at the repository root. It's the same portable, review-only file that managed [Code Review](https://code.claude.com/docs/en/code-review) reads natively; the self-hosted workflow and `/review` bootstrap it via a system prompt, and the review methodology stays in [`code-review-guideline`](./.agents/skills/code-review-guideline/SKILL.md).

Conventions the agents follow:

- Findings are posted as a GitHub review, tagged by severity with `file:line` evidence and a concrete fix.
- When a commit resolves a review comment, the agent replies `Resolved in <short-hash>` with a one-line summary and resolves the thread.
- The reviewer is advisory: it does not block merges — merging stays a human decision.

**One-time setup** to enable the reviewer (repo admin):

1. Install the [Claude GitHub App](https://github.com/apps/claude) on the repository.
2. Run `claude setup-token` and add the output as the repository secret `CLAUDE_CODE_OAUTH_TOKEN` (reviews run on your Claude subscription).

> `issue_comment` workflows run only from the default branch, so the reviewer starts firing on pull requests once `claude-review.yaml` is on `main`.
