# Operator Setup

One-time setup for **this** repository, performed by the operator (`@axross`).
Steps 1-4 are done once; step 5 is per-issue.

The loop runs as three roles, each under its own GitHub App identity and its own
routine: **planner**, **coder**, and **reviewer**. Separate identities mean every
comment and review carries `user.type == 'Bot'`, so the bridge tells humans from
bots generically and routes hand-offs by label. Each App's bot login is also
recorded in a `LOOP_*_BOT_LOGIN` variable and excluded explicitly, as a
belt-and-suspenders complement to the `user.type` check.

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
**Contents** permission is the lever: an App installation token scoped to
Contents:Read cannot push or merge, so any GitHub write the routine makes **with
that token** is bounded by the App's permissions (see the identity note in step 3,
including its residual-risk caveat).

| App (example slug) | Contents | Pull requests | Issues | Checks | Can push/merge? |
| ------------------ | -------- | ------------- | ------ | ------ | --------------- |
| planner (`plan-gengar`) | Read | Read | **Read & write** | Read | No |
| coder (`code-gengar`) | **Read & write** | **Read & write** | **Read & write** | Read | Yes (`claude/` branches) |
| reviewer (`review-gengar`) | Read | **Read & write** | **Read & write** | Read | No |

Notes:

- **Issues: Read & write** is what lets a role apply labels and post comments (PR
  labels are issue labels) and, for the planner, edit the issue title/body.
- Subscribe the Apps to no webhooks; the Actions bridge drives triggers.
- A GitHub App acts as `<app-slug>[bot]`, where `<app-slug>` is the slug in the
  App's public URL `https://github.com/apps/<app-slug>`. Record each role's full
  bot login **including the `[bot]` suffix** for the variables in step 4 (e.g.
  `plan-gengar[bot]`, `code-gengar[bot]`, `review-gengar[bot]`). Confirm each
  against a real comment once the App has acted (`user.type` reads `Bot`).

## 3. Create the Three Routines

Create three routines at [claude.ai/code/routines](https://claude.ai/code/routines),
one per App. Each loads the `loop-engineering` skill and runs `/loop`; the bridge
tells each which role it is and which target to act on.

### Making a routine act as its App identity

A routine has no "act as App" setting — by default it authenticates as your
connected GitHub user (`@axross`). Commits and pushes staying `@axross` is fine and
expected. But **issue and pull-request comments and reviews must carry the role's
own `[bot]` identity**: the bridge tells bots from humans by `user.type`, so a
comment posted as `@axross` (type `User`) would look like human input and re-fire
the loop. So inject the App's installation token into that routine's **environment**
and make the role's **GitHub API writes** (comments, reviews, labels, draft→ready)
through it, while leaving git commits/pushes on the default identity:

1. Give each routine its **own environment**. Add the App's **App ID** and
   **private key (PEM)** as environment secrets (`APP_ID`, `APP_PRIVATE_KEY`). The
   installation ID is derived below, so it does not need to be stored.
2. In the environment's **setup script**, mint a fresh installation access token
   (they expire ~1h, so mint per session), export it as `GH_TOKEN`, and install
   `gh` (not pre-installed):

   ```bash
   set -euo pipefail
   apt-get update && apt-get install -y gh jq openssl
   REPO="axross/bombdog"   # owner/repo this App is installed on

   # 1. Build a short-lived App JWT (RS256, <=10 min lifetime).
   key_file="$(mktemp)"; trap 'rm -f "$key_file"' EXIT
   printf '%s\n' "$APP_PRIVATE_KEY" > "$key_file"
   b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }
   now="$(date +%s)"
   jwt_header="$(printf '%s' '{"alg":"RS256","typ":"JWT"}' | b64url)"
   jwt_claims="$(printf '{"iat":%d,"exp":%d,"iss":"%s"}' "$((now - 60))" "$((now + 540))" "$APP_ID" | b64url)"
   jwt_sig="$(printf '%s' "${jwt_header}.${jwt_claims}" | openssl dgst -sha256 -sign "$key_file" -binary | b64url)"
   jwt="${jwt_header}.${jwt_claims}.${jwt_sig}"

   # Reusable curl wrapper: fail on HTTP >=400 (but print the body), stay quiet otherwise.
   gh_api() {
     curl --fail-with-body -sS \
       -H "Authorization: Bearer ${jwt}" \
       -H "Accept: application/vnd.github+json" \
       -H "X-GitHub-Api-Version: 2022-11-28" \
       "$@"
   }

   # 2. Resolve the installation for this repo.
   install_id="$(gh_api "https://api.github.com/repos/${REPO}/installation" | jq -er '.id')"

   # 3. Mint an installation access token (~1h TTL).
   GH_TOKEN="$(gh_api -X POST \
     "https://api.github.com/app/installations/${install_id}/access_tokens" | jq -er '.token')"
   export GH_TOKEN   # gh reads this; use it for comments/reviews/labels (App identity)

   # Note: do NOT route git through this token — commits/pushes stay on the default
   # (@axross) identity, which is intended. GH_TOKEN is only for gh API writes.
   ```

   `curl` practices used above: `--fail-with-body` turns HTTP 4xx/5xx into a
   non-zero exit while still printing GitHub's JSON error, `-sS` silences the
   progress meter but keeps real errors, the explicit `Accept` and
   `X-GitHub-Api-Version` headers pin the API version, and `jq -e` exits non-zero
   if the field is missing so `set -euo pipefail` aborts instead of exporting an
   empty token.

   Persistence and TTL: a `GH_TOKEN` exported inside the setup script may not carry
   into the session's later shells, and the token lasts only ~1h. Persist it where
   `gh` will read it — e.g. append `export GH_TOKEN=...` to the shell profile the
   session sources — and re-mint (re-run the block) if a run outlives the token.
   Keep `GH_TOKEN` out of logs and the repository.

3. **Post every issue/PR comment and review — plus label and draft→ready writes —
   through `gh` using `GH_TOKEN`.** The session's *built-in* GitHub tools
   authenticate as `@axross` through the proxy, so a comment made with them posts as
   you (type `User`) and would break the bridge's bot/human routing (it would look
   like human input and re-fire the loop). **Git commits and pushes use the default
   identity** and are correctly attributed to `@axross`.

