# Review instructions

Review **policy** for this repository — the highest-priority, review-only
instructions. Read natively by managed [Code Review](https://code.claude.com/docs/en/code-review),
and by the self-hosted reviewer ([`.github/workflows/claude-review.yaml`](.github/workflows/claude-review.yaml))
and the local `/review` command via a system-prompt bootstrap. This file
overrides defaults and complements the review **methodology** in
[`code-review-guideline`](.claude/skills/code-review-guideline/SKILL.md).

This is a **strict** review: run every mandatory check below, verify the linked
issue's acceptance criteria, and report every finding — do not wave anything
through.

## Methodology

Review the whole diff through every matching lens from `code-review-guideline`:
correctness/bugs, maintainability, security, performance/reliability,
UI/components, project structure, and test coverage. Give each finding a
severity label, `file:line` evidence, and a concrete fix.

## What "Important" means here

Reserve **Important** for findings that break behavior, corrupt persisted state
(IndexedDB / the zustand store), leak data, or regress accessibility — **plus
every unmet acceptance criterion, and any mandatory-check violation that breaks
a hard requirement, below**. Style, naming, and refactoring suggestions are
**Nit** at most.

## Mandatory checks

Run this checklist on **every** review and raise a finding for each miss — these
are not skippable. Grade each miss by its real impact using
[`code-review-guideline`'s severity floors](.claude/skills/code-review-guideline/references/severity.md);
a miss that breaks the requirement is **Important**, a gap that does not is a
**Nit**. Cite the owning skill in the finding.

- **Tests** — new or changed logic (components, store actions, `src/lib`
  functions) has a colocated unit test (`*.test.tsx` / `*.spec.ts`), and
  user-facing behavior has e2e coverage, per
  [`unit-test-guidelines`](.claude/skills/unit-test-guidelines/SKILL.md) and
  [`e2e-testing-guidelines`](.claude/skills/e2e-testing-guidelines/SKILL.md). A
  new element an e2e test would target that lacks a stable test hook is
  Important; untested new logic is at least a Nit.
- **Error handling** — fallible paths (async calls, IndexedDB / storage access,
  parsing) surface failure instead of swallowing it, per
  [`performance-and-reliability-requirements`](.claude/skills/performance-and-reliability-requirements/SKILL.md).
  A swallowed or unhandled error is Important.
- **Accessibility** — interactive elements have an accessible name and role and
  keyboard support, per
  [`ui-and-components`](.claude/skills/ui-and-components/SKILL.md). A regression
  or a missing affordance on an interactive element is Important.
- **Type safety** — no `any`, unchecked cast, or unjustified non-null assertion
  (`!`) introduced, per
  [`development-guidelines`](.claude/skills/development-guidelines/SKILL.md).
- **Dead code** — no unused export, unreachable branch, or commented-out code
  left in the diff (Important only if it hides a bug).
- **Boundaries & styling** — correct Server/Client component boundaries (an
  unsafe cross is Important) and CSS Modules for styling, no Tailwind, per
  [`ui-and-components`](.claude/skills/ui-and-components/SKILL.md).

## Acceptance criteria

Verify the diff against **every** acceptance criterion in the linked issue (the
pull request's `Closes #<n>`). Each criterion that is unmet, or that you cannot
confirm from the diff, is an **Important** finding named explicitly in the
report. If the pull request links no issue, say so in the summary.

## Report every finding

Report **every** finding — there is no nit cap and nothing is summarized away.
Post each as its own inline comment; the same nit repeated across the diff may
share one comment that lists each occurrence. The summary's tally counts them
all.

## Do not report

- Anything CI already enforces: Biome lint/format and TypeScript type errors.
- Lockfiles and generated files.

## Reporting

Anchor each finding as an inline comment on the diff, and post one summary that
opens with a one-line tally (e.g. `2 important, 7 nits`). Keep reporting to those
two shapes — inline comments for the findings, one comment for the summary — and
do not scatter individual findings across separate top-level conversation
comments.
