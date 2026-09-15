# ADR 0009 — Last write wins on the network

Two planners editing one Project is rare in v1. We accept **last write wins** and keep `updated_at` on nodes and dependencies. Soft locks and checkout UX are deferred until collisions are observed. This is the cheap consequence of client-side CPM (ADR 0001) plus a small internal team.

**Considered:** checkout flag; operational transform / CRDT.

**Consequences:** a later 409 / If-Match can use `updated_at` without rewriting the graph. The UI should not pretend concurrent authorship is merged.
