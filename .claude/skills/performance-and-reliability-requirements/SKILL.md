---
name: performance-and-reliability-requirements
description: The reviewer's lens on runtime cost and failure-mode behavior. Live lenses for this client-only app: client bundle and dependency weight, asset/image optimization, server/client boundary and render cost, and error-propagation and boundary handling. The data-layer/N+1, server-side caching (lifetime, scope, invalidation), and error-reporting/observability lenses are dormant until the app adds a server data layer.
when_to_use: Use when reviewing runtime cost or failure-mode behavior of a code change — "fast", "cache", "scale", "slow", "bundle", or "what happens when this fails".
user-invocable: false
---

# Performance and Reliability Requirements

Apply these rules when reviewing the runtime cost and failure-mode behavior of any code change. This is the reviewer's lens — flag risks and link to the developer-facing rule rather than restating it.

## Current Architecture

bombdog is a **client-only** Next.js app: state lives in a `zustand` store persisted to IndexedDB (`src/lib/tracker-store.ts`, `src/lib/idb-storage.ts`), with no server data layer, no server-side caching, no request handlers, and no error-reporting service. Several lenses below are therefore dormant until such infrastructure exists — each dormant reference file repeats this gate, so a reviewer never hunts for infrastructure that is not there.

**Guidelines:**

- MUST apply the **Server / Client Boundary Cost**, **Asset and Image Optimization**, and **Bundle and Dependency Weight** lenses to any change touching client code — these are live today.
- MUST apply the **Error Handling** lens to client error-propagation and React/Next error boundaries, but treat its `reportError`/structured-logger rules as dormant (bombdog has no such service).
- MUST treat **Data-Access Efficiency** and **Caching Correctness** as dormant: apply them only when a change adds a server data layer or server-side caching.
- SHOULD remove the dormant gate from a reference file once the change that introduces its infrastructure lands, so the lens becomes unconditional.

## Data-Access Efficiency

See [data-access-efficiency.md](./references/data-access-efficiency.md) for:

- Explicit projection, relationship depth, result limit, and filter on every data-layer read
- No N+1 pattern: iterating a list of records and re-fetching each related record one at a time
- The data-layer client is acquired once per request and reused, not re-constructed in tight loops
- Visibility-restricted reads do not over-fetch by omitting the appropriate filter

## Server / Client Boundary Cost

See [server-client-boundary.md](./references/server-client-boundary.md) for:

- Independent async work is run concurrently or deferred to where it is consumed, not awaited sequentially into a waterfall
- Loading/streaming boundaries are placed around independently slow units so progressive rendering actually works
- Loading skeletons do not depend on the loaded data shape
- New client-tier units are justified — not promoting an entire server-tier subtree to the client just for one event handler

## Caching Correctness

See [caching-correctness.md](./references/caching-correctness.md) for:

- Caching is paired with a deliberately chosen lifetime/TTL
- Caching is never applied to per-user / per-request / auth data (no cookies, headers, or auth context inside a cached function)
- Invalidation is wired on writes — a new cached data source needs a corresponding write-side invalidation hook
- Invalidation targets the correct scope (the individual view vs. its shared layout/shell)

## Asset and Image Optimization

See [image-optimization.md](./references/image-optimization.md) for:

- Images and large assets go through the framework's optimized asset pipeline rather than raw, unoptimized elements
- Intrinsic dimensions are provided so optimization can apply
- Above-the-fold imagery is prioritized; below-the-fold imagery is lazy-loaded
- New external image hosts are tightly scoped via an allowlist per the project's application-security requirements (ssrf-and-embeds rules)

## Bundle and Dependency Weight

See [bundle-weight.md](./references/bundle-weight.md) for:

- Client-tier files do not import heavyweight or server-only packages (data-layer SDK, content-processing pipelines, the structured logger, an error-tracker server entry, runtime builtins)
- server-only modules imported from a client-tier file, and the likely build-error cause
- Path-aliased imports resolve to the intended tier and do not pull in transitive client-incompatible code
- The bundler's server-external package list is not bloated by entries that could ship to the client

## Error Handling and Observability

See [error-and-observability.md](./references/error-and-observability.md) for:

- `try`/`catch` is at the root call site (request entry point / top-level handler), not in nested helpers, so errors propagate to the root
- The error-reporting call fires before any early "not found" / redirect / return
- Slow or external operations surface enough context to diagnose failures
- New routes/segments have error boundaries when they need custom error UI, and the root/last-resort error boundary is not bypassed
