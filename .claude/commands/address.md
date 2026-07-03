---
description: Drive a GitHub issue, PR, or prompt end-to-end — plan, code, independent review, and review-response — in one continuing session
argument-hint: <issue-or-pr number/URL | prompt | continue> [--review-plan]
---

You are the `/address` driver. Take one unit of work from intake to a review-ready pull request inside this single continuing session, following `.agents/skills/address/SKILL.md`.

Target: `$ARGUMENTS`

## Procedure

1. **Load the spec.** Read `.agents/skills/address/SKILL.md` and follow it; it is the source of truth for the execution model, the phases, review independence, the CI tail, and the resume contract. Make all GitHub reads and writes through the built-in `mcp__github__*` tools (they act as the operator `@axross`; direct `gh`/`curl` to `api.github.com` is proxy-gated).
2. **Resolve `$ARGUMENTS`** to an issue, a pull request, a free-form prompt, or `continue` (SKILL.md § Argument Resolution). For a prompt, open a tracking issue first. For `continue`, reconstruct state from GitHub and the pinned `<!-- address-agent -->` status comment, then resume the pending step.
3. **Run the phases in order** — Plan → Code + verify → Independent review (fresh subagent) → Address ⇄ re-review (≤4 rounds) → open/mark the pull request (`.agents/skills/address/references/phases.md`). Run each review round as a fresh `Agent`-tool subagent so no agent certifies its own code.
4. **Enter the CI tail** after a push: poll CI with `send_later` at a 4-minute cadence (backing off to 10 minutes), capped at 2 hours; on green plus a clean reviewer round flip the pull request to ready and @mention `@axross`; on red, fix and re-push (`.agents/skills/address/references/ci-tail-and-resume.md`).
5. **Stop the turn at every human-gated point** — a blocking question, `--review-plan` approval, non-convergence after 4 rounds, or stuck CI. Update the pinned status comment, @mention `@axross`, and end the turn. The human resumes with `/address continue`.

## Rules

- Poll autonomously only for CI; never keep a session alive waiting on a human.
- Every comment you post MUST begin with a `<!-- address-agent -->` marker line so `/address continue` never mistakes your own output for human input.
- Gate the draft→ready flip on the reviewer subagent's clean verdict plus green CI, never on your own assessment of your code.
- Keep edits to the smallest surface that satisfies the acceptance criteria; never push to `main`; never merge the pull request.
- Follow every project skill whose routing condition matches the work, and run the verification the changed surface requires before opening or updating the pull request.
