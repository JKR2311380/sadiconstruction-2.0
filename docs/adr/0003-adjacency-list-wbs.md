# ADR 0003 — Adjacency-list WBS for Schedule Nodes

Schedule Nodes form a tree under Phase Roots with modest depth (phase → summaries → leaves). An adjacency list (`parent_id`) is the smallest interface: easy inserts/moves, trivial to load by `project_id`, and sufficient for client-side tree build. Nested sets / ltree add write complexity we do not need at foundation scale.

**Considered:** Materialized path, nested set, `ltree`.

**Consequences:** Ancestor queries are recursive in SQL if ever needed server-side; for v1, hierarchy walks happen in the client after fetching the project’s nodes.
