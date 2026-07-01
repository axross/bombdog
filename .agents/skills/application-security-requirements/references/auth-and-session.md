# Auth and Session Management

Apply these rules to verify the project's authentication is not weakened.

*This lens assumes the project has an authentication system (often provided by the data/content layer). It applies once such a system is in place.*

## Authentication Lockout Settings

This review focuses on critical-severity cases where the diff weakens the authentication system's lockout / rate-limit settings.

**Guidelines:**

- MUST flag a Critical when the diff weakens any of these in the auth configuration:
  - lockout duration set below 5 minutes
  - max login attempts raised above 5
  - the auth/lockout configuration block removed entirely (defaults are weaker or absent)
- MUST flag a Critical when the diff adds a new field to the user/account resource that exposes a credential (e.g., a plain-text API key field) — credentials belong in env vars or a secrets store, not in the database.
- MUST flag a Major when the user/account resource's read rule is changed to allow non-admin reads. User records contain email addresses and locked-out state.

## Session Cookies

This review focuses on critical-severity cases where a new component or request handler reads or writes session cookies directly instead of going through the project's auth system. The auth system owns cookie management — bypassing it desyncs the auth state.

**Guidelines:**

- MUST flag a Critical when a new component or request handler reads or writes session cookies directly instead of going through the project's authentication system. That system owns cookie management — bypassing it desyncs the auth state.
- MUST flag a Major when a new feature implements its own auth cookie or token rather than relying on the authenticated-user context the auth system already provides.

## Privileged / Preview Auth Path

This review focuses on critical-severity cases where the diff makes a privileged or preview state (e.g., `?preview=true` or `?draft=true`) reachable without a valid authenticated session. A preview flag should only switch rendering mode; the underlying data fetch for non-public content MUST still rely on the auth system's gating.

**Guidelines:**

- MUST flag a Critical when the diff makes a privileged/preview flag reachable without a valid authenticated session. A preview flag should only switch rendering mode — the data fetch for non-public content must still rely on the auth system's authentication.
- MUST flag a Critical when a new query-param flag is introduced that affects data visibility (e.g., a hypothetical `?internal=true`) without auth gating.

## Localhost / Production Divergence

This review focuses on major-severity cases where the diff causes a code path to execute only in a local/development environment but has no equivalent for production — a localhost-only auth bypass that ships to production via a deployed branch is a recurring class of bug.

**Guidelines:**

- MUST flag a Major when the diff causes a code path to execute only when running locally (per the project's environment flag) but no equivalent exists for production — a localhost-only auth bypass that ships to production via a deployed branch is a recurring class of bug.
