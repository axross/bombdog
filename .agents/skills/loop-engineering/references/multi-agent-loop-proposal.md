# Multi-Agent Loop — Design Proposal

> **Status: proposal, awaiting `@axross` approval.** This document specifies the
> planner / coder / reviewer split. It is not yet wired into the active skill
> index or the live routines. Nothing here changes behaviour until the operator
> migrates per the [Migration Plan](#migration-plan).

## Why

The single-routine loop stalled PRs #36 and #37 in **draft / `loop:in-review`**:
the session that opened the draft PR did one step and exited, and nothing woke a
follow-up session to run the self-review and flip the PR to ready. Two mechanics
caused it:

1. **Self-review has no independent trigger.** A coder's own `<!-- loop-agent -->`
   self-review comments are filtered by the dispatch bridge, so they wake nothing.
2. **The events that *should* advance the loop are non-events.** Opening a PR is a
   bot-authored event the bridge ignores, and CI-green delivers no webhook the
   loop listens to.

`AGENTS.md` also states the deeper limitation this design targets: *"A single
agent cannot provide true independent review."* Self-review by the agent that
just wrote the code, with no memory reset, is structurally weak.

This proposal splits the loop into three roles running as **separate routines
with dedicated prompts**, and replaces self-review with an **independent reviewer
whose comments are a real trigger**. Critically, every hand-off becomes a **PR
label change** — a reliable, role-attributable webhook — instead of a
hoped-for bot comment or CI-green non-event. The split is therefore *more*
reliable than today, not just more independent.

## Roles → Routines

| Routine | Owns | Writes code? | Sets `loop:done`? | Network / tools |
| ------- | ---- | ------------ | ----------------- | --------------- |
| **Planner** | Plan phase on the **issue** | No | No | Read + comment + `issue_write`; docs network |
| **Coder** | Build + address review on the **PR** | **Yes** | No | Full build/verify; `claude/` push |
| **Reviewer** | Review, verify, gate on the **PR** | No | **Yes** | Read + comment only; no push |

The reviewer never edits code and the coder never self-certifies done. Only the
reviewer flips draft→ready and sets `loop:done`. That separation *is* the value.

## Domains

A clean rule removes most routing ambiguity:

- **The issue thread is the Planner's domain.** Every unmarked human comment on a
  loop-managed issue routes to the Planner.
- **The PR thread is the Coder/Reviewer domain.** Every unmarked human comment or
  review on a loop PR routes to the Coder.

## Identity: role-aware markers

All three routines act as `@axross` (shared identity), so the marker must
distinguish **role**, not just bot-vs-human. Layer a role attribute onto the
existing base marker so the current bridge filter keeps working unchanged:

```
<!-- loop-agent role=plan -->
<!-- loop-agent role=code -->
<!-- loop-agent role=review -->
```

- The existing `contains(body, '<!-- loop-agent -->')` check still matches all
  three, so the issue bridge keeps ignoring every agent comment on issues.
- The `role=` attribute lets the PR-side logic tell a reviewer's finding from the
  coder's own reply — but note **triggering does not depend on parsing markers**
  (see next section); markers are for humans and for a session reconstructing who
  said what.

## Hand-off: labels, not comments

Because bot comments are filtered and CI-green is a non-event, the code↔review
ping-pong is driven by **PR labels**. Label changes emit reliable webhooks, are
attributable by *which label*, and are idempotent because each role removes the
label that woke it before applying the next.

Two PR-level hand-off labels drive the loop (the issue keeps `loop:in-review`
throughout):

| PR label | Applied by | Wakes | Meaning |
| -------- | ---------- | ----- | ------- |
| `loop:needs-review` | Coder | Reviewer | New/updated diff ready to review |
| `loop:changes-requested` | Reviewer | Coder | Findings posted; fixes needed |

The reviewer, on a clean round with green CI, applies neither — it flips the PR
to ready, sets `loop:done` on the issue, and removes both hand-off labels.

## Label set

Issue-level phase pointer (exactly one non-lock label at a time — unchanged from
today except ownership):

| Label | Meaning | Applied by |
| ----- | ------- | ---------- |
| `loop:plan` | Queued / planning | Human → Planner |
| `loop:awaiting-answer` | Planner asked, yielded | Planner |
| `loop:plan-review` | Plan written, awaiting approval | Planner |
| `loop:ready-to-build` | Plan approved | Human → Coder |
| `loop:in-review` | Draft PR open; code↔review loop active | Coder |
| `loop:done` | PR review-ready; handed back | **Reviewer** (terminal) |
| `loop:blocked` | Needs human | Any role |
| `loop:active` | Concurrency lock (per target, heartbeat) | Any role (transient) |

PR-level hand-off signal (new, PR only): `loop:needs-review`,
`loop:changes-requested` — see above.

## Transitions

```
issue opened --human adds--> loop:plan --fires--> Planner
Planner --blocking question--> loop:awaiting-answer (yields)
loop:awaiting-answer --human reply--> Planner resumes in place (no relabel)
Planner --plan complete--> loop:plan-review (@axross)
loop:plan-review --human approves--> loop:ready-to-build --fires--> Coder

Coder --opens draft PR--> issue:loop:in-review
                          + PR:loop:needs-review --fires--> Reviewer   ← deterministic first kick

Reviewer round:
  findings?  --yes--> post marked review comments (role=review)
                      + PR:loop:changes-requested (drop needs-review) --fires--> Coder
             --no--> flip PR draft→ready, issue:loop:done,
                     drop hand-off labels, @axross summary            ← ONLY the reviewer does this

Coder round:
  address findings, push to claude/ branch, reply on threads (role=code)
  --> PR:loop:needs-review (drop changes-requested) --fires--> Reviewer

Human review on the PR (unmarked) --fires--> Coder (same as changes-requested)
CI check_suite.completed on the PR --fires--> Reviewer (re-verify)

Any active phase, genuinely stuck --> loop:blocked (@axross), drop hand-off labels
loop:done  (terminal; further activity is a no-op unless a human reopens)
```

## Termination guard

The ping-pong has no natural stop, and now spans two routines, so the counter
must live in GitHub. **The reviewer owns it** — it is the arbiter.

- The reviewer maintains a single pinned `<!-- loop-agent role=review -->`
  tracking comment on the PR with a round counter, incremented each review round.
- After **4** review rounds without convergence, the reviewer sets `loop:blocked`,
  @mentions `@axross` with what still fails, and removes the hand-off labels so
  the ping-pong halts.
- A clean round (zero Critical/Major/Minor findings) with green CI ends the loop
  via the done transition above.

## Dispatch bridge routing

The bridge (`.github/workflows/loop-dispatch.yaml`) gains PR triggers and picks
one of three routine `/fire` endpoints. Three `(URL, token)` secret pairs:
`CLAUDE_LOOP_PLAN_*`, `CLAUDE_LOOP_CODE_*`, `CLAUDE_LOOP_REVIEW_*`.

| Event | Condition | Fires |
| ----- | --------- | ----- |
| `issues.labeled` | `loop:plan` | Planner |
| `issues.labeled` | `loop:ready-to-build` | Coder |
| `issue_comment.created` (issue, not PR) | unmarked human, issue has a `loop:` label | Planner |
| `pull_request.labeled` | `loop:needs-review` | Reviewer |
| `pull_request.labeled` | `loop:changes-requested` | Coder |
| `pull_request_review.submitted` | unmarked human | Coder |
| `issue_comment.created` (on a PR) | unmarked human | Coder |
| `check_suite.completed` | head branch is a loop PR | Reviewer |

Routing is by **event + label name**, never by parsing a comment marker, so a
shared bot identity cannot misroute a hand-off. Concurrency groups key on issue
number for issue events and PR number for PR events.

## Why this fixes the stall

- **Every advance is a reliable webhook.** Draft-PR-open is replaced by the coder
  *applying `loop:needs-review`*; CI-green is replaced by `check_suite.completed`.
  Neither depends on a bot comment or a non-event.
- **Review is independently triggered.** The reviewer is a different session with a
  review-only prompt; its `loop:changes-requested` label wakes the coder, so
  findings can never sit unread the way self-review comments did on #36/#37.
- **The done transition has a single, independent owner.** A coder can no longer
  leave a PR "done but draft" because it is not the coder's decision to make.

## Operator setup deltas

- Three routines instead of one, each with a dedicated prompt (planner:
  investigate/plan/yield; coder: build/verify/address, no `loop:done`; reviewer:
  review/verify/gate, read-and-comment only, owns the round counter and the done
  flip).
- Three API-trigger secret pairs (above).
- Extend `loop-dispatch.yaml` with the PR triggers and per-routine URL selection.
- The reviewer routine SHOULD run with reduced tool/network scope (no code push)
  to enforce the read-only contract at the platform level, not just by prompt.

## Migration plan

Phased, so the working single-routine loop keeps running until each piece lands:

1. **Reviewer first (biggest win).** Add the reviewer routine + the two PR
   hand-off labels + the `loop:needs-review` / `loop:changes-requested` /
   `check_suite` bridge triggers. The existing routine keeps planning and coding;
   only the self-review step is replaced by the reviewer hand-off. This alone
   fixes the #36/#37 stall.
2. **Split the coder out** of the existing routine (dedicated build prompt, drop
   its authority to set `loop:done`).
3. **Split the planner out** (smallest win — plan is already a distinct phase;
   separate mostly for prompt clarity).

## Open decisions for `@axross`

1. **Hand-off mechanism:** PR labels (this proposal — reliable webhooks) vs. each
   session directly POSTing the next routine's `/fire` (fewer labels, but embeds
   routine tokens in sessions). Labels are recommended.
2. **Reviewer scope enforcement:** prompt-only vs. a genuinely read-only routine
   token/tool set. Recommended to enforce read-only at the platform level.
3. **Marker scheme:** `role=` attribute on the existing marker (this proposal,
   backward-compatible) vs. distinct per-role markers vs. distinct GitHub bot
   identities per role (cleanest attribution, most setup).
