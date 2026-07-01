---
name: ui-and-components
description: Use this skill when writing, reviewing, or refactoring React components and user-facing surfaces in bombdog. Covers the Next.js App Router Server/Client component boundary and when to add "use client", CSS Modules styling conventions, colocation of components with their styles and tests, the next/image and next/font usage the scaffold ships with, and baseline accessibility expectations. Use even when the user only mentions a component, a page, styling, a "use client" directive, or an accessibility concern.
---

# UI and Components

Apply this skill for any user-facing work in bombdog: React components, pages, layouts, and styling. The app uses the Next.js App Router (React 19) with CSS Modules.

## Server and Client Components

- MUST default to Server Components. Add `"use client"` at the top of a file only when the component needs state, effects, event handlers, browser-only APIs, or React context.
- MUST keep the `"use client"` boundary as low in the tree as possible — mark the small interactive leaf, not the whole page — so server-rendered content stays on the server.
- MUST NOT import server-only code (secrets, direct filesystem/network access, `server-only` modules) into a Client Component.
- SHOULD pass data down as serializable props from Server to Client Components rather than refetching on the client.

## Styling

- MUST style components with CSS Modules (`<Component>.module.css`) imported as `import styles from "./Component.module.css"`; there is no CSS framework in this project.
- MUST colocate a component's stylesheet next to the component file.
- MUST scope selectors through the module (`styles.foo`); reserve `globals.css` for genuinely global resets and design tokens.
- SHOULD express spacing, color, and typography through shared CSS custom properties in `globals.css` rather than repeating literal values.

## Assets and Fonts

- SHOULD use `next/image` for raster images so sizing, lazy-loading, and optimization are handled; provide meaningful `alt` text.
- SHOULD load web fonts through `next/font` to avoid layout shift and external requests, following the scaffold's existing setup.

## Accessibility and Structure

- MUST use semantic elements (`button`, `a`, `nav`, `main`, headings in order) over generic `div`/`span` with handlers.
- MUST give interactive controls an accessible name and a visible focus state.
- MUST keep one `<h1>` per page and nest headings without skipping levels.
- SHOULD verify keyboard operability and focus order for any new interactive surface, and confirm layout holds across small and large viewports.

## Colocation and Tests

- MUST colocate a component, its `*.module.css`, and its `*.test.tsx` in the same folder.
- SHOULD test rendered behavior and accessible roles/names via Testing Library rather than implementation details; see [Unit Test Guidelines](../unit-test-guidelines/SKILL.md).
- SHOULD cover user-facing flows that cross routes with a Playwright spec; see [E2E Testing Guidelines](../e2e-testing-guidelines/SKILL.md).
