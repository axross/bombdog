# Accessibility and Assets

Apply this reference when building any user-facing surface: semantic structure, focus behavior, and image/font loading.

## Accessibility and Structure

**Guidelines:**

- MUST use semantic elements (`button`, `a`, `nav`, `main`, headings in order) over generic `div`/`span` with handlers.
- MUST give interactive controls an accessible name and a visible focus state.
- MUST keep one `<h1>` per page and nest headings without skipping levels.
- SHOULD verify keyboard operability and focus order for any new interactive surface, and confirm layout holds across small and large viewports.

## Assets and Fonts

**Guidelines:**

- SHOULD use `next/image` for raster images so sizing, lazy-loading, and optimization are handled; provide meaningful `alt` text.
- SHOULD load web fonts through `next/font` to avoid layout shift and external requests, following the scaffold's existing setup.
