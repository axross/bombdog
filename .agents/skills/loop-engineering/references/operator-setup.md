# Operator Setup

One-time setup for **this** repository, performed by the operator (`@axross`).
Steps 1-3 are done once; step 4 is per-issue.

The loop runs as three roles, each with its own routine and dedicated prompt:
**planner**, **coder**, and **reviewer**. Cloud routines cannot act as a distinct
bot identity in-session — GitHub access is proxy-mediated as the connected user — so
all three act as the operator (`@axross`) via the built-in GitHub (`mcp__github__*`)
tools. The bridge tells agent output from human input by the `<!-- loop-agent -->`
marker every agent comment carries, and routes cross-role hand-offs by label.

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

## 2. Create the Three Routines

Create three routines at [claude.ai/code/routines](https://claude.ai/code/routines),
one per role. Each loads the `loop-engineering` skill and runs `/loop`; the bridge
tells each which role it is and which target to act on. All three use the operator's
GitHub connection — there is nothing to bind per role, and no App, token, or hook to
configure.

- **Repositories**: this repository. The coder needs to push, which `claude/`-prefixed
  branches allow by default; the planner and reviewer do not push. **Environment**:
  the project environment with the `SessionStart` hook so the toolchain is ready.
- **Connectors**: keep the GitHub connector; remove any the loop does not need.
- **GitHub writes go through the built-in `mcp__github__*` tools.** They act as the
  operator, which is the only identity available in-session; direct `gh`/`curl` calls
  to `api.github.com` are gated by the proxy and must not be used.

Each routine's standing prompt follows. The bridge appends the per-event context as
the `text` field, so the prompt only needs the role's standing instruction. Copy one
block, verbatim, into each routine's prompt field.

**Planner routine**

```text
You are the Loop Engineering planner for this repository. Load the `loop-engineering` skill and run the `/loop` command as the planner role, following `references/plan-phase.md`.

The triggering event names a GitHub issue. Investigate, ask blocking questions and yield, or write the comprehensive plan and stop at the approval gate. Advance the plan phase by **one step** and exit; if the issue is not in a plan phase, exit as a no-op. Use the built-in `mcp__github__` tools for all reads and writes, and begin every comment with the standard loop header (`references/state-machine.md`): a `<!-- loop-agent -->` marker line, then `> 🧭 **Loop Engineering — Plan** · <sub>Claude Code · [session ↗](URL)</sub>`.
```

**Coder routine**

```text
You are the Loop Engineering coder for this repository. Load the `loop-engineering` skill and run the `/loop` command as the coder role, following `references/implementation-phase.md`.

Build from the approved plan on `claude/issue-<n>`, verify, open the draft PR, and hand off to the reviewer by applying `loop:review-requested`; on review hand-back, address comments and re-request review. You MAY keep this one session alive across the coder↔reviewer loop per `references/implementation-phase.md` § Live Session Ownership (subscribe to the PR, maintain the `<!-- loop-coder-live -->` heartbeat, and handle each round in-session); otherwise advance by **one step** and exit. Either way, a bridge-fired session that finds a fresh `<!-- loop-coder-live -->` heartbeat exits as a no-op. **Never set `loop:done` or flip a PR to ready** — that is the reviewer's role. Use the built-in `mcp__github__` tools, and begin every comment with the standard loop header (`references/state-machine.md`): a `<!-- loop-agent -->` marker line, then `> 🔨 **Loop Engineering — Code** · <sub>Claude Code · [session ↗](URL)</sub>`.
```

**Reviewer routine**

```text
You are the Loop Engineering reviewer for this repository. Load the `loop-engineering` skill and run the `/loop` command as the reviewer role, following `references/review-phase.md`.

You are **read-only**: never edit files, push, or merge. Re-read the diff, the unresolved threads, the linked issue's acceptance criteria, and CI; post findings as review comments and apply `loop:changes-requested`, or — on a clean round with green CI — flip the PR to ready, set `loop:done`, and @mention `@axross`. Respect the 4-round termination guard. Advance by **one step** and exit. Use the built-in `mcp__github__` tools, and begin every comment with the standard loop header (`references/state-machine.md`): a `<!-- loop-agent -->` marker line, then `> 🔍 **Loop Engineering — Review** · <sub>Claude Code · [session ↗](URL)</sub>`.
```

## 3. Add the Triggers and the Bridge

Cloud routines cannot trigger natively on issues or issue comments, so all triggers
go through the GitHub Actions bridge, which fires the right routine per event.

1. On **each** routine, add an **API** trigger and generate a token; copy the
   `/fire` URL and token immediately (the token is shown once).
2. Add them as repository secrets:
   - planner: `CLAUDE_LOOP_PLAN_URL`, `CLAUDE_LOOP_PLAN_TOKEN`
   - coder: `CLAUDE_LOOP_CODE_URL`, `CLAUDE_LOOP_CODE_TOKEN`
   - reviewer: `CLAUDE_LOOP_REVIEW_URL`, `CLAUDE_LOOP_REVIEW_TOKEN`
3. Install the [Claude GitHub App](https://github.com/apps/claude) on the repository.
   The bridge subscribes to `pull_request`, `pull_request_review`, and `check_suite`
   events, which the App delivers; without it those PR-side triggers never fire.
4. `.github/workflows/loop-dispatch.yaml` (already committed) fires the right
   routine per event: issue label/comment → planner; `loop:ready-to-build`,
   `loop:changes-requested`, and human PR reviews/comments → coder;
   `loop:review-requested` and `check_suite.completed` → reviewer. Comments and
   reviews carrying `<!-- loop-agent -->` are ignored, so no role fires on its own
   (or another role's) output.

## 4. Run the Loop

- Enroll an issue by applying `loop:plan`. The bridge fires the planner.
- Answer the planner's questions by commenting on the issue (an unmarked human
  comment); the bridge resumes it.
- Approve the refined plan by applying `loop:ready-to-build`; the coder builds,
  opens the draft pull request, and applies `loop:review-requested`.
- The reviewer reviews: it either leaves findings and applies
  `loop:changes-requested` (the coder addresses and re-requests review) or, on a
  clean round with green CI, flips the PR to ready and sets `loop:done`, mentioning
  you. Merging stays your call.

## Caveats

- **Single identity**: all three routines act as `@axross`, so every loop comment,
  review, and commit is attributed to the operator. The `<!-- loop-agent -->` marker
  is the only thing that distinguishes agent output from a human reply — the bridge
  and the agents both depend on it, and every agent comment must carry it.
- **Reviewer read-only is prompt-enforced**: because the reviewer shares the
  operator's write-capable identity, its "never edit, push, or merge" contract rests
  on its prompt and the read-only review phase, not on a platform permission block.
  A separate, genuinely read-only identity is not achievable for an in-session
  routine.
- **Use the built-in GitHub tools, not raw REST**: `api.github.com` is proxy-mediated
  in cloud sessions and direct `gh`/`curl` calls are gated ("GitHub access is not
  enabled for this session"); the `mcp__github__*` tools are the working channel.
- **Caps and cost**: routines have a daily run cap and draw metered usage; GitHub
  webhook triggers have per-account hourly caps. The reviewer's 4-round guard bounds
  the coder↔reviewer loop. `check_suite.completed` fires the reviewer for any
  non-`main` branch CI run; the reviewer exits immediately unless the PR carries
  `loop:review-requested`, so extra fires are cheap no-ops.
- **Green status is not success**: a green run only means the session did not error.
  Open the run to confirm the phase actually advanced.
- **Live coder keep-alive draws usage**: when the coder holds one session open across
  the review loop (`references/implementation-phase.md` § Live Session Ownership), its
  sub-30-minute heartbeat check-ins draw metered usage and count against the routine
  daily-run cap for as long as the review is outstanding. The bridge coder triggers
  are left in place as the fallback, so a coder that exits (or is reclaimed) simply
  reverts to the cold, stateless path with no lost state — the optimization is safe to
  skip under cap pressure.
