# CI Tail and Resume

After the driver pushes, CI ([`.github/workflows/merge-checks.yaml`](../../../.github/workflows/merge-checks.yaml): lint + unit tests) runs. CI is the one wait the driver polls autonomously, because it completes without a human. Every other wait ends the turn and resumes on `/address continue`.

## Why poll CI at all

CI success is not delivered as a webhook the session can subscribe to, so the driver learns CI's result by checking. It schedules its own wake-up with `send_later` (the claude-code-remote MCP server), which delivers a message back into this same session and survives container reclaim.

## Cadence

The prompt cache has a ~5-minute TTL, so a wake-up under five minutes resumes cache-warm and cheap; one past it pays a full cache miss. `send_later` is minute-granular, so the closest warm value is four minutes — five is the worst choice, paying the cache miss without buying a longer wait.

**Guidelines:**

- MUST poll at a **4-minute** cadence (`delay_minutes: 4`) for the first ~15 minutes after a push — under the cache TTL, so resumes stay warm and a normal CI run is caught quickly.
- SHOULD back off to a **10-minute** cadence after ~15 minutes of a still-pending run, since a slow run will not finish in the next four minutes and fewer wake-ups cost less.
- MUST NOT poll for anything a human must do; poll only while CI itself is pending.

## Hard cap

**Guidelines:**

- MUST stop autonomous polling after **2 hours** of CI with no result. CI still pending at two hours is stuck or badly queued and needs a human — the cadence was sized to catch a healthy run in minutes, not to wait out a broken one.
- MUST, on hitting the cap, update the pinned `<!-- address-agent -->` status comment to note CI is stuck, @mention `@axross`, and end the turn; the run goes dormant until `/address continue`.
- SHOULD reset the 2-hour budget when CI produces a result and a new push starts a fresh run; the cap governs a single uninterrupted pending run, not the run's whole lifetime.

## On each CI result

**Guidelines:**

- MUST, on green CI with a clean reviewer round, flip the pull request to ready, update the status comment, @mention `@axross`, and end the turn.
- MUST, on red CI, read the failing job logs, fix the cause on the branch, re-run the relevant local verification, push, and restart the poll.
- MUST, on green CI with reviewer findings still open, continue the address↔review loop rather than flipping to ready.

## Resume with `/address continue`

`/address continue` is the single manual resume for every human-gated stop — plan approval, review comments, a blocking question, stuck CI, or a dormant run.

**Guidelines:**

- MUST, on `/address continue`, reconstruct state from GitHub before acting: the open pull request, its CI status, unresolved review threads, and the driver's pinned status comment.
- MUST resume the one pending step the status comment names, not restart the run from Plan.
- MUST re-establish the CI poll if a run is pending again, or re-enter the address↔review loop if new human comments are present.
