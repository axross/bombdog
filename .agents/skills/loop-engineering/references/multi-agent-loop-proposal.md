# Multi-Agent Loop — Design Proposal

> **Status: superseded in part — the three-role split ships; distinct App
> identities do not.** The planner / coder / reviewer split, the PR-label hand-offs,
> and the reviewer-owned `loop:done` are implemented and correct. The attempt to
> give each role its own GitHub App `[bot]` identity was **found infeasible in
> Claude Code routines** during testing (issues #25 and #35): a routine's GitHub
> access is proxy-mediated as the connected operator, so a self-minted App token is
> never honored by `api.github.com` and the only working write channel is the
> built-in `mcp__github__*` tools, which act as the operator. See
> [Environment constraint](#environment-constraint-why-distinct-identities-were-dropped).
> The shipped model therefore reverts to a **single operator identity with
> `<!-- loop-agent -->` marker routing** (the original, proven scheme); the App /
> `GH_TOKEN` / `user.type` / `LOOP_*_BOT_LOGIN` machinery below is historical.
> Current operator steps live in [operator-setup.md](./operator-setup.md).

## Environment constraint (why distinct identities were dropped)

Testing the loop on issues #25 and #35 surfaced a hard platform limit:

- In a Claude Code cloud session, `GH_TOKEN` is a proxy sentinel, and all
  `api.github.com` traffic is re-terminated and mediated by the Anthropic GitHub
  proxy as the **connected operator identity**. `curl api.github.com/user` returns
  `@axross` regardless of the bearer token supplied.
- Repo-scoped REST over the raw path is gated ("GitHub access is not enabled for
  this session"). The sanctioned write channel is the built-in `mcp__github__*`
  tools, which also act as the operator.
- Therefore a routine cannot post as `plan-gengar[bot]`; a self-minted App
  installation token would not be honored. Distinct per-role identities — and the
  `user.type`-based routing and platform-enforced read-only reviewer they enabled —
  are unreachable for an in-session routine.

Resolution: all three routines act as the operator via the `mcp__github__*` tools;
bot-vs-human is told apart by the `<!-- loop-agent -->` marker; hand-offs stay on
labels (identity-independent). Reviewer read-only becomes prompt-enforced. The
stall fix (label hand-offs, reviewer-owned done) is unaffected — it never depended
on identity.

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

## Identity: a separate bot per role

**Decision:** each routine acts as its own GitHub identity — a dedicated machine
user or GitHub App per role (e.g. `bombdog-loop-plan`, `bombdog-loop-code`,
`bombdog-loop-review`), distinct from the human `@axross`. Author login alone
then tells human, planner, coder, and reviewer apart, so the shared-identity
ambiguity that originally forced the `<!-- loop-agent -->` marker disappears.

- **Routing keys on author login**, not on a parsed comment marker: the bridge
  ignores a role's own comments and routes cross-role hand-offs by comparing
  `comment.user.login` to the known bot logins. A shared identity can no longer
  misroute a hand-off.
- **The marker becomes a human-facing badge**, kept for readability and as a
  belt-and-suspenders signal: each role still prefixes its comments with
  `🤖 **loop-<role>**` and an HTML `<!-- loop-<role> -->` line.
- **Per-identity permissions scope each role's writes** — the planner and reviewer
  App tokens are granted **no `contents:write`**, so any write made through their
  token cannot push, while only the coder token can push to `claude/` branches.
  This is the lever that resolves the read-only-reviewer question (see
  [Operator setup](#operator-setup-deltas)). Caveat (found during setup): a
  claude.ai routine still carries the operator's write-capable identity via the
  session's built-in GitHub tools, so the guarantee holds only while each role
  writes exclusively through its scoped `GH_TOKEN`; it is strong but not fully
  airtight. See decision 2.

## Hand-off: labels, not comments

Because bot comments are filtered and CI-green is a non-event, the code↔review
ping-pong is driven by **PR labels**. Label changes emit reliable webhooks, are
attributable by *which label*, and are idempotent because each role removes the
label that woke it before applying the next.

Two PR-level hand-off labels drive the loop (the issue keeps `loop:in-review`
throughout):

| PR label | Applied by | Wakes | Meaning |
| -------- | ---------- | ----- | ------- |
| `loop:review-requested` | Coder | Reviewer | New/updated diff ready to review |
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

PR-level hand-off signal (new, PR only): `loop:review-requested`,
`loop:changes-requested` — see above.

## Transitions

```
issue opened --human adds--> loop:plan --fires--> Planner
Planner --blocking question--> loop:awaiting-answer (yields)
loop:awaiting-answer --human reply--> Planner resumes in place (no relabel)
Planner --plan complete--> loop:plan-review (@axross)
loop:plan-review --human approves--> loop:ready-to-build --fires--> Coder

Coder --opens draft PR--> issue:loop:in-review
                          + PR:loop:review-requested --fires--> Reviewer   ← deterministic first kick

Reviewer round:
  findings?  --yes--> post review comments (as reviewer bot)
                      + PR:loop:changes-requested (drop review-requested) --fires--> Coder
             --no--> flip PR draft→ready, issue:loop:done,
                     drop hand-off labels, @axross summary            ← ONLY the reviewer does this

Coder round:
  address findings, push to claude/ branch, reply on threads (as coder bot)
  --> PR:loop:review-requested (drop changes-requested) --fires--> Reviewer

Human review on the PR (author not a loop bot) --fires--> Coder (same as changes-requested)
CI check_suite.completed on the PR --fires--> Reviewer (re-verify)

Any active phase, genuinely stuck --> loop:blocked (@axross), drop hand-off labels
loop:done  (terminal; further activity is a no-op unless a human reopens)
```

## Termination guard

The ping-pong has no natural stop, and now spans two routines, so the counter
must live in GitHub. **The reviewer owns it** — it is the arbiter.

- The reviewer maintains a single pinned `<!-- loop-agent -->` tracking comment
  (badged `🤖 **loop-review**`) on the PR with a round counter, incremented each
  review round.
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
| `issue_comment.created` (issue, not PR) | author is not a loop bot; issue has a `loop:` label | Planner |
| `pull_request.labeled` | `loop:review-requested` | Reviewer |
| `pull_request.labeled` | `loop:changes-requested` | Coder |
| `pull_request_review.submitted` | author is not a loop bot | Coder |
| `issue_comment.created` (on a PR) | author is not a loop bot | Coder |
| `check_suite.completed` | head branch is a loop PR | Reviewer |

Routing is by **event + label name + author login** (each role is a distinct
bot), never by parsing a comment marker. "Author is not a loop bot" is checked
against the three known bot logins, so any other author is treated as human.
Concurrency groups key on issue number for issue events and PR number for PR
events.

## Why this fixes the stall

- **Every advance is a reliable webhook.** Draft-PR-open is replaced by the coder
  *applying `loop:review-requested`*; CI-green is replaced by `check_suite.completed`.
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
- **A separate GitHub identity per role** (machine user or GitHub App), each
  connected to its own routine, with permissions scoped to the role:
  - **Coder bot** — `contents:write` (push to `claude/` branches), PR write,
    issues/PR comments, labels.
  - **Reviewer bot** — read + PR reviews/comments + labels, **no
    `contents:write`** (cannot push). This makes the read-only contract a
    platform guarantee, resolving decision 2.
  - **Planner bot** — read + issue write/comments + labels, **no
    `contents:write`**.
- Three API-trigger secret pairs (`CLAUDE_LOOP_PLAN_*`, `CLAUDE_LOOP_CODE_*`,
  `CLAUDE_LOOP_REVIEW_*`).
- Extend `loop-dispatch.yaml` with the PR triggers, per-routine URL selection,
  and the known-bot-login list used to distinguish human authors from each role.

## Migration plan

The operator provisioned all three GitHub Apps up front, so the full model is
implemented in one branch rather than phased. The three conceptual steps it
combines:

1. **Reviewer** — the reviewer routine + the two PR hand-off labels + the
   `loop:review-requested` / `loop:changes-requested` / `check_suite` triggers;
   replaces self-review and fixes the #36/#37 stall.
2. **Coder** — its own routine and `code-gengar` identity (the only App with
   Contents:write), with no authority to set `loop:done`.
3. **Planner** — its own routine and read-only `plan-gengar` identity.

Remaining operator work: create the three Apps, routines, and secret pairs per
[operator-setup.md](./operator-setup.md), then merge.

## Decisions

Resolved with `@axross`:

1. **Hand-off mechanism → PR labels.** Reliable, role-attributable webhooks; each
   role removes the label that woke it. (Rejected: sessions directly POSTing the
   next routine's `/fire`, which would embed routine tokens in sessions.)
2. ~~**Reviewer scope enforcement → token-scoped.**~~ **Superseded → prompt-enforced.**
   The scoped-token plan required a per-role App identity, which routines cannot use
   (see [Environment constraint](#environment-constraint-why-distinct-identities-were-dropped)).
   The reviewer shares the operator's identity, so its read-only contract is enforced
   by its prompt and the read-only review phase.
3. ~~**Identity → a separate GitHub bot per role.**~~ **Superseded → single operator
   identity with `<!-- loop-agent -->` marker routing.** Distinct in-session bot
   identities are infeasible; the originally-rejected marker scheme is what the
   platform actually supports and is what ships.
4. **Review hand-off label name → `loop:review-requested`** (not
   `loop:needs-review`). (Unchanged.)
