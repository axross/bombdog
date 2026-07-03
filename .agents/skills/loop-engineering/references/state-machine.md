# State Machine and Conventions

The loop stores all state in GitHub. Labels are the phase pointer, the issue/PR body holds the plan and the diff, and comments hold the conversation. This reference defines the roles, the labels, the transitions, the lock, and the identity model.

## Roles and Identities

The loop is split across three roles, each running as its own routine under its own
GitHub App identity, so `user` on every event attributes the action:

| Role | Owns | Identity (example) | Writes code? | Sets `loop:done`? |
| ---- | ---- | ------------------ | ------------ | ----------------- |
| **Planner** | Plan phase on the issue | `plan-gengar[bot]` | No | No |
| **Coder** | Build + address review on the PR | `code-gengar[bot]` | Yes | No |
| **Reviewer** | Review, verify, gate on the PR | `review-gengar[bot]` | No | Yes |

Only the reviewer flips a pull request draft→ready and sets `loop:done`; the coder
never self-certifies. Each role MUST post its issue/PR comments and reviews through
its own App token (`GH_TOKEN` via `gh`) so they carry the role's `[bot]` identity
and the bridge's `user.type` routing holds; the session's built-in GitHub tools post
as the operator (type `User`) and would re-fire the loop. Git commits and pushes stay
on the operator identity, which is expected. See [operator-setup.md](./operator-setup.md)
for the App setup and the read-only residual-risk caveat.

## Label Set

Issue-level phase pointer — exactly one non-lock label at a time:

| Label | Meaning | Applied by |
| ----- | ------- | ---------- |
| `loop:plan` | Issue is queued for planning or actively being planned. | Human (to enroll an issue) |
| `loop:awaiting-answer` | The planner asked a blocking question and yielded; paused on the human. | Planner |
| `loop:plan-review` | A comprehensive plan is written into the issue; waiting for human approval. | Planner |
| `loop:ready-to-build` | Human approved the plan; implementation may start. | Human (the plan→build gate) |
| `loop:in-review` | A draft pull request is open and the coder↔reviewer loop is active. | Coder |
| `loop:done` | The pull request is review-ready; the loop has handed back to the human. | Reviewer (terminal) |
| `loop:active` | Concurrency lock: a session is currently working this target. | Any role (transient) |
| `loop:blocked` | A role could not proceed and needs human intervention. | Any role |

PR-level hand-off signal — drives the coder↔reviewer loop while the issue stays
`loop:in-review`. Each role removes the label that woke it before applying the next,
so transitions are idempotent:

| Label | Meaning | Applied by | Wakes |
| ----- | ------- | ---------- | ----- |
| `loop:review-requested` | New or updated diff ready to review. | Coder | Reviewer |
| `loop:changes-requested` | Findings posted; fixes needed. | Reviewer | Coder |

## Transitions

```
(issue opened) --human adds--> loop:plan
loop:plan --planner has a blocking question--> loop:awaiting-answer
loop:awaiting-answer --human replies--> loop:awaiting-answer (planner resumes in place; NO relabel)
    then, when clear --> loop:plan-review                   (planner @mentions the operator)
loop:plan --plan complete--> loop:plan-review               (planner @mentions the operator)
loop:plan-review --unmarked human comment--> loop:plan-review (planner revises plan, re-requests approval)
loop:plan-review --human approves--> loop:ready-to-build     (human applies the label; not a comment)
loop:ready-to-build --coder opens draft PR--> loop:in-review
                     + PR:loop:review-requested             (wakes the reviewer; deterministic first review)

--- coder <-> reviewer loop, issue stays loop:in-review ---
PR:loop:review-requested --reviewer finds issues--> PR:loop:changes-requested (drop review-requested; wakes coder)
PR:loop:changes-requested --coder pushes fixes--> PR:loop:review-requested    (drop changes-requested; wakes reviewer)
(human review on the PR) --> treated as loop:changes-requested (wakes coder)
(CI check_suite.completed on the PR) --> wakes the reviewer to re-verify
PR:loop:review-requested --clean round + green CI--> loop:done (reviewer flips PR to ready; @mentions operator)
-----------------------------------------------------------

loop:blocked --human comment--> (the owning role resumes and replaces loop:blocked)
loop:done                                                   (terminal; further comments are no-ops)
(active phase) --role genuinely stuck--> loop:blocked       (role @mentions the operator)
```

**Guidelines:**

- MUST have exactly one non-lock issue-level `loop:*` label on a managed issue at a time; replace the prior label in the same step that adds the next one. The PR hand-off labels are separate and live on the pull request.
- MUST, when handing off, remove the hand-off label that woke the role in the same step that applies the next, so a re-fired duplicate event is a no-op.
- MUST NOT apply a human-owned trigger label (`loop:plan`, `loop:ready-to-build`) from an agent session; those are the human's controls and applying them from a bot creates an event loop.
- MUST set `loop:blocked` and stop rather than guess when progress needs a human product, scope, or platform decision that the thread cannot answer.

## Concurrency Lock

Scheduled polls, event triggers, and manual runs can fire on the same target concurrently. The `loop:active` label is a best-effort mutex.

**Guidelines:**

- MUST, on entry, check for `loop:active`; if present and its most recent `<!-- loop-agent -->` heartbeat comment is under 30 minutes old, exit immediately without acting.
- MUST add `loop:active` before mutating anything and remove it before exiting, including on handled error paths.
- MUST treat a stale `loop:active` (no heartbeat for 30+ minutes) as an abandoned session and reclaim it.
- SHOULD post a short `<!-- loop-agent -->` heartbeat comment when starting long work so a duplicate session can detect the live lock.

## Identity and the Bot Marker

Each role runs under its own GitHub App, so its comments and reviews arrive with
`user.type == 'Bot'` and a distinct `[bot]` login. The bridge uses this to tell
humans (`user.type != 'Bot'`) from agents and routes hand-offs by label, so
**routing no longer depends on parsing a comment body**. The three
`LOOP_*_BOT_LOGIN` variables also name the loop Apps so the bridge can exclude them
by login in addition to `user.type`. The `<!-- loop-agent -->` marker is retained
only as a human-facing convenience and for heartbeat detection.

**Guidelines:**

- MUST treat any comment or review with `user.type == 'Bot'` as agent output to ignore as a trigger, and anything else as human input.
- MUST begin every comment a role posts (issue or PR) with an HTML marker line `<!-- loop-agent -->` on its own line, and prefix the visible body with a role badge (`🤖 **loop-plan**` / `🤖 **loop-code**` / `🤖 **loop-review**`) so a human reader can tell which role spoke.
- MUST @mention the operator (`@axross`) in the visible body whenever the loop yields for a decision, approval, or blocker.
