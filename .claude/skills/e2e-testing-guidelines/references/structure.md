# E2E Test Structure

## Project Layout

Playwright specs, helpers, reporters, and the scenario catalog live under `e2e/`. Tests are organized flat by **purpose** (smoke, happy path, regressions, feature), not by route — bombdog is a single-route app, so a `routes/` tree would add empty hierarchy.

```
e2e/
├── check-scenario-coverage.mjs        # scenario-coverage gate script
├── helpers/
│   └── tracker.ts                     # shared UI-driving helpers
├── reporters/
│   └── scenario-coverage.ts           # custom @scenario-tag reporter
├── scenarios.md                       # the user-journey coverage catalog
└── tests/
    ├── smoke.test.ts                  # boots + core loop, the first gate
    ├── happy-path.test.ts             # end-to-end journeys
    ├── regressions.test.ts            # bug-fix guards
    └── move-filter.test.ts            # feature-specific suite
```

**Guidelines:**

- MUST place specs directly under `e2e/tests/` as `<purpose-or-feature>.test.ts` (`playwright.config.ts` sets `testDir` to `e2e/tests`).
- MUST keep reusable e2e helpers under `e2e/helpers/` and import them by relative path.
- SHOULD group tests by purpose or feature (`smoke`, `happy-path`, `regressions`, `move-filter`) rather than by route.
- SHOULD add a new user journey to `e2e/scenarios.md` and tag its spec so the scenario-coverage gate stays accurate.

## Test File Structure

File names are kebab-case with the `.test.ts` extension so `playwright.config.ts` picks them up.

**Guidelines:**

- MUST use kebab-case for file names.
- MUST use the `.test.ts` extension for test files.

## Test Case Structure

Each spec defines one test case per behavior, wraps each meaningful action in a `test.step`, and tags user-facing journeys with `@scenario:`/`@area:`/`@priority:` (see [scenario-coverage.md](./scenario-coverage.md)).

**Guidelines:**

- MUST define one test case per behavior and name it concisely.
- MUST wrap each action in a `test.step` at human-understandable granularity, named concisely.
- SHOULD tag user-facing journeys with the `@scenario:`/`@area:`/`@priority:` labels the coverage gate reads.
