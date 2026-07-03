# Operator Setup

One-time setup for **this** repository, performed by the operator (`@axross`).
Steps 1-4 are done once; step 5 is per-issue.

This reflects the phased rollout (see
[multi-agent-loop-proposal.md](./multi-agent-loop-proposal.md)): a **plan+build
routine** (planner + coder, under the operator's identity) and a separate
**reviewer routine** with its own read-only bot identity. Splitting the planner
and coder into their own routines is a later phase and is not set up here.

## 1. Create the Labels

Create the `loop:*` labels the state machine uses (via the GitHub UI or `gh`).
Colors follow a convention: **yellow** (`fbca04`) for states waiting on a human,
**green** (`0e8a16`) for the review-ready done state, **red** (`d73a4a`) for the
blocked state, and **blue** (`1d76db`) for every agent-active state:

```bash
for l in \
  "loop:plan|1d76db|Queued for or in planning" \
  "loop:awaiting-answer|fbca04|Paused on a human answer" \
  "loop:plan-review|fbca04|Plan written; awaiting approval" \
  "loop:ready-to-build|1d76db|Approved; implementation may start" \
  "loop:in-review|1d76db|Draft PR open; coder<->reviewer loop active" \
  "loop:review-requested|1d76db|PR handed to the reviewer" \
  "loop:changes-requested|fbca04|Reviewer left findings; coder to address" \
  "loop:done|0e8a16|PR review-ready; handed back" \
  "loop:active|1d76db|Concurrency lock; a session is working this" \
  "loop:blocked|d73a4a|Needs human intervention" ; do
  IFS='|' read -r name color desc <<< "$l"
  gh label create "$name" --color "$color" --description "$desc" --force
done
```

The human applies `loop:plan` to enroll an issue and `loop:ready-to-build` to
approve a plan. The agents own every other `loop:*` label;
`loop:review-requested` / `loop:changes-requested` are PR labels the coder and
reviewer swap to hand off.

## 2. Create the Reviewer Bot Identity

The reviewer must be independent of the coder and unable to change code, so it
runs under its own GitHub identity with **no write access to code**. Use a
**GitHub App** (recommended) or a dedicated machine user, separate from `@axross`.

**GitHub App (recommended):**

1. Register the App at **Settings → Developer settings → GitHub Apps → New GitHub
   App**, e.g. named `bombdog-loop-reviewer`.
2. Grant only the repository permissions the reviewer needs — this is what enforces
   the read-only contract at the platform:
   - **Contents: Read-only** (must **not** be Read & write — this is what stops it
     pushing or merging)
   - **Pull requests: Read & write** (submit reviews, comments)
   - **Issues: Read & write** (comments and labels — GitHub groups label writes
     under Issues)
   - **Checks: Read-only** (read CI status)
   - Metadata: Read-only (mandatory, added automatically)
3. Subscribe to no webhooks (the Actions bridge drives triggers, not the App).
4. **Install** the App on this repository.
5. Record its bot login for the bridge (step 4). A GitHub App acts as
   `<app-slug>[bot]`, where `<app-slug>` is the slug in the App's public URL
   `https://github.com/apps/<app-slug>`. The `LOOP_REVIEW_BOT_LOGIN` value is that
   full string **including the `[bot]` suffix**, e.g. `bombdog-loop-reviewer[bot]`.
   Confirm it against a real comment once the App has acted (the author `login`
   in the API / webhook payload is authoritative; `user.type` reads `Bot`).

**Machine user (alternative):** create a dedicated account and add it as a
repository collaborator with the **Triage** role — read + manage issues/PRs
(labels, reviews, comments) but no push or merge. Its `LOOP_REVIEW_BOT_LOGIN` is
just its username (no `[bot]` suffix).

## 3. Create the Routines

Create two routines at [claude.ai/code/routines](https://claude.ai/code/routines).
Both load the `loop-engineering` skill and run `/loop`; the bridge tells each which
role it is and which target to act on.

**Plan+build routine** (planner + coder):

- **Repositories**: this repository. Branch pushes: `claude/`-prefixed (the coder
  pushes here). **GitHub connector**: the operator's identity.
- **Prompt**:

  ```text
  You are the Loop Engineering plan+build worker for this repository. Load the
  loop-engineering skill and run the /loop command. The triggering event context
  follows this prompt: it names a GitHub issue or pull request, the event that
  fired, and your role. Read the target's current loop:* label and full comment
  thread, then advance the state machine by exactly one step per the skill, and
  exit. Never set loop:done or flip a PR to ready — that is the reviewer's role.
  Do not skip the concurrency-lock and bot-identity-marker rules.
  ```

**Reviewer routine**:

- **Repositories**: this repository, **read-only** — no branch pushes. **GitHub
  connector**: authenticate as the reviewer bot from step 2 (the installed GitHub
  App, or the machine user). Its Contents:Read-only ceiling means the reviewer
  cannot push even if a prompt injection told it to. If the routine connector
  cannot authenticate as the App directly, use a token minted from the App
  installation (or the machine user's fine-grained token) scoped to the same
  read-only permissions.
- **Model / network**: read + comment only; no build/push is expected.
- **Prompt**:

  ```text
  You are the Loop Engineering reviewer for this repository. Load the
  loop-engineering skill and run the /loop command as the reviewer role, following
  references/review-phase.md. The triggering event names a pull request. You are
  read-only: never edit files, push, or merge. Re-read the diff, the unresolved
  threads, the linked issue's acceptance criteria, and CI; post findings as your
  own review comments and apply loop:changes-requested, or — on a clean round with
  green CI — flip the PR to ready, set loop:done, and @mention @axross. Respect the
  4-round termination guard. Advance by one step and exit.
  ```

## 4. Add the Triggers and the Bridge

Cloud routines can trigger natively on pull-request and release events but not on
issues or issue comments, and hand-offs must route by event + label + author login
rather than by parsing comment markers. Both halves therefore go through the
GitHub Actions bridge, which calls each routine's API trigger.

1. On **each** routine, add an **API** trigger and generate a token; copy the
   `/fire` URL and token immediately (the token is shown once).
2. Add them as repository secrets:
   - plan+build: `CLAUDE_LOOP_ROUTINE_URL`, `CLAUDE_LOOP_ROUTINE_TOKEN`
   - reviewer: `CLAUDE_LOOP_REVIEW_URL`, `CLAUDE_LOOP_REVIEW_TOKEN`
3. Add the repository **variable** `LOOP_REVIEW_BOT_LOGIN` = the reviewer bot's
   login, so the bridge can tell the reviewer's comments/reviews from a human's.
4. `.github/workflows/loop-dispatch.yaml` (already committed) fires the right
   routine per event: issue label/comment and `loop:changes-requested` /
   human PR review → plan+build; `loop:review-requested` and
   `check_suite.completed` → reviewer. It skips loop-bot authors and marked
   comments.

## 5. Run the Loop

- Enroll an issue by applying `loop:plan`. The bridge fires plan+build; the plan
  phase runs.
- Answer the agent's questions by commenting on the issue (an unmarked human
  comment); the bridge resumes the loop.
- Approve the refined plan by applying `loop:ready-to-build`; the coder builds,
  opens the draft pull request, and applies `loop:review-requested`.
- The reviewer reviews: it either leaves findings and applies
  `loop:changes-requested` (the coder addresses and re-requests review) or, on a
  clean round with green CI, flips the PR to ready and sets `loop:done`, mentioning
  you. Merging stays your call.

## Caveats

- **Reviewer independence is enforced, not requested**: the reviewer bot has no
  `contents:write`, so a prompt injection in a PR comment or CI log cannot make it
  push a change — the platform rejects it.
- **Shared identity (plan+build)**: the plan+build routine still acts as the
  operator's user, so its comments and the human's share an author. The
  `<!-- loop-agent -->` marker disambiguates them; the reviewer, on its own
  identity, is told apart by login.
- **Caps and cost**: routines have a daily run cap and draw metered usage; GitHub
  webhook triggers have per-account hourly caps. The reviewer's 4-round guard
  bounds the coder↔reviewer loop.
- **Latency**: the bridge is real-time. A **schedule** trigger, if added as a
  fallback, has a one-hour minimum interval.
- **Green status is not success**: a green run only means the session did not
  error. Open the run to confirm the phase actually advanced.
