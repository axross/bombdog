---
name: product-requirement-guidelines
description: Apply this skill when writing, refining, or reviewing a product requirement, feature specification, or GitHub issue description — including the Loop Engineering plan phase's "Write the Plan and Refine the Issue" step. Covers framing the problem/outcome before the solution, separating "what" from "how", writing explicit non-goals and assumptions, right-sizing scope to the size of the change, and writing testable, single-interpretation acceptance criteria (happy path plus edge cases, explicit non-effects, right-sized checklists). Use for prompts like "write a PRD", "refine this issue", "write acceptance criteria", "what's the scope of this change", "is this requirement testable", or "define the problem statement".
---

# Product Requirement Guidelines

Apply this skill whenever drafting or reviewing the parts of a product requirement, feature spec, or issue description that describe **what** is needed and **how completion is verified** — not how it is built. It is general-purpose: any product requirement, feature specification, or GitHub issue description benefits from it, not only the Loop Engineering plan phase's "Write the Plan and Refine the Issue" step (see [plan-phase.md](../loop-engineering/references/plan-phase.md)).

This skill deliberately does not own everything a spec contains. It owns problem framing, scope boundaries, and acceptance-criteria craft only:

- UI hierarchy, states, responsive/accessibility intent, and copy — [UI and Components](../ui-and-components/SKILL.md).
- Data flow, routes, and module placement — [Project Structure](../project-structure/SKILL.md).
- Test coverage strategy — [E2E Testing Guidelines](../e2e-testing-guidelines/SKILL.md) and [Unit Test Guidelines](../unit-test-guidelines/SKILL.md).

## Problem Framing and Scope

See [problem-and-scope.md](./references/problem-and-scope.md) for:

- stating the user-facing outcome and problem before any solution detail
- writing explicit non-goals and out-of-scope bullets
- separating stated assumptions from open questions
- right-sizing the section to the size of the change
- replacing vague quality adjectives with concrete, checkable statements

## Acceptance Criteria Craft

See [acceptance-criteria.md](./references/acceptance-criteria.md) for:

- writing criteria a reviewer can verify independently, without reading implementation code
- preferring concrete, checkable phrasing over adjectives
- covering the happy path, edge/error/empty states, and explicit non-effects
- right-sizing the checklist and including verification-gate criteria
- tracing every criterion back to the rest of the spec

## Product Requirement Section Template

See [template.md](./references/template.md) for:

- a self-contained, annotated Markdown skeleton for the Product requirement and Acceptance criteria sections
- what belongs in each slot (problem/outcome, scope, non-goals, assumptions/constraints, checklist)
