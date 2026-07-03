---
description: Drive a GitHub issue, PR, or prompt end-to-end — plan, code, then request an independent review and respond to it — in one continuing session
argument-hint: <issue-or-pr number/URL | prompt | continue> [--review-plan]
---

You are the `/address` driver. Take one unit of work — a GitHub issue, a pull request, or a free-form prompt — from intake to a review-ready pull request inside this single continuing session.

Target: `$ARGUMENTS`

Make all GitHub reads and writes per [GitHub Operations](../../.agents/skills/github-operations/SKILL.md): the built-in `mcp__github__*` tools, acting as the operator `@axross`, with a `<!-- address-agent -->` marker on every comment you post so `/address continue` never mistakes your own output for human input. Follow [Development Guidelines](../../.agents/skills/development-guidelines/SKILL.md) and the [Response Approach](../../AGENTS.md) workflow inside every phase.

## Execution Model

You are the only long-lived actor. Advance the work as far as you can autonomously, and stop the turn whenever the next step needs a human. Two — and only two — kinds of thing resume a stopped run:

- **A machine event that completes on its own** — CI, or the independent review this flow requests (see [Independent Review](#phase-3--request-independent-review)). Schedule your own wake-up with `send_later` and poll until it resolves (see [CI and Review Tail](#ci-and-review-tail)).
- **A human decision — plan approval, a human comment, a blocking question, or a stuck machine event:** post your state, **end the turn**, and wait at zero cost. The human resumes by sending **`/address continue`** in this same session.

- MUST poll autonomously ONLY for machine events (CI, the review workflow); never keep a session alive polling for a human.
- MUST end the turn at every human-gated stop and rely on `/address continue`, rather than scheduling a wake-up to re-check for human input.
- The running session is the primary state store; a run resumes with its context intact. Write durable status to GitHub as a safety net (see [GitHub as Lightweight State](#github-as-lightweight-state)), not as the mechanism of record.
- Keep each externally observable step idempotent, so a re-run of `/address continue` re-reads state and continues rather than duplicating work.

## Argument Resolution

Resolve `$ARGUMENTS` first, then enter the matching phase.

| Argument | Meaning | Entry |
| -------- | ------- | ----- |
| Issue number / URL | Plan and deliver the issue | Plan |
| Pull request number / URL | Resume delivery of an open pull request | Address / tail |
| Free-form prompt | Ad-hoc task with no issue yet | Open a tracking issue, then Plan |
| `continue` | Resume the paused run in this session | Reconstruct state, re-enter the pending step |
| `--review-plan` (flag) | Add a human approval gate after Plan | Modifier on any of the above |

- For a free-form prompt, open a tracking issue capturing the request before planning, so the run is issue-anchored and `/address continue` can reconstruct it.
- For `continue`, re-read the target's current state — the open pull request, its CI status, the independent review's comments, unresolved threads, and your pinned status comment — before acting, and resume the single pending step rather than restarting.
- Run full-auto by default and yield only on genuinely blocking questions; add a human approval gate after the plan only when invoked with `--review-plan`.

## Phase 1 — Plan

Turn the target into a buildable specification recorded in the issue.

- Read the issue (or the tracking issue opened for a prompt) and its full thread, classify the work — UI-bearing, implementation-only, exploratory, or mixed — per the [Response Approach](../../AGENTS.md), and investigate the smallest useful code and documentation context before proposing a plan. Consult every project skill whose routing condition matches the surface, and research current external docs per [current-docs.md](../../.agents/skills/development-guidelines/references/current-docs.md) when behavior depends on Next.js, React, Vercel, Playwright, Vitest, or Biome.
- Post blocking questions as one marked comment that @mentions `@axross`, stating the assumption you would otherwise make, then end the turn — reserved for product, scope, privacy, platform, or design decisions the thread cannot resolve. Do NOT ask what local investigation can answer.
- Rewrite the issue body into a comprehensive plan with these sections, omitting any that genuinely do not apply and saying why, per [Product Requirement Guidelines](../../.agents/skills/product-requirement-guidelines/SKILL.md): (1) **Product requirement** — the user-facing outcome and constraints; (2) **UI design** — hierarchy, states, responsive and accessibility intent, and copy constraints, when UI-bearing (per [UI and Components](../../.agents/skills/ui-and-components/SKILL.md)); (3) **System design / architecture** — data flow, state, routes, module placement, when applicable (per [Project Structure](../../.agents/skills/project-structure/SKILL.md)); (4) **Testing strategy** — the E2E and unit coverage to add or update (per [E2E Testing Guidelines](../../.agents/skills/e2e-testing-guidelines/SKILL.md) and [Unit Test Guidelines](../../.agents/skills/unit-test-guidelines/SKILL.md)); (5) **Acceptance criteria** — a checklist the reviewer can verify against the finished pull request.
- Refine the issue title to the concrete deliverable and move the original description into a collapsed `<details>` section, in a single `issue_write`.
- With `--review-plan`, stop after writing the plan, @mention `@axross` for approval, and end the turn; without the flag, proceed directly to Code.

## Phase 2 — Code + Verify

- Implement strictly from the plan, keeping edits within the smallest surface that satisfies the acceptance criteria, on a `claude/issue-<n>` branch; never push to `main`.
- Follow every project skill whose routing condition matches the changed files, and add or update the E2E and unit coverage the plan named.
- Run the verification the changed surface requires — `npm run format` and `npm run lint` after any edit; `npm run typecheck` for type or signature changes; `npm run test:unit`, and `npm run test:e2e` for UI-output or e2e-coverage changes; `npm run build` for route, metadata, runtime-config, dependency, or signature changes — per [Development Guidelines › verification](../../.agents/skills/development-guidelines/references/verification.md), and record the evidence in the pull request body.
- Do a reviewer-mode reset and fix obvious Critical/Major issues before opening the pull request (a self-check to avoid trivial hand-backs per [Code Review Guideline](../../.agents/skills/code-review-guideline/SKILL.md)); this is NOT the authoritative review — that is the independent reviewer in Phase 3.

## Phase 3 — Request Independent Review

Review is **not** done by you. It runs as a separate Claude Code session on a GitHub-hosted runner — different session, different infrastructure, a bot identity distinct from the operator — via the [`claude-review.yaml`](../../.github/workflows/claude-review.yaml) workflow. That separation is the whole point: the code's author never certifies its own work.

- Open the pull request in **draft** with `Closes #<n>`, structured from any repository PR template, summarizing the change, the verification evidence, and the acceptance criteria with their status.
- Request the review by posting a top-level `@claude review` comment on the pull request (a marked comment). This fires the review workflow, which submits its findings as a **GitHub pull-request review** — inline comments anchored to the diff, tagged by severity, with a summary in the review body — not as loose conversation comments.
- The review is a machine event that completes on its own in minutes — poll for it in the tail alongside CI. Do NOT review the diff yourself in place of it.

## Phase 4 — Address

- When the independent review's comments land, read them (their author is the review bot, not you and not a human) together with `merge-checks` CI status.
- Address and resolve each blocking finding (Important / Critical / Major) and every unmet acceptance criterion, pushing fixes to the same branch and re-running the relevant verification after each batch.
- For every review comment a commit resolves, reply on that comment's thread with a marked comment (the `<!-- address-agent -->` marker line, then a line beginning **`Resolved in <short-hash>`** — the 7-character hash of the commit that fixed it — followed by a one-sentence summary of what changed), then resolve the thread. When one commit resolves several comments, reference that same hash on each. This ties each resolution to the exact commit for the reviewer and for `/address continue`.
- Re-request review by posting `@claude review` again after a batch of fixes, and repeat up to the 4-round cap (see [Termination Guard](#termination-guard)).
- Escalate — a marked comment mentioning `@axross`, then end the turn — when a finding or human comment is ambiguous or needs a product or architecture decision, rather than guessing.
- Gate the draft→ready flip on a **clean independent review** (no blocking findings) plus green CI — never on your own assessment of your code. On convergence, flip the pull request to ready for review and @mention `@axross`. Merging remains the human's decision.
- When a human leaves comments on a ready pull request, treat `/address continue` as the resume: re-read the new threads, address or escalate each, convert back to draft if needed, request a fresh `@claude review`, and re-enter this loop as a new round.

## CI and Review Tail

After you push and request review, two machine events run on their own: `merge-checks` CI ([`.github/workflows/merge-checks.yaml`](../../.github/workflows/merge-checks.yaml): lint + unit tests) and the independent review ([`claude-review.yaml`](../../.github/workflows/claude-review.yaml)). Poll for both — nothing wakes this session when they finish, so schedule a wake-up with `send_later` (the claude-code-remote MCP server), which delivers a message back into this same session and survives container reclaim.

**Cadence.** The prompt cache has a ~5-minute TTL, so a wake-up under five minutes resumes cache-warm and cheap; one past it pays a full cache miss. `send_later` is minute-granular, so the closest warm value is four minutes — five is the worst choice, paying the cache miss without buying a longer wait.

- Poll at a **4-minute** cadence (`delay_minutes: 4`) for the first ~15 minutes, then back off to a **10-minute** cadence while still pending.
- MUST stop autonomous polling after **2 hours** with no result — a check still pending at two hours is stuck or badly queued and needs a human. On the cap, update the pinned status comment to note what is stuck, @mention `@axross`, and end the turn; the run goes dormant until `/address continue`.
- Reset the 2-hour budget when a check produces a result and a new push or `@claude review` starts a fresh run; the cap governs a single uninterrupted wait, not the run's whole lifetime.
- On green CI plus a clean review, flip the pull request to ready, @mention `@axross`, and end the turn. On review findings or red CI, enter Address (Phase 4). On only some checks resolved, keep polling for the rest.

## GitHub as Lightweight State

State lives in this running session; GitHub carries a thin, human-visible breadcrumb so a resumed or reclaimed session can recover.

- Maintain a single pinned status comment on the issue (and, once open, the pull request) recording the current phase, the review-round count, and what the run is waiting on. Update it in place; do not post a new comment per step.
- On `/address continue`, reconstruct state from GitHub before acting — the open pull request, its CI status, the independent review's comments, unresolved threads, and the pinned status comment — and resume the one pending step the comment names, not restart from Plan.
- Labels are optional and purely informational; the run does not depend on a label state machine.

## Termination Guard

- Cap the address↔review loop at **4** rounds; on non-convergence, post a summary of what still fails, @mention `@axross`, end the turn, and wait for `/address continue`.
- Cap autonomous polling at 2 hours per wait and go dormant rather than poll indefinitely.
- End the turn (never loop-block) whenever waiting on a human, so an idle run consumes nothing.

## Project Skills to Follow

`/address` orchestrates existing project skills; it does not restate their rules. Beyond the phase links above, follow [GitHub Operations](../../.agents/skills/github-operations/SKILL.md) for every GitHub read/write, and the verification the changed surface requires per [Development Guidelines › verification](../../.agents/skills/development-guidelines/references/verification.md). The independent reviewer applies [Code Review Guideline](../../.agents/skills/code-review-guideline/SKILL.md) in its own session; you consult it only for the Phase 2 self-check. Keep edits to the smallest surface that satisfies the acceptance criteria; never push to `main`; never merge the pull request.
