# ADR 0006 — Seed the first Admin

Access Requests cannot mint the first Admin (no one is present to approve). We bootstrap with a **one-time seed** (known email → `auth.users` + `profiles.role = admin`). Dashboard SQL is the fallback if the seed was skipped. Auto-promoting the first sign-up is rejected: it fights the screening model in ADR 0002.

**Considered:** first-user-is-admin; dashboard-only.

**Consequences:** seed must be idempotent and documented; rotate/disable the demo email before any production cutover.
