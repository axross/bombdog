# Current External Documentation

Apply this reference when a change depends on framework, platform, service, or tool behavior that may have changed since the local skill was written. Official docs are part of the implementation context for these surfaces.

## When to Refresh Docs

Use current official docs before changing behavior governed by fast-moving frameworks, services, or tools that the project depends on. The table below lists representative surfaces by tool token. Add rows for any other fast-moving dependency the project adopts.

| Surface | Refresh docs before changing |
| ------- | ---------------------------- |
| Next.js (App Router) | Routing/rendering conventions, request/response handling, metadata, caching, configuration, instrumentation, asset/image behavior |
| Vercel | Deployment/runtime behavior, asset optimization, storage, environment variables |
| Playwright | Test runner configuration, snapshot behavior, locator/assertion APIs |
| Biome | Formatter/linter configuration, suppression syntax, rule names |

**Guidelines:**

- MUST consult current official docs before changing any surface listed in the table.
- MUST use official docs as the primary source; use blog posts, examples, or issues only as secondary context.
- MUST mention the docs consulted in the final summary when the implementation depends on a current-docs decision.
- MUST NOT rely only on memory for APIs, defaults, or behavior that the relevant vendor may have changed.
- SHOULD limit the docs lookup to the smallest surface needed for the task.

## Project-Specific Current-Docs Triggers

Some project areas are especially sensitive because a small API mismatch can produce production-only failures. List the project's high-sensitivity config files and entry points here as they are added.

**Guidelines:**

- MUST refresh Next.js (App Router) docs before changing framework entry points, routing/rendering APIs, metadata generation, caching APIs, or framework configuration files.
- MUST refresh Vercel docs before changing deployment/runtime assumptions, storage usage, or environment-variable exposure.
- SHOULD refresh Playwright or Biome docs before changing their configuration files, snapshot behavior, or suppression syntax.
