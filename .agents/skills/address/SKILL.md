---
name: address
description: Apply this skill when operating the `/address` end-to-end delivery command in this repository — driving a GitHub issue, pull request, or free-form prompt from plan through code, independent review, and review-response in a single continuing session; polling CI autonomously; pausing at human-gated decisions; or resuming a paused run with `/address continue`. Covers the single-session driver model, the plan → code → independent-review → address loop, the fresh-subagent reviewer that avoids self-review bias, the CI-poll tail with its cadence and hard cap, and the human-gated pause/resume contract. Replaces the retired Loop Engineering (`/loop`) methodology.
---

# Address

`/address` drives a unit of work end-to-end — plan, implement, review, respond to review — inside a single continuing Claude Code session. One human invocation carries an issue, a pull request, or a free-form prompt from intake to a review-ready pull request, pausing only when a human decision is genuinely required.

It replaces Loop Engineering. Where the old loop split the work across three cloud routines wired together by a GitHub Actions bridge and a `loop:*` label state machine, `/address` folds all three roles into one driver session and gets review independence from a **fresh reviewer subagent** instead of a separate routine. There is no dispatch bridge, no API-trigger fan-out, and no label state machine to maintain.

## Execution Model

The driver session is the only long-lived actor. It advances the work as far as it can autonomously and stops the turn whenever the next step needs a human.

Two — and only two — things resume a stopped run:

- **CI, a machine event that completes on its own:** the driver schedules its own wake-up with `send_later` and polls until CI resolves. See [references/ci-tail-and-resume.md](./references/ci-tail-and-resume.md).
- **A human decision — approval, review, a blocking question, or stuck CI:** the driver posts its state, **ends the turn**, and waits at zero cost. The human resumes by sending **`/address continue`** in the same session.

**Guidelines:**

- MUST poll autonomously ONLY for CI or other machine events that finish without a human; MUST NOT keep a session alive polling for a human.
- MUST end the turn at every human-gated stop and rely on `/address continue` to resume, rather than scheduling a wake-up to re-check for human input.
- MUST treat the running session as the primary state store; a run resumes with its context intact. Write durable status to GitHub as a safety net (see [GitHub as Lightweight State](#github-as-lightweight-state)), not as the mechanism of record.
- MUST keep each externally observable step idempotent, so a re-run of `/address continue` re-reads state and continues rather than duplicating work.

## Argument Resolution

`/address <issue-id | pr-id | prompt | continue> [--review-plan]` — resolve the argument first, then enter the matching phase.

| Argument | Meaning | Entry |
| -------- | ------- | ----- |
| Issue number / URL | Plan and deliver the issue | Plan phase |
| Pull request number / URL | Resume delivery of an open pull request | Address / CI tail |
| Free-form prompt | Ad-hoc task with no issue yet | Open a tracking issue, then Plan phase |
| `continue` | Resume the paused run in this session | Reconstruct state, re-enter the pending step |
| `--review-plan` (flag) | Add a human approval gate after Plan | Modifier on any of the above |

**Guidelines:**

- MUST, for a free-form prompt, open a tracking issue capturing the request before planning, so the run is issue-anchored and `/address continue` can reconstruct it.
- MUST, for `continue`, re-read the target's current state — the open pull request, its CI status, unresolved review threads, and the driver's pinned status comment — before acting, and resume the single pending step rather than restarting.
- MUST run full-auto by default and yield only on genuinely blocking questions; MUST add a human approval gate after the plan only when invoked with `--review-plan`.

## Phases

The driver runs these in order within one session; see [references/phases.md](./references/phases.md) for the mechanics of each.

1. **Plan** — investigate the smallest useful context, then write a comprehensive plan into the issue. Ask blocking questions only for product / scope / privacy / platform decisions local investigation cannot settle; on a blocking question, end the turn and yield. With `--review-plan`, stop for human approval; otherwise proceed.
2. **Code + verify** — implement strictly from the plan on a `claude/issue-<n>` branch, and run the verification the changed surface requires.
3. **Independent review** — spawn a fresh reviewer subagent that judges the diff with no memory of writing it (see [Review Independence](#review-independence)). Collect its findings.
4. **Address** — fix the findings, re-verify, and re-review with a new subagent. Repeat up to the round cap. On convergence, open or mark the pull request ready.
5. **CI tail** — poll CI; on green plus a clean reviewer round flip the pull request to ready and @mention `@axross`; on red, address and re-push.

## Review Independence

The value the old three-routine split bought — that no agent certifies its own code — is preserved by running review in a **separate subagent context**, not the driver's.

**Guidelines:**

- MUST run every review round as a fresh subagent (the `Agent` tool) that receives only the diff, the linked issue's acceptance criteria, and the [Code Review Guideline](../code-review-guideline/SKILL.md) lens — never the driver's implementation reasoning.
- MUST spawn a new subagent for each re-review round, so no round inherits the previous round's context or the driver's bias.
- MUST gate the draft→ready flip on the reviewer subagent's clean verdict (zero Critical / Major / Minor findings) plus green CI — never on the driver's own assessment of its code.
- MUST treat the reviewer subagent as authoritative on the readiness gate: the driver may not mark a pull request ready over unaddressed Critical / Major / Minor findings.

## GitHub as Lightweight State

State lives in the running session; GitHub carries a thin, human-visible breadcrumb so a resumed or reclaimed session can recover.

**Guidelines:**

- MUST maintain a single pinned status comment on the issue (and, once open, the pull request) recording the current phase, the review-round count, and what the run is waiting on. Update it in place; do not post a new comment per step.
- MUST begin every comment the driver posts with a `<!-- address-agent -->` marker line, so its own output is never mistaken for human input on `/address continue`.
- SHOULD keep labels optional and purely informational; the run does not depend on a label state machine.

## Termination Guard

**Guidelines:**

- MUST cap the address↔review loop at **4** rounds; on non-convergence, post a summary of what still fails, @mention `@axross`, end the turn, and wait for `/address continue`.
- MUST cap autonomous CI polling per [references/ci-tail-and-resume.md](./references/ci-tail-and-resume.md) and go dormant rather than poll indefinitely.
- MUST end the turn (never loop-block) whenever waiting on a human, so an idle run consumes nothing.

## Relationship to Project Skills

`/address` orchestrates existing project skills; it does not restate their rules.

**Guidelines:**

- MUST follow [Development Guidelines](../development-guidelines/SKILL.md) and the [Response Approach](../../../AGENTS.md) workflow inside every phase.
- MUST frame the plan and its acceptance criteria per [Product Requirement Guidelines](../product-requirement-guidelines/SKILL.md), and UI-bearing plans per [UI and Components](../ui-and-components/SKILL.md).
- MUST run the reviewer subagent against [Code Review Guideline](../code-review-guideline/SKILL.md), including severity labels and `file:line` evidence.
- MUST run the verification the changed surface requires per [Development Guidelines › verification](../development-guidelines/references/verification.md).

## Repo-Specific Values

The operator handle is `@axross`; the branch convention is `claude/issue-<n>`; the CI the tail waits on is [`.github/workflows/merge-checks.yaml`](../../../.github/workflows/merge-checks.yaml) (lint + unit tests). Everything else is repo-agnostic.
