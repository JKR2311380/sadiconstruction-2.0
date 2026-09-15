# ADR 0001 — Client-side CPM on Supabase Free

Supabase Free offers limited Edge Function invocations, shared nano compute, and no appetite for graph algorithms in SQL. Project Libre itself recalculates in-memory on mutation. We implement the CPM Engine as a pure JS/TS module in the Vite app: load network inputs from Postgres, recompute on edit, optionally write cached metrics. This keeps Free quotas for auth/storage/API and makes the engine unit-testable without a server.

**Considered:** Edge Function per recalc (quota + latency); Postgres recursive CTEs (hard to express Longest Path + calendars).

**Consequences:** Large networks must stay browser-friendly; conflict resolution if two planners edit concurrently needs a simple last-write or lock strategy later.
