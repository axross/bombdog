# Implementation Phase

The implementation phase is run by the **coder**. It builds the approved plan,
opens a draft pull request, hands the diff to an independent reviewer, and
addresses the findings the reviewer hands back — a coder↔reviewer loop. It starts
when the human applies `loop:ready-to-build`.

The coder does **not** review its own work to decide it is done, and does **not**
flip the pull request to ready or set `loop:done`; those belong to the reviewer
(see [review-phase.md](./review-phase.md)). The coder's job is to build, verify,
hand off, and fix.

## Build

**Guidelines:**

- MUST implement strictly from the plan recorded in the issue body, keeping edits within the smallest surface that satisfies the acceptance criteria.
- MUST work on a `claude/issue-<n>` branch (the routine's `claude/`-prefixed branch convention) and never push to `main`.
- MUST follow every project skill whose routing condition matches the changed files, and add or update the E2E and unit coverage the plan named.
- MUST perform a reviewer-mode reset and fix Critical/Major findings before opening the pull request, per [Code Review Guideline](../../code-review-guideline/SKILL.md); this is a self-check to avoid obvious hand-backs, not the authoritative review, which the independent reviewer owns.

## Verify

Defer to [Development Guidelines › verification](../../development-guidelines/references/verification.md) for which output surface each change puts at risk and the authoritative command set; the commands below are the common cases.

**Guidelines:**

- MUST run `npm run format` and `npm run lint` after code or documentation edits.
- MUST run `npm run typecheck` when the change affects TypeScript types or signatures.
- MUST run `npm run test:unit`, and run `npm run test:e2e` when the change affects a UI output surface or e2e coverage.
- MUST run `npm run build` when the change affects routes, metadata, runtime config, dependencies, or TypeScript signatures.
- MUST report which verification commands ran, their result, and any skipped check with its residual risk, in the pull request body.

## Open the Draft Pull Request and Hand Off

**Guidelines:**

- MUST open the pull request in **draft** state with `Closes #<n>` in the body
  so merging closes the issue; record the number GitHub assigns the new pull
  request — it is a different number from the issue's own, even though the
  body says `Closes #<n>`.
- MUST structure the body from any repository pull-request template,
  summarizing the change, the verification evidence, and the acceptance
  criteria with their status.
- MUST set `loop:in-review` on the **issue** (`#<n>`, the number the routine
  was dispatched for), then post a marked comment on the issue linking the
  pull request.
- MUST hand off to the reviewer by applying `loop:review-requested` to the
  **pull request**, addressed by the pull request's own number from the first
  bullet above, not the issue's number; this label change is the reliable
  webhook that wakes the reviewer, replacing any dependence on a bot-authored
  PR-open event. See [state-machine.md](./state-machine.md) § Issue vs. Pull
  Request Targets for why these two writes must never be swapped.

## Live Session Ownership

The coder MAY keep **one** session alive across the whole coder↔reviewer loop,
so the same context that built the diff also addresses the review — a warm-memory
optimization layered on top of the stateless-worker model, never a replacement
for it. GitHub stays the source of truth: a live session that dies is transparently
superseded by a fresh bridge-fired coder that reconstructs state from GitHub, so
losing the warm session costs only re-reading, never correctness.

There are two entry modes for a coder turn:

- **Cold (the fallback and guaranteed floor):** the Actions bridge fires a fresh
  coder on `loop:ready-to-build`, PR `loop:changes-requested`, or a human PR
  review/comment. This is the original stateless behavior — it reconstructs
  everything from GitHub and needs no live session.
- **Live (the optimization):** after opening the draft pull request, the build
  session subscribes to the pull request and stays alive, handling each review
  round in the same session until the reviewer completes or blocks the loop.

Live mode is coordinated by a **coder-liveness heartbeat**, distinct from the
short-lived `loop:active` mutation lock (see
[state-machine.md](./state-machine.md) § Live Coder Session). The heartbeat says
"a live coder owns the next coder turn"; the lock stays the brief per-step mutex
so the reviewer — which needs the same `loop:active` lock — is never starved.

**Guidelines:**

- MAY, after applying `loop:review-requested` for the first time, enter live mode:
  call `subscribe_pr_activity` on the pull request and remain the session instead
  of exiting.
- MUST, in live mode, maintain a single pinned coder-liveness heartbeat comment on
  the pull request — the standard loop header (badged `🔨 **Loop Engineering —
  Code**`) plus a `<!-- loop-coder-live -->` marker line — and refresh its
  timestamp on every wake and on a self-scheduled check-in strictly under 30
  minutes apart, so a concurrent bridge-fired coder can judge liveness.
- MUST, on entry to any coder turn, check the coder-liveness heartbeat: a
  bridge-fired (cold) session whose pull request carries a `<!-- loop-coder-live -->`
  heartbeat under 30 minutes old MUST exit as a no-op and let the live session
  handle the round; a heartbeat 30+ minutes old or absent means the live session
  died, so the cold session reclaims, proceeds, and MAY itself enter live mode.
- MUST keep the `loop:active` mutation lock short-lived exactly as in the cold
  model — acquire it only while building or pushing a batch of fixes and release it
  immediately after — and MUST NOT hold it while waiting between rounds, because the
  reviewer acquires the same lock to review.
- MUST, in live mode, act only on reviewer or human review activity delivered by
  the subscription; treat CI events and the loop's own output as no-ops, mirroring
  "woken by a hand-off, never by its own output."
- MUST leave live mode — mark the coder-liveness heartbeat released (edit it to
  drop the `<!-- loop-coder-live -->` marker), call the paired unsubscribe, and
  exit — when the reviewer sets `loop:done`, when any role sets `loop:blocked`, or
  when the keep-alive budget is exhausted. Post-done human follow-up (see "Address
  Review After Done") is then handled cold by the bridge, exactly as today.

## Address Review

The coder is woken to address review by a hand-off, never by its own output. In
the cold model each of these is a fresh bridge-fired session; in live mode the same
events arrive over the subscription and are handled in the session that built the
diff:

- the reviewer applied `loop:changes-requested` to the pull request, or
- a human submitted a review or comment on the pull request, or
- a human submitted a review or comment on the pull request even after the issue already carries `loop:done` — the pull request stays open for exactly this kind of follow-up (see "Address Review After Done" below).

**Guidelines:**

- MUST, on entry, acquire the `loop:active` lock, then re-read the pull request diff, every unresolved review thread, and CI status before acting.
- MUST address and resolve each actionable reviewer or human comment, pushing fixes to the same branch, then reply on the thread with a marked comment noting what changed.
- MUST use `AskUserQuestion`-style escalation — a marked comment that @mentions `@axross` — when a comment is ambiguous or needs a product/architecture decision, rather than guessing.
- MUST re-run the relevant verification after each batch of fixes and keep the pull request body's evidence current.
- MUST, when the batch is addressed, hand back to the reviewer by applying `loop:review-requested` and removing `loop:changes-requested`, then release the `loop:active` lock. In the cold model the session then exits; in live mode it refreshes the coder-liveness heartbeat and keeps waiting on the subscription instead of exiting. Either way the reviewer re-reviews and owns the decision to complete or hand back again.
- MUST NOT flip the pull request to ready or set `loop:done`; the reviewer owns both, so a coder can never leave a pull request "done but draft."

### Address Review After Done

**Guidelines:**

- MUST, when woken while the issue carries `loop:done`, answer the human directly with a marked reply before deciding whether any code change follows; MUST NOT reply with only a rationale for inaction.
- MUST NOT unilaterally decide an ambiguous comment is out of scope and redirect the human to file a new issue; when it is unclear whether the human wants a change made now, ask (a marked comment mentioning `@axross`) rather than deciding on their behalf.
- MUST, once a change is confirmed or unambiguously requested, reopen the loop: replace `loop:done` with `loop:in-review` on the issue, convert the pull request back to draft if the reviewer had flipped it to ready, push the fix, and hand off to the reviewer by applying `loop:review-requested` — a fresh round (see [review-phase.md](./review-phase.md)'s Termination Guard).
- MUST NOT, even when reopening, set `loop:done` or flip the pull request to ready itself; those remain the reviewer's alone, matching the existing role boundary.

The round counter, the 4-round termination guard, and the draft→ready / `loop:done` completion live with the reviewer; see [review-phase.md](./review-phase.md).
