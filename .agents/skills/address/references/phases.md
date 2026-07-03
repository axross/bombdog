# Phases

The `/address` driver runs Plan → Code → Review → Address within one session, then enters the CI tail ([ci-tail-and-resume.md](./ci-tail-and-resume.md)). Each phase defers to the owning project skill for its standards; this file covers only how `/address` sequences them.

## Plan

Turn the target into a buildable specification recorded in the issue.

**Guidelines:**

- MUST read the issue (or the tracking issue opened for a free-form prompt) and its full thread, classify the work — UI-bearing, implementation-only, exploratory, or mixed — per the [Response Approach](../../../../AGENTS.md), and investigate the smallest useful code and documentation context before proposing a plan.
- MUST consult every project skill whose routing condition matches the surface the work touches, and research current external docs per [current-docs.md](../../development-guidelines/references/current-docs.md) when behavior depends on Next.js, React, Vercel, Playwright, Vitest, or Biome.
- MUST post blocking questions as one `<!-- address-agent -->` comment that @mentions `@axross`, stating the assumption it would otherwise make, then end the turn — reserved for product, scope, privacy, platform, or design decisions the thread cannot resolve; MUST NOT ask what local investigation can answer.
- MUST rewrite the issue body into a comprehensive plan with these sections, omitting any that genuinely do not apply and saying why, per [Product Requirement Guidelines](../../product-requirement-guidelines/SKILL.md):
  1. **Product requirement** — the user-facing outcome and constraints.
  2. **UI design** — hierarchy, states, responsive and accessibility intent, and copy constraints, when the change is UI-bearing (per [UI and Components](../../ui-and-components/SKILL.md) for mechanics).
  3. **System design / architecture** — data flow, state, routes, and module placement, when applicable (per [Project Structure](../../project-structure/SKILL.md) for mechanics).
  4. **Testing strategy** — the E2E and unit coverage to add or update, when applicable (per [E2E Testing Guidelines](../../e2e-testing-guidelines/SKILL.md) and [Unit Test Guidelines](../../unit-test-guidelines/SKILL.md)).
  5. **Acceptance criteria** — a checklist a reviewer can verify against the finished pull request.
- MUST refine the issue title to the concrete deliverable and move the original description into a collapsed `<details>` section, updating title and body in a single `issue_write`.
- MUST, only with `--review-plan`, stop after writing the plan, @mention `@axross` for approval, and end the turn; without the flag, proceed directly to Code.

## Code + Verify

**Guidelines:**

- MUST implement strictly from the plan, keeping edits within the smallest surface that satisfies the acceptance criteria, on a `claude/issue-<n>` branch; never push to `main`.
- MUST follow every project skill whose routing condition matches the changed files and add or update the E2E and unit coverage the plan named.
- MUST run the verification the changed surface requires — `npm run format` and `npm run lint` after any edit; `npm run typecheck` for type or signature changes; `npm run test:unit`, and `npm run test:e2e` for UI-output or e2e-coverage changes; `npm run build` for route, metadata, runtime-config, dependency, or signature changes — per [Development Guidelines › verification](../../development-guidelines/references/verification.md), and record the evidence in the pull request body.

## Independent Review

Review runs in a fresh subagent so the judgment is not the coder's own. See [SKILL.md › Review Independence](../SKILL.md#review-independence).

**Guidelines:**

- MUST spawn a subagent (the `Agent` tool) given only the diff, the linked issue's acceptance criteria, and the [Code Review Guideline](../../code-review-guideline/SKILL.md) lens; MUST NOT pass it the driver's implementation reasoning.
- MUST have the subagent review the whole diff through every matching lens — correctness/bugs, maintainability, security, performance/reliability, UI/components, project structure, and test coverage — and check it against every acceptance criterion, returning each finding with a severity label, `file:line` evidence, and a concrete fix.
- MUST spawn a new subagent for every re-review round; a round MUST NOT inherit a prior round's context.

## Address

**Guidelines:**

- MUST address and resolve each Critical / Major / Minor finding and unmet acceptance criterion the reviewer subagent returned, pushing fixes to the same branch and re-running the relevant verification after each batch.
- MUST re-review with a fresh subagent after a batch of fixes, and repeat up to the 4-round cap ([SKILL.md › Termination Guard](../SKILL.md#termination-guard)).
- MUST escalate — a `<!-- address-agent -->` comment mentioning `@axross`, then end the turn — when a finding or human comment is ambiguous or needs a product or architecture decision, rather than guessing.
- MUST open the pull request in **draft** with `Closes #<n>` while the address↔review loop runs, and flip it to ready only on a clean reviewer round with green CI, then @mention `@axross`; merging remains the human's decision.
- MUST, when a human leaves review comments on a ready pull request, treat `/address continue` as the resume: re-read the new threads, address or escalate each, convert the pull request back to draft if needed, and re-enter the review loop as a fresh round.
