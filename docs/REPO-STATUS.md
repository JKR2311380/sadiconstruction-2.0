# Repo status — what exists in code today

> Operational snapshot for agents. Domain language lives in [`CONTEXT.md`](../CONTEXT.md). Last reviewed: 2026-09-15.

## What this repo is

Frontend prototype of the authenticated product: landing, mock staff session, app shell, project directory/detail (Overview, Personnel, Documents, BOQ view-only, Scheduling with client CPM), plus Reports/Contractors stubs. Persistence is Zustand + localStorage. Supabase is not wired.

Package: `sadiconstruction` · Vite 8 + React 19 + Tailwind 4. CPM Engine is TypeScript under `src/features/scheduling/engine`.

## Current tree (product)

```
src/
  App.jsx                 # React Router
  LandingPage.jsx
  features/auth/
  features/shell/
  features/projects/
  features/boq/
  features/scheduling/    # UI + engine/
  features/documents/
  features/reports/
  features/contractors/
  features/settings/
  store/session.js
  store/workspace.js
  data/mock/
```

## Gaps vs later backend

| Area | Now | Later |
|------|-----|-------|
| Auth | Mock emails / `demo` | Supabase Auth + profiles seed (ADR 0006) |
| Data | localStorage | `src/data` adapters → Postgres |
| Documents | Metadata only | Storage bucket, 50 MB cap already in UI |
| CPM cache | None (D5) | Optional columns if first-paint hurts |
| CI/CD | Spec only (`docs/CI-CD.md`) | GitHub Actions when E10 is pulled |

## Agent conventions

- Extend Vite + React + Tailwind unless asked otherwise.
- Gate mutations with `can(role, capability)` from `src/lib/permissions.js`.
- BOQ stays view-only in product UI; Admin CSV replace is the ingestion path.
- Scheduling stays phase-aligned with BOQ. Engine has no React imports.
- Reopen closed items in [`OPEN-DECISIONS.md`](OPEN-DECISIONS.md) only with a superseding ADR.
- Secrets only via `VITE_*` env; no commit of `.env`.
