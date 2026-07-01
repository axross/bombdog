# Change Management

Apply these rules on every task to keep changes focused, safe, and easy to review.

## Stay Within Scope

Stay Within Scope sets the required project default: only make changes that are necessary to fulfil the stated task. A task boundary is the single user-facing goal described in the request.

**Guidelines:**

- MUST only make changes that are necessary to fulfil the stated task. A task boundary is the single user-facing goal described in the request.
- SHOULD flag opportunities for improvement — technical debt, naming issues, missing tests — as a written note to the user rather than making unsolicited changes.

## Make Incremental Changes

Make Incremental Changes describes the preferred project default: decompose large tasks into a sequence of small, independently verifiable steps.

**Guidelines:**

- SHOULD decompose large tasks into a sequence of small, independently verifiable steps.
- MUST verify each step (see [code-quality.md](./code-quality.md)) before moving on to the next. Do not accumulate unverified changes across many files before checking.

## Follow Existing Patterns

Follow Existing Patterns sets the required project default: read the code in the area you are modifying. Mimic its architecture/structure, naming conventions, and coding idioms.

**Guidelines:**

- MUST read the code in the area you are modifying. Mimic its architecture/structure, naming conventions, and coding idioms.
- MUST search the codebase for how similar problems are already solved.
- MUST NOT silently change conventions that are already established project-wide. If there is a compelling reason to change a convention, surface it to the user first.

## Adding Dependencies

Adding Dependencies marks a discouraged project pattern: add a new dependency when the task can be reasonably accomplished with the packages already in the project's manifest, or with built-in language/platform APIs.

- When you are adding a new dependency,
  - MUST explore a couple of packages as options, and
  - MUST prefer platform-agnostic packages over platform-specific ones.
  - MUST prefer more popular, well-tested and maintained packages.

**Guidelines:**

- SHOULD NOT add a new dependency when the task can be reasonably accomplished with the packages already in the project's manifest, or with built-in language/platform APIs.
- MUST add dependencies through npm rather than editing the manifest by hand, so the lockfile stays consistent.
