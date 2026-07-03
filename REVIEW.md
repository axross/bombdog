# Review instructions

Review **policy** for this repository — the highest-priority, review-only
instructions. Read natively by managed [Code Review](https://code.claude.com/docs/en/code-review),
and by the self-hosted reviewer ([`.github/workflows/claude-review.yaml`](.github/workflows/claude-review.yaml))
and the local `/review` command via a system-prompt bootstrap. This file
overrides defaults and complements the review **methodology** in
[`code-review-guideline`](.agents/skills/code-review-guideline/SKILL.md).

## Methodology

Review the whole diff through every matching lens from `code-review-guideline`:
correctness/bugs, maintainability, security, performance/reliability,
UI/components, project structure, and test coverage. Give each finding a
severity label, `file:line` evidence, and a concrete fix, and check the diff
against the linked issue's acceptance criteria.

## What "Important" means here

Reserve **Important** for findings that break behavior, corrupt persisted state
(IndexedDB / the zustand store), leak data, or regress accessibility. Style,
naming, and refactoring suggestions are **Nit** at most.

## Cap the nits

Report at most five Nits per review; summarize any beyond that as a count.

## Do not report

- Anything CI already enforces: Biome lint/format and TypeScript type errors.
- Lockfiles and generated files.

## Always check

- New or changed components have a colocated `*.test.tsx`; user-facing ones also have e2e coverage.
- Correct Server/Client component boundaries, and CSS Modules for styling (no Tailwind).

## Reporting

Post all findings as a single pull-request review — inline comments anchored to
the diff, plus a summary — never as loose top-level conversation comments. Open
the review summary with a one-line tally (e.g. `1 important, 2 nits`).
