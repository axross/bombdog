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

- MUST open the pull request in **draft** state with `Closes #<n>` in the body so merging closes the issue.
- MUST structure the body from any repository pull-request template, summarizing the change, the verification evidence, and the acceptance criteria with their status.
- MUST set `loop:in-review` on the issue, then post a marked comment on the issue linking the pull request.
- MUST hand the pull request to the reviewer by applying `loop:review-requested` to it; this label change is the reliable webhook that wakes the reviewer, replacing any dependence on a bot-authored PR-open event or `subscribe_pr_activity`.

## Address Review

The coder is woken to address review by a hand-off, never by its own output:

- the reviewer applied `loop:changes-requested` to the pull request, or
- a human submitted a review or comment on the pull request.

**Guidelines:**

- MUST, on entry, acquire the `loop:active` lock, then re-read the pull request diff, every unresolved review thread, and CI status before acting.
- MUST address and resolve each actionable reviewer or human comment, pushing fixes to the same branch, then reply on the thread with a marked comment noting what changed.
- MUST use `AskUserQuestion`-style escalation — a marked comment that @mentions `@axross` — when a comment is ambiguous or needs a product/architecture decision, rather than guessing.
- MUST re-run the relevant verification after each batch of fixes and keep the pull request body's evidence current.
- MUST, when the batch is addressed, hand back to the reviewer by applying `loop:review-requested` and removing `loop:changes-requested`, then release the lock and exit. The reviewer re-reviews and owns the decision to complete or hand back again.
- MUST NOT flip the pull request to ready or set `loop:done`; the reviewer owns both, so a coder can never leave a pull request "done but draft."

The round counter, the 4-round termination guard, and the draft→ready / `loop:done` completion live with the reviewer; see [review-phase.md](./review-phase.md).
