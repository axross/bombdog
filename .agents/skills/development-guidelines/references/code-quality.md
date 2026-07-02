# Code Quality

Apply these rules whenever you write or modify code in this project.

## Check Sequence

Check Sequence sets the required project default: always run checks in this order after making any code change:

- `npm run format` applies auto-fixable formatting. `npm run lint` enforces both lint rules and format rules. Some format violations are only caught by the lint step, so it may still report format issues even after running the formatter.

**Guidelines:**

- MUST always run checks in this order after making any code change:
  1. **Format** (`npm run format`) — auto-formats all modified files.
  2. **Lint** (`npm run lint`) — detects code quality and remaining format issues.
  3. **Fix all reported errors.**
  4. **Re-run lint** — confirm all errors are resolved.
  5. **Test** (`npm run test:e2e`) — only when the project has an e2e suite and the change affects a UI output surface; see [verification.md](./verification.md) for which changes require testing.

- MUST NOT skip or reorder these steps.

## Formatting

Formatting sets the required project default: run `npm run format` after every set of code changes, before committing or considering the task done.

**Guidelines:**

- MUST run `npm run format` after every set of code changes, before committing or considering the task done.
- MUST NOT manually adjust spacing, indentation, or line endings — let Biome handle them.
- MUST NOT submit code that has not been passed through the formatter.

## Linting

Linting sets the required project default: run `npm run lint` after formatting to surface code quality issues.

**Guidelines:**

- MUST run `npm run lint` after formatting to surface code quality issues.
- MUST fix every lint **error** before considering the task complete.
- SHOULD fix lint **warnings** in any file that was modified as part of the task. MAY also fix pre-existing warnings in those files.
- MUST NOT suppress lint rules with Biome's inline suppression directive unless there is a clear, documented reason why the rule cannot be satisfied.
  - When suppression is genuinely necessary, add an inline comment on the same line explaining the reason.

## Comments

This project distinguishes two kinds of comment, each with its own required style: **doc-comments** (`/** … */`, TSDoc) that describe an API, and **line comments** (`// …`) that explain a specific spot in the code. `src/lib/types.ts` and `src/lib/game.ts` are the reference for both — read them before writing comments and match their voice.

### Doc-Comments (TSDoc)

Doc-comments are the API-level documentation. They follow [TSDoc](https://tsdoc.org) and keep normal prose capitalization (they are NOT lowercased — see line comments below).

Every doc-comment is written in the multi-line form: the opening `/**` sits alone on its own line, the closing `*/` sits alone on its own line, and the content lives on the ` * …` lines between them. There are no single-line `/** … */` doc-comments — even a one-line summary or a terse member doc spans three lines. For example:

```ts
/**
 * Resolve a player's display name, tolerant of unknown ids.
 */
export function getPlayerName(players: Player[], id: string): string { … }
```

**Guidelines:**

- MUST write every doc-comment in the multi-line form — `/**` alone on the opening line, `*/` alone on the closing line, content on the ` * …` lines between. No single-line `/** … */` doc-comments, including member docs. Do NOT pad with blank ` *` lines right after `/**` or right before `*/`.
- MUST give every **type definition** — every `interface`, `type` alias, `enum`, and every module-level exported `const` that defines a value/table — a TSDoc doc-comment stating what it is.
- MUST give every **function whose body exceeds 5 lines** a TSDoc doc-comment stating what it does. This includes non-exported helpers and inner React components, not just exported functions.
- MUST tag any function that can throw with `@throws`, naming the condition (e.g. `@throws if the kind has no matching option`). A function that returns `null`/`undefined` on failure does NOT throw and MUST NOT get `@throws`.
- MUST put specific, heavy, or "why" detail that aids understanding but would clutter the summary into a `@remarks` block rather than the opening sentence.
- SHOULD add `@param` / `@returns` only when the name and type do not already make the meaning obvious, and cross-reference related symbols with `{@link Name}` as the reference files do; do NOT add restating noise.
- SHOULD document individual interface/type members only when a member is non-obvious; self-evident members (e.g. `className`, an id field) need no member doc.
- Test files are exempt from the function rule: do NOT add TSDoc to `describe`/`it`/`test`/`beforeEach` callbacks or inline test bodies. DO document genuinely reusable named helpers (e.g. in `e2e/helpers/`) whose body exceeds 5 lines.

### Line Comments

Line comments (`// …`) are written in a lowercase style and kept to a minimum.

- Lowercase the first letter of every `//` comment and of each sentence within it.
- EXCEPTION — keep natural casing when the token is a proper noun, a code identifier, or an acronym/initialism: brands and libraries (`Radix`, `Biome`, `Playwright`, `IndexedDB`; stylized-lowercase names like `zustand`/`jsdom` stay lowercase), acronyms (`ARIA`, `CSS`, `DOM`, `SSR`, `UUID`, `e2e`), version tags (`v1`, `v2`), person/fixture names (`Alice`), and proper-noun domain terms that name a specific role or entity (in this game: `Captain`, and card names such as `Double Detector`, `Super Detector`, `X or Y Ray`). Generic domain words (`dual cut`, `solo cut`, `detector`, `equipment`, `player`, `wire`, `blue`, `yellow`) are NOT exceptions and are lowercased at sentence start.
- This lowercase rule is scoped to `//` comments. It does NOT apply to TSDoc `/** … */` prose, to commit messages (see [commit-messages.md](./commit-messages.md)), or to prose documentation. A JSX-forced `{/* … */}` block that functions as an explanatory line comment follows the same lowercase style.
- A linter suppression directive (`biome-ignore …`, `v8 ignore …`) keeps the directive's required casing; only the trailing human-readable reason follows the lowercase style.
- Keep line comments minimal: write one only when it is mandatory or critically helpful to understand control flow, a business-logic step, or a non-obvious reason/circumstance that the code alone does not convey. Do NOT add a comment that merely restates the next line; do NOT delete a comment that explains "why", an edge case, or non-obvious behavior.

**Guidelines:**

- MUST write `//` line comments in the lowercase style, preserving the proper-noun / identifier / acronym exceptions.
- MUST keep line comments minimal and remove a `//` comment that only restates the code it precedes.
- MUST let the linter/formatter enforce comment conventions where it can, and fix any comment-style violations it reports.

## Import Hygiene

Import Hygiene is a project prohibition: do not leave unused imports in modified files. The linter will flag these, but resolve them proactively.

**Guidelines:**

- MUST NOT leave unused imports in modified files. The linter will flag these, but resolve them proactively.
- MUST NOT use barrel re-export files (an `index` module that re-exports everything) as import sources when a direct import path is available. Import directly from the module file.
  - This keeps bundle size small and avoids accidentally pulling in code intended for one runtime/boundary into another.
- SHOULD use type-only imports when the language supports them and the imported symbol is a type that is not used as a value.
