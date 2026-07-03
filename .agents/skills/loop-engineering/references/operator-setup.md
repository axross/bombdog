# Operator Setup

One-time setup for **this** repository, performed by the operator (`@axross`).
Steps 1-4 are done once; step 5 is per-issue.

The loop runs as three roles, each under its own GitHub App identity and its own
routine: **planner**, **coder**, and **reviewer**. Separate identities mean every
comment and review carries `user.type == 'Bot'`, so the bridge tells humans from
bots generically and routes hand-offs by label — no per-bot login list is needed.

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

## 2. Create the Three Bot Identities (GitHub Apps)

Register one GitHub App per role at **Settings → Developer settings → GitHub Apps**,
install each on this repository, and grant only the permissions its role needs. The
**Contents** permission is the lever: read-only makes pushing and merging
impossible at the platform, so only the coder can change code.

| App (example slug) | Contents | Pull requests | Issues | Checks | Can push/merge? |
| ------------------ | -------- | ------------- | ------ | ------ | --------------- |
| planner (`plan-gengar`) | Read | Read | **Read & write** | Read | No |
| coder (`code-gengar`) | **Read & write** | **Read & write** | **Read & write** | Read | Yes (`claude/` branches) |
| reviewer (`review-gengar`) | Read | **Read & write** | **Read & write** | Read | No |

Notes:

- **Issues: Read & write** is what lets a role apply labels and post comments (PR
  labels are issue labels) and, for the planner, edit the issue title/body.
- Subscribe the Apps to no webhooks; the Actions bridge drives triggers.
- A GitHub App acts as `<app-slug>[bot]` (e.g. `review-gengar[bot]`). You do **not**
  need to record these logins anywhere — the bridge distinguishes bots from humans
  by `user.type`, not by login.

## 3. Create the Three Routines

Create three routines at [claude.ai/code/routines](https://claude.ai/code/routines),
one per App. Each loads the `loop-engineering` skill and runs `/loop`; the bridge
tells each which role it is and which target to act on. **Connect each routine to
its own App identity** (or a token minted from that App installation) so its writes
are bounded by that App's permissions.

- **Planner** — connector: planner App; repository read-only (no pushes).
- **Coder** — connector: coder App; branch pushes `claude/`-prefixed.
- **Reviewer** — connector: reviewer App; repository read-only (no pushes). Its
  Contents:Read ceiling means it cannot push or merge even if a prompt injection
  in PR content told it to.

Prompts (the standing instruction; the per-event context is appended as `text`):

```text
# Planner routine
You are the Loop Engineering planner for this repository. Load the loop-engineering
skill and run the /loop command as the planner role, following references/plan-phase.md.
The triggering event names a GitHub issue. Investigate, ask blocking questions and
yield, or write the comprehensive plan and stop at the approval gate. Advance the
plan phase by one step and exit; if the issue is not in a plan phase, exit as a no-op.
```

```text
# Coder routine
You are the Loop Engineering coder for this repository. Load the loop-engineering
skill and run the /loop command as the coder role, following references/implementation-phase.md.
Build from the approved plan on claude/issue-<n>, verify, open the draft PR, and hand
off to the reviewer with loop:review-requested; on review hand-back, address comments
and re-request review. Advance by one step and exit. Never set loop:done or flip a PR
to ready — that is the reviewer's role.
```

```text
# Reviewer routine
You are the Loop Engineering reviewer for this repository. Load the loop-engineering
skill and run the /loop command as the reviewer role, following references/review-phase.md.
You are read-only: never edit files, push, or merge. Re-read the diff, the unresolved
threads, the linked issue's acceptance criteria, and CI; post findings as your own
review comments and apply loop:changes-requested, or — on a clean round with green CI —
flip the PR to ready, set loop:done, and @mention @axross. Respect the 4-round
termination guard. Advance by one step and exit.
```

## 4. Add the Triggers and the Bridge

Cloud routines cannot trigger natively on issues or issue comments, and hand-offs
must route by event + label + author rather than by parsing comment markers, so all
triggers go through the GitHub Actions bridge.

1. On **each** routine, add an **API** trigger and generate a token; copy the
   `/fire` URL and token immediately (the token is shown once).
2. Add them as repository secrets:
   - planner: `CLAUDE_LOOP_PLAN_URL`, `CLAUDE_LOOP_PLAN_TOKEN`
   - coder: `CLAUDE_LOOP_CODE_URL`, `CLAUDE_LOOP_CODE_TOKEN`
   - reviewer: `CLAUDE_LOOP_REVIEW_URL`, `CLAUDE_LOOP_REVIEW_TOKEN`
3. `.github/workflows/loop-dispatch.yaml` (already committed) fires the right
   routine per event: issue label/comment → planner; `loop:ready-to-build`,
   `loop:changes-requested`, and human PR reviews/comments → coder;
   `loop:review-requested` and `check_suite.completed` → reviewer. Comments and
   reviews with `user.type == 'Bot'` are ignored, so no role fires on another's
   (or its own) output.

## 5. Run the Loop

- Enroll an issue by applying `loop:plan`. The bridge fires the planner.
- Answer the planner's questions by commenting on the issue; the bridge resumes it.
- Approve the refined plan by applying `loop:ready-to-build`; the coder builds,
  opens the draft pull request, and applies `loop:review-requested`.
- The reviewer reviews: it either leaves findings and applies
  `loop:changes-requested` (the coder addresses and re-requests review) or, on a
  clean round with green CI, flips the PR to ready and sets `loop:done`, mentioning
  you. Merging stays your call.

## Caveats

- **Role scope is enforced, not requested**: the planner and reviewer Apps have
  Contents:Read, so a prompt injection in a PR comment or CI log cannot make them
  push or merge — the platform rejects it. Only the coder App can change code.
- **Caps and cost**: routines have a daily run cap and draw metered usage; GitHub
  webhook triggers have per-account hourly caps. The reviewer's 4-round guard
  bounds the coder↔reviewer loop. `check_suite.completed` fires the reviewer for
  any non-`main` branch CI run; the reviewer exits immediately unless the PR carries
  `loop:review-requested`, so extra fires are cheap no-ops rather than wrong action.
- **Latency**: the bridge is real-time. A **schedule** trigger, if added as a
  fallback, has a one-hour minimum interval.
- **Green status is not success**: a green run only means the session did not
  error. Open the run to confirm the phase actually advanced.
