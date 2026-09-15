# Architecture — living

> How the app is shaped, not a frozen blueprint. When a seam moves, update the table — do not rewrite this file. Hard choices live in [`adr/`](adr/). Terms live in [`CONTEXT.md`](../CONTEXT.md).

## What this system is

A Vite SPA for one construction org. Cost WBS (BOQ) owns schedule phase roots. Time risk is a first-party CPM Engine in the browser. Persistence (when wired) is Supabase Free; this prototype uses a mock adapter with the same seams.

## Seams (stable interfaces, movable guts)

| Seam | Callers know | Guts may change |
|------|----------------|-----------------|
| `features/scheduling/engine` | `recalculate(input) → metrics \| cycleError` | Topo, calendars, Longest Path math |
| `data/*` | load/save functions per aggregate | Mock store today; Supabase tomorrow |
| `features/auth/session` | `getStaff`, `signIn`, `signOut`, `can(capability)` | Mock login today; Auth tomorrow |
| `features/shell` | Nav items + `<Outlet />` | Chrome, density, breakpoints |
| Feature folders | Public `index.js` when one exists | Internal components |

**Deletion test:** if removing `engine/` forces every screen to reinvent CPM, the seam is deep enough.

## Layers

```
UI (features/*)  →  session + workspace stores  →  data adapters  →  engine (pure)
```

UI never imports Supabase clients or engine internals. Adapters never import React. The engine never imports React, stores, or adapters.

## Pivot resilience

- **Schema:** DATA-MODEL is the physical guess. Additive columns are cheap; rename in an ADR. UI should key off domain fields, not CSS or route names.
- **Auth:** capabilities (`can('editSchedule')`) not `role === 'planner'` scattered in JSX. Adding a role is a matrix row (ADR 0005).
- **Persistence:** swap `src/data/mock` for `src/data/supabase` behind the same function names. Stores hold UI + session; server truth later moves to a query cache without renaming features.
- **Hosting:** local Vite now (D8). The app is a static build; any host that serves `dist/` works.
- **CPM rules:** Retained Logic / one calendar are ADRs. New modes (Progress Override, extra calendars) are new engine flags with tests — not a fork of the UI tree.

## Prototype vs later

| Now | Later without a rewrite |
|-----|-------------------------|
| Mock staff + localStorage | Supabase Auth + `profiles` |
| In-memory BOQ / network | Postgres tables in DATA-MODEL |
| CSV parsed in-browser | Same parser; persist via adapter |
| Last write wins | `updated_at` already on records → 409 |

## Where to look

| Question | Doc |
|----------|-----|
| What is a Phase Root? | `CONTEXT.md` |
| Why client CPM? | `adr/0001-*.md` |
| File placement | `FILE-STRUCTURE.md` |
| Client state | `STATE_MANAGEMENT.md` |
| Visual world | `DESIGN.md` · `UI_UX_GUIDELINES.md` |
