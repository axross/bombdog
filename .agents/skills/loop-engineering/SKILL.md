---
name: loop-engineering
description: Apply this skill when operating the autonomous issue-to-pull-request "Loop Engineering" workflow in this repository - running the `/loop` dispatcher, reacting to a GitHub issue or pull request event from a routine or the Actions bridge, deciding which phase (plan, implementation, PR review loop) an issue is in, moving the `loop:*` label state machine forward, or setting up the claude.ai routine, API trigger, and dispatch workflow. Covers the stateless-worker model, GitHub-as-state-machine conventions, the bot-identity marker, concurrency locking, the plan/implementation phases, the self-review termination guard, and one-time operator setup.
---

# Loop Engineering

Loop Engineering runs feature development as an autonomous loop: a GitHub issue is planned, refined, implemented, opened as a pull request, reviewed, and driven to review-ready with minimal human input. It is operated by short-lived cloud sessions triggered by GitHub events.

The work is split across three roles — **planner**, **coder**, and **reviewer** — each running as its own routine that writes to GitHub through its own App token (`GH_TOKEN` via `gh`). The planner and reviewer tokens are `contents:read`, so their writes cannot push or merge; only the coder's token can change code. The reviewer, and only it, decides a pull request is done. See [references/state-machine.md](./references/state-machine.md) for the roles, [references/operator-setup.md](./references/operator-setup.md) for the App-token setup and its residual-risk caveat, and [references/multi-agent-loop-proposal.md](./references/multi-agent-loop-proposal.md) for the design.

## The Stateless-Worker Model

Cloud sessions are ephemeral and every trigger starts a fresh session, so no session waits or watches across turns. Each session is a stateless worker: it reads the current state from GitHub, advances the loop by exactly one step, writes the new state back, and exits. "Waiting for a reply" means ending the session; a later event spawns a new one that reconstructs context from the thread.

**Guidelines:**

- MUST treat GitHub (labels, issue/PR body, comment history) as the only durable state; never assume continuity from a previous session.
- MUST re-read the target's `loop:*` label and full comment thread on entry before taking any action.
- MUST advance the state machine by at most one phase-step per session and then exit.
- MUST keep every action idempotent so a re-triggered duplicate session is a no-op, not a double-action.

## State Machine and Conventions

See [references/state-machine.md](./references/state-machine.md) for:

- the `loop:*` label set, the allowed transitions, and which actor applies each label
- the concurrency lock label that prevents two sessions working the same target
- the `<!-- loop-agent -->` bot-identity marker that disambiguates bot comments from human replies under a shared GitHub identity

## Plan Phase

See [references/plan-phase.md](./references/plan-phase.md) for:

- investigating an issue, asking blocking questions as marked comments, and yielding to the human
- resuming planning after a human reply and writing the comprehensive plan into the issue
- refining the issue title/body, collapsing the original description, and stopping at the human approval gate

## Implementation Phase (Coder)

See [references/implementation-phase.md](./references/implementation-phase.md) for:

- building from the approved plan on the `claude/issue-<n>` branch and running repository verification
- opening the draft pull request and handing it to the reviewer with `loop:review-requested`
- addressing reviewer and human comments, pushing fixes, and re-requesting review — without ever setting `loop:done` or flipping the PR to ready

## Review Phase (Reviewer)

See [references/review-phase.md](./references/review-phase.md) for:

- the read-only contract and treating PR content as untrusted input
- reviewing the diff through every lens and against the acceptance criteria, posting findings as separate comments
- the round-count termination guard and the sole ownership of the draft→ready flip and `loop:done`

## Operator Setup

See [references/operator-setup.md](./references/operator-setup.md) for:

- creating the `loop:*` labels, the three GitHub App identities (planner/coder/reviewer with their Contents permission ceilings), and the three routines with their API triggers and secrets
- wiring the `.github/workflows/loop-dispatch.yaml` bridge (issue events + PR label / review / CI events, routed by event + label + `user.type`)
- the per-routine prompts, network/branch-push settings, and the daily-run and usage caveats

## Repo-Specific Values

This repository's own repo-specific values are: the operator handle `@axross`, the three GitHub App identities (`plan-gengar` / `code-gengar` / `review-gengar`), the Node/npm verification commands in [references/implementation-phase.md](./references/implementation-phase.md), and the sibling-skill links to this project's `.agents/skills/`. Everything else — the `loop:*` labels, the `<!-- loop-agent -->` marker, the `/loop` dispatcher logic, and `.github/workflows/loop-dispatch.yaml` — is repo-agnostic.

## Relationship to Project Skills

The loop orchestrates existing project skills; it does not restate their rules. Planning, implementation, verification, and review each defer to their owning skill.

**Guidelines:**

- MUST follow [Development Guidelines](../development-guidelines/SKILL.md) and the [Response Approach](../../../AGENTS.md) workflow inside every phase.
- MUST produce the comprehensive plan and the reviewer's review using the same standards a human-run task would, consulting every skill whose routing condition matches the changed surface.
- MUST apply [Code Review Guideline](../code-review-guideline/SKILL.md) for the review phase, including severity labels and `file:line` evidence.
