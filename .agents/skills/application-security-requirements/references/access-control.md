# Access Control

Apply these rules to verify the project's request handlers gate sensitive data correctly.

## Authentication Lockout Settings

This review focuses on critical-severity cases where the diff weakens the authentication system's lockout settings.

**Guidelines:**

- MUST flag a Critical when the diff weakens the authentication lockout settings:
  - lockout duration reduced below 5 minutes
  - max login attempts raised above 5
  - the auth/lockout configuration block removed entirely (defaults may be weaker or absent)

## Request Handler Authentication

Request Handler Authentication review focuses on critical-severity cases where a new mutation handler (`POST`, `PUT`, `PATCH`, `DELETE`) does not verify the caller's identity. Even seemingly harmless endpoints (e.g., a cache-revalidation endpoint) can be abused for DoS — the reviewer SHOULD recommend either rate-limiting or a shared-secret header for new ones.

**Guidelines:**

- MUST flag a Critical when a new mutation handler (`POST`, `PUT`, `PATCH`, `DELETE`) does not verify the caller's identity. Even cache-busting or idempotent endpoints can be abused for DoS — recommend rate-limiting or a shared-secret header for new ones.

## Preview / Privileged Mode

Preview / Privileged Mode review focuses on critical-severity cases where a new route uses a query flag (e.g., `?preview=true`) to bypass production gating without also requiring the authenticated content path. A preview flag should only switch the rendering mode — it MUST NOT itself unlock non-public content.

**Guidelines:**

- MUST flag a Critical when a new route uses a query flag (e.g., `?preview=true`) to bypass production gating without also requiring the authenticated content path. A preview flag should only switch rendering mode — it must not itself unlock non-public content.
- MUST flag a Major when a new route reads cookies or headers to derive auth state without going through the project's authentication system — that system owns sessions in this project.
