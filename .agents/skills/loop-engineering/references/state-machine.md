# State Machine and Conventions

The loop stores all state in GitHub. Labels are the phase pointer, the issue/PR body holds the plan and the diff, and comments hold the conversation. This reference defines the roles, the labels, the transitions, the lock, and the identity model.

## Roles

The loop is split across three roles, each running as its own routine with a
dedicated prompt:

| Role | Owns | Writes code? | Sets `loop:done`? |
| ---- | ---- | ------------ | ----------------- |
| **Planner** | Plan phase on the issue | No | No |
| **Coder** | Build + address review on the PR | Yes | No |
| **Reviewer** | Review, verify, gate on the PR | No | Yes |

Only the reviewer flips a pull request draft→ready and sets `loop:done`; the coder
never self-certifies. All three routines act as the operator (`@axross`) via the
built-in GitHub tools — a cloud routine cannot act as a distinct bot in-session — so
the reviewer's read-only contract is enforced by its prompt and review phase, not by
a platform permission. See [operator-setup.md](./operator-setup.md).

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

## Issue vs. Pull Request Targets

Once the coder opens a pull request, an issue's plan lives at one numeric target
(its own issue number) and its pull request lives at a **different** numeric
target (the pull request's own number, assigned when it is created) — even
though the PR body says `Closes #<n>`. Every `mcp__github__issue_write`
call that mutates labels takes a single numeric target and replaces that
target's entire label list, so sending the right label to the wrong number is a
silent, undetected mistake, not a rejected call.

**Guidelines:**

- MUST send every issue-level label (`loop:plan`, `loop:awaiting-answer`,
  `loop:plan-review`, `loop:ready-to-build`, `loop:in-review`, `loop:done`) to
  the issue's own number, never to the pull request's number.
- MUST send every PR-level hand-off label (`loop:review-requested`,
  `loop:changes-requested`) to the pull request's own number, never to the
  issue's number.
- MUST state, immediately before each label-mutating call, which object is
  being written (issue #N or pull request #M) and confirm that number against
  the guideline above; a call about to apply a PR-level label to the issue
  number (or vice versa) is the mistake this section exists to catch.
- MUST re-read the target's current labels with a fresh `issue_read` /
  `pull_request_read` call immediately before building the array passed to
  `issue_write`'s `labels` field, and compute that array as the fresh current
  labels minus the label(s) being removed plus the label(s) being added; MUST
  NOT reuse a label snapshot read earlier in the session or read for a
  different target, since the field replaces the whole list and a stale or
  wrong-target snapshot silently drops labels.

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
loop:done --new human review or comment on the pull request--> loop:in-review (coder resumes per implementation-phase.md's "Address Review After Done"; not a no-op)
loop:done                                                   (terminal to the issue's own comment thread otherwise; a human comment on the *issue* remains a no-op unless it explicitly asks to reopen, per the planner's routing)
(active phase) --role genuinely stuck--> loop:blocked       (role @mentions the operator)
```

**Guidelines:**

- MUST have exactly one non-lock issue-level `loop:*` label on a managed issue at a time; replace the prior label in the same step that adds the next one. The PR hand-off labels are separate and live on the pull request.
- MUST, when handing off, remove the hand-off label that woke the role in the same step that applies the next, so a re-fired duplicate event is a no-op.
- MUST NOT apply a human-owned trigger label (`loop:plan`, `loop:ready-to-build`) from an agent session; those are the human's controls and applying them from a bot creates an event loop.
- MUST set `loop:blocked` and stop rather than guess when progress needs a human product, scope, or platform decision that the thread cannot answer.
- MUST NOT treat a human review or comment left on the pull request as a no-op merely because the issue already carries `loop:done`; `loop:done` means the last review round converged, not that the human has stopped participating on the open PR.

## Concurrency Lock

Scheduled polls, event triggers, and manual runs can fire on the same target concurrently. The `loop:active` label is a best-effort mutex — pairing it with an immediate heartbeat and a pre-write idempotency check keeps a race window from producing duplicate comments or duplicate state transitions.

**Guidelines:**

- MUST, on entry, check for `loop:active`; if present with a `<!-- loop-agent -->` heartbeat comment under 30 minutes old, exit immediately without acting.
- MUST, if `loop:active` is present with no heartbeat comment yet, treat it as a fresh, in-progress acquisition and exit without reclaiming — unless the issue/PR's `updated_at` (or the label's own applied-at time, when available) shows the lock itself is 30+ minutes old, in which case treat it as an abandoned acquisition and reclaim it.
- MUST add `loop:active` before mutating anything, then post a short `<!-- loop-agent -->` heartbeat comment as the very next action, before any investigation or other write, so a concurrent session always has a heartbeat to judge freshness against.
- MUST treat a stale `loop:active` (heartbeat 30+ minutes old, or absent per the fallback above) as an abandoned session and reclaim it.
- MUST remove `loop:active` before exiting, including on handled error paths.
- MUST, immediately before posting a phase-completing comment or applying a state-changing label, re-read the current labels and latest comments; if the target state was already reached (the hand-off label this session is about to apply is already present, `loop:done` is already set, or a review-round comment for the same round already exists), treat this session as having lost the race and exit without posting or re-applying.

## Live Coder Session

The coder MAY hold **one** session open across the whole coder↔reviewer loop so
the context that built the diff also addresses the review; see
[implementation-phase.md](./implementation-phase.md) § Live Session Ownership for
the full behavior. This is an optimization on top of the stateless model, not a
replacement: a live session that dies is superseded by a fresh bridge-fired coder
that reconstructs state from GitHub.

Two signals coordinate it, and they are **not** the same thing:

- **`loop:active`** — the short-lived mutation mutex, acquired only while a role is
  actively building, pushing, or writing state, and released immediately after. The
  reviewer needs this lock too, so the live coder MUST NOT hold it between rounds.
- **The coder-liveness heartbeat** — a single pinned pull-request comment carrying
  the standard loop header (badged `🔨 Code`) plus a `<!-- loop-coder-live -->`
  marker line and a refreshed timestamp. It means "a live coder owns the next coder
  turn," and only ever suppresses a redundant *coder* session; it never gates the
  reviewer.

**Guidelines:**

- MUST, in live mode, refresh the coder-liveness heartbeat on every wake and on a
  self-scheduled check-in strictly under 30 minutes apart, so a concurrent
  bridge-fired coder can judge liveness from its age.
- MUST, on entry to a bridge-fired (cold) coder turn, treat a `<!-- loop-coder-live -->`
  heartbeat under 30 minutes old as a live owner and exit as a no-op; treat one
  30+ minutes old, or absent, as a dead session and proceed, optionally entering
  live mode.
- MUST leave live mode — drop the `<!-- loop-coder-live -->` marker from the
  heartbeat and unsubscribe — on `loop:done`, on `loop:blocked`, or when the
  keep-alive budget is exhausted, so post-completion follow-up reverts cleanly to
  the cold bridge path.
- MUST NOT let the coder-liveness heartbeat gate any role but the coder; the
  reviewer and planner ignore it entirely and continue to coordinate only through
  `loop:active` and the hand-off labels.

## The Bot-Identity Marker

All three routines act as the operator's GitHub identity, so agent comments and human
comments share the same author. A cloud routine cannot post as a distinct bot
in-session, so the `<!-- loop-agent -->` marker is the **only** reliable way to tell
them apart, and it is what the dispatch bridge uses to avoid re-triggering on the
loop's own comments. Cross-role hand-offs are driven by labels, which fire regardless
of author.

**Guidelines:**

- MUST begin every comment a role posts (issue or PR) with the standard header defined below — the hidden marker line, then the visible badge.
- MUST treat any comment or review carrying `<!-- loop-agent -->` as agent output to ignore as a trigger, and any comment without it as human input.
- MUST make GitHub reads and writes through the built-in `mcp__github__*` tools; direct `gh`/`curl` calls to `api.github.com` are proxy-gated in cloud sessions.
- MUST @mention the operator (`@axross`) in the visible body whenever the loop yields for a decision, approval, or blocker.

### Comment Header Convention

Every comment a role posts MUST start with exactly these two lines, followed by a blank line and the body:

```markdown
<!-- loop-agent -->
> {emoji} **Loop Engineering — {Role}** · <sub>Claude Code · [session ↗]({session-url})</sub>
```

- **Line 1** is the hidden marker the dispatch bridge reads; it MUST be present and exact, or the bridge will treat the comment as human input and re-fire the loop.
- **Line 2** is the human-facing badge. `{emoji}`/`{Role}` name the speaking role: **🧭 Plan**, **🔨 Code**, **🔍 Review**.
- `{session-url}` is this run's transcript: `https://claude.ai/code/` followed by the value of `CLAUDE_CODE_REMOTE_SESSION_ID` with its `cse_` prefix replaced by `session_`. Omit the ` · [session ↗](…)` segment when the id is unavailable (e.g. a local run).
- MUST NOT hardcode a model name — the routine's model is configurable. `Claude Code` (the tool) is the fixed attribution.

Example (reviewer, yielding a finding):

```markdown
<!-- loop-agent -->
> 🔍 **Loop Engineering — Review** · <sub>Claude Code · [session ↗](https://claude.ai/code/session_01ABC)</sub>

@axross Major: `move-composer.tsx:42` — the sheet never restores focus after a keep-open log.
```
