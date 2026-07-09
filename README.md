# bombdog

A **Bomb Busters move tracker** — a phone-first companion for the board game
[Bomb Busters](https://boardgamegeek.com/boardgame/413246/bomb-busters). Log
every player's turn (dual cut, solo cut, detectors, equipment) with a running
history that persists in the browser until you reset. It runs entirely in the
browser with no backend — state lives in IndexedDB — so a group can share one
phone to track a game.

## What it does

- Configure the number of players (2–5), their names, and the Captain.
- Log each move with the acting player, target player, wire value(s), and outcome.
- See the full history (oldest → newest) above the composer.
- **Undo/redo** as a stack, and **edit any past move** in place to correct it.
- State is stored in **IndexedDB** (via zustand `persist`) and survives reloads
  until you **Reset**.

## Tech stack

| Area | Tool |
| ---- | ---- |
| Language | TypeScript (strict), path alias `@/*` → `src/*` |
| App framework / runtime | Next.js 16 (App Router) + React 19 |
| Package manager | npm (Node version pinned in `.nvmrc`) |
| Linting & formatting | Biome |
| Unit tests | Vitest + Testing Library |
| E2E tests | Playwright |
| State & persistence | zustand (+ `persist`) with `idb-keyval` for IndexedDB |
| UI & styling | Radix UI primitives, CSS Modules (`@layer` + `@scope`), OKLCH / Display-P3 color tokens (no Tailwind), `lucide-react` icons |
| Hosting | Vercel |

## Getting started

Requires Node.js as pinned in [`.nvmrc`](./.nvmrc) (`nvm use` picks it up).

1. Install dependencies: `npm install`
2. Start developing: `npm run dev`, then open [http://localhost:3000](http://localhost:3000)
3. Production build and start: `npm run build`, then `npm run start`

## Development workflow

Development in this repository is agent-assisted via
[Claude Code](https://claude.com/claude-code). The working agreement lives in
[`AGENTS.md`](./AGENTS.md) (loaded through [`CLAUDE.md`](./CLAUDE.md)) and routes
to the detailed skills under [`.claude/skills/`](./.claude/skills) (adapted from
[axross/repo-agents](https://github.com/axross/repo-agents)). Human and agent
contributors follow the same loop: plan → implement → self-review → verify →
report. The hooks in [`.claude/`](./.claude) provision the toolchain, format on
edit, and run lint + unit tests before a task completes.

Three Claude Code slash commands (in [`.claude/commands/`](./.claude/commands))
drive delivery:

### `/address` — deliver a unit of work end-to-end

[`/address`](./.claude/commands/address.md) is the main delivery entry point.
It takes one unit of work — a GitHub issue, a pull request, or a free-form
prompt — from intake to a merge-ready pull request in a single continuing
session:

1. **Plan** — reads the issue and its thread, asks you the product and scope
   questions the spec leaves open, and rewrites the issue body into a
   reviewable plan with acceptance criteria.
2. **Code + verify** — implements on an agent-namespaced branch, runs the
   checks the changed surface requires, and self-reviews the diff.
3. **Independent review** — opens a draft pull request and requests the CI
   reviewer, a separate bot session, so the code's author never certifies its
   own work.
4. **Address** — fixes review findings and CI failures, tying each resolved
   thread to the resolving commit, for up to four rounds.
5. **Ready** — flips the pull request to ready and pings the maintainer once
   CI is green and the review is clean. Merging always stays a human decision.

The run pauses whenever it genuinely needs a human — an ambiguous requirement,
a plan approval, a judgment call on conflicting changes — and `/address
continue` picks it back up where it stopped.

### `/review` — get findings on any diff

[`/review`](./.claude/commands/review.md) runs this repository's review policy
([`REVIEW.md`](./REVIEW.md)) — severity-tagged findings with `file:line`
evidence and concrete fixes — on a pull request (`/review 57`), a ref range
(`/review main...feature`), or the current branch's diff (`/review`). Use it
for a pre-merge check on a hand-written change or a second opinion before
pushing; the same policy runs automatically in CI
([`claude-review.yaml`](./.github/workflows/claude-review.yaml)) against
`/address` pull requests.

### `/handoff` — suspend work for another session

[`/handoff`](./.claude/commands/handoff.md) packages in-progress work — goal,
current state, remaining to-dos, uncommitted changes — into a downloadable
`handoff-<epoch>.md` (plus an optional zip of supporting files). Use it when a
session is running low on context, or to park work for later; a fresh session
takes the package over with `/address continue`.

Changes made without an agent follow the same bar: branch, implement, run the
checks below, open a pull request, and get it reviewed before merge.

### Automated code review

[`.github/workflows/claude-review.yaml`](./.github/workflows/claude-review.yaml)
runs an **independent** review — a separate Claude Code session on a GitHub
runner, under a bot identity distinct from the author — whenever a trusted user
comments **`@claude review`** on a pull request. It runs the official
`code-review` plugin (the same practice `/review` runs locally) and posts
findings as a single **COMMENT**-type GitHub review: inline comments anchored to
the diff, tagged by severity with a concrete fix, plus a summary. It never
approves or requests changes — GitHub rejects those from a pull request's own
author — and the reviewer is advisory: it does not block merges.

Review **policy** — severity calibration, skip rules, repo-specific checks, and
reporting format — lives in [`REVIEW.md`](./REVIEW.md), the same portable
review-only file that managed
[Code Review](https://code.claude.com/docs/en/code-review) reads natively; the
review methodology stays in
[`code-review-guideline`](./.claude/skills/code-review-guideline/SKILL.md).

**One-time setup** to enable the reviewer (repo admin):

1. Install the [Claude GitHub App](https://github.com/apps/claude) on the repository.
2. Run `claude setup-token` and add the output as the repository secret
   `CLAUDE_CODE_OAUTH_TOKEN` (reviews run on your Claude subscription).

> `issue_comment` workflows run only from the default branch, so the reviewer
> starts firing on pull requests once `claude-review.yaml` is on `main`.

## Testing

Unit tests (Vitest + Testing Library) cover components and the domain
store/helpers; end-to-end tests (Playwright) exercise the tracker flows in a
real browser. Lint and unit tests gate merges via
[`merge-checks.yaml`](./.github/workflows/merge-checks.yaml).

| Check | Command |
| ----- | ------- |
| Format | `npm run format` |
| Lint | `npm run lint` |
| Type-check | `npm run typecheck` |
| Unit tests | `npm run test:unit` |
| E2E tests | `npm run test:e2e` |

Run format + lint after every change, and the suites relevant to the changed
surface before opening a pull request — see the Verification section of
[`AGENTS.md`](./AGENTS.md). Playwright is configured in
[`playwright.config.ts`](./playwright.config.ts) and starts the dev server
automatically; specs live in `e2e/`. To point Playwright at a system-provided
Chromium instead of its managed download, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to the browser binary.

## Project layout

- `src/app/` — App Router routes, layout, and global styles
- `src/components/` — UI components, split into domain-agnostic `primitives/` and domain `tracker/` tiers (each with its `*.module.css` and `*.spec.tsx`)
- `src/hooks/` — reusable React hooks
- `src/lib/` — domain types, the zustand store, IndexedDB storage adapter, helpers
- `e2e/` — Playwright specs
- `public/` — static assets
- `AGENTS.md` + `.claude/skills/` — agent working agreement and skill index
- `.claude/` — Claude Code harness (hooks, settings, and slash commands)
- `.github/workflows/` — CI (`merge-checks.yaml`) and the automated reviewer (`claude-review.yaml`)

## Deployment

The app is a client-rendered Next.js app and deploys to Vercel with zero extra
configuration. Import the GitHub repo at [vercel.com/new](https://vercel.com/new)
(**Import Git Repository → `axross/bombdog`**); the default framework preset and
build settings work as-is, and pushes then deploy automatically.

## Related links

- [Bomb Busters on BoardGameGeek](https://boardgamegeek.com/boardgame/413246/bomb-busters)
- [Next.js documentation](https://nextjs.org/docs)
- [axross/repo-agents](https://github.com/axross/repo-agents) — the skill system this repo adapts