**Residual-risk caveat:** commits/pushes are intentionally `@axross`. For the
*read-only* roles (planner, reviewer), the App token bounds the API writes made
with it, but the session still carries `@axross`'s write-capable identity via the
built-in tools — so "the reviewer never changes code" rests on its prompt
(read-only, no built-in write tools), not on an airtight platform block. Fully
airtight enforcement would require each routine on a separate claude.ai account
with a read-only GitHub identity, which is not worth the overhead here.

Per-role environment intent:

- **Planner** — planner App token (`GH_TOKEN`) for issue comments; no pushes.
- **Coder** — coder App token for PR/issue comments and reviews; commits and
  `claude/` pushes use the default `@axross` identity.
- **Reviewer** — reviewer App token for review comments, labels, and the
  draft→ready flip; no pushes. Its Contents:Read token cannot
  push or merge; see the caveat above for the ambient-identity residual risk.

Prompts (the standing instruction; the per-event context is appended as `text`):

```text
# Planner routine
You are the Loop Engineering planner for this repository. Load the loop-engineering
skill and run the /loop command as the planner role, following references/plan-phase.md.
The triggering event names a GitHub issue. Investigate, ask blocking questions and
yield, or write the comprehensive plan and stop at the approval gate. Advance the
plan phase by one step and exit; if the issue is not in a plan phase, exit as a no-op.
Post issue comments and edits with gh using $GH_TOKEN (your App identity) — never the
built-in GitHub tools, which post as the operator and would re-fire the loop.
```

```text
# Coder routine
You are the Loop Engineering coder for this repository. Load the loop-engineering
skill and run the /loop command as the coder role, following references/implementation-phase.md.
Build from the approved plan on claude/issue-<n>, verify, open the draft PR, and hand
off to the reviewer with loop:review-requested; on review hand-back, address comments
and re-request review. Advance by one step and exit. Never set loop:done or flip a PR
to ready — that is the reviewer's role. Post PR/issue comments and reviews with gh
using $GH_TOKEN (your App identity) so they carry the bot identity; git commits and
pushes use the default identity. Never post comments with the built-in GitHub tools.
```

```text
# Reviewer routine
You are the Loop Engineering reviewer for this repository. Load the loop-engineering
skill and run the /loop command as the reviewer role, following references/review-phase.md.
You are read-only: never edit files, push, or merge. Re-read the diff, the unresolved
threads, the linked issue's acceptance criteria, and CI; post findings as your own
review comments and apply loop:changes-requested, or — on a clean round with green CI —
flip the PR to ready, set loop:done, and @mention @axross. Respect the 4-round
termination guard. Advance by one step and exit. Post review comments, labels, and
the draft→ready flip with gh using $GH_TOKEN, your read-only App identity — never the
built-in GitHub tools (they carry the operator's write-capable identity).
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
3. Add the three App bot logins as repository **variables** (from step 2), so the
   bridge can exclude the loop Apps by login as well as by `user.type`:
   - `LOOP_PLAN_BOT_LOGIN` = `plan-gengar[bot]`
   - `LOOP_CODE_BOT_LOGIN` = `code-gengar[bot]`
   - `LOOP_REVIEW_BOT_LOGIN` = `review-gengar[bot]`
4. `.github/workflows/loop-dispatch.yaml` (already committed) fires the right
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

- **Role scope is token-bounded, with a residual caveat**: the planner and reviewer
  App tokens have Contents:Read, so any write made through their `GH_TOKEN` cannot
  push or merge. But the routine also carries the operator's write-capable identity
  via the built-in GitHub tools, so the read-only contract holds only while each
  role writes exclusively through its scoped `GH_TOKEN` (as its prompt requires).
  See step 3's residual-risk caveat.
- **Caps and cost**: routines have a daily run cap and draw metered usage; GitHub
  webhook triggers have per-account hourly caps. The reviewer's 4-round guard
  bounds the coder↔reviewer loop. `check_suite.completed` fires the reviewer for
  any non-`main` branch CI run; the reviewer exits immediately unless the PR carries
  `loop:review-requested`, so extra fires are cheap no-ops rather than wrong action.
- **Latency**: the bridge is real-time. A **schedule** trigger, if added as a
  fallback, has a one-hour minimum interval.
- **Green status is not success**: a green run only means the session did not
  error. Open the run to confirm the phase actually advanced.
