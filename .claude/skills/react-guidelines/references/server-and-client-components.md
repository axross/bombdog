# Server and Client Components

Apply this reference when deciding whether a component needs `"use client"`, where the client boundary sits, or what data may cross it.

**Guidelines:**

- MUST default to Server Components. Add `"use client"` at the top of a file only when the component needs state, effects, event handlers, browser-only APIs, or React context.
- MUST keep the `"use client"` boundary as low in the tree as possible — mark the small interactive leaf, not the whole page — so server-rendered content stays on the server.
- MUST NOT import server-only code (secrets, direct filesystem/network access, `server-only` modules) into a Client Component.
- SHOULD pass data down as serializable props from Server to Client Components rather than refetching on the client.
