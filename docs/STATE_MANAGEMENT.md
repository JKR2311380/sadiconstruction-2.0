# State management — living

> Where data lives in the SPA, and how to swap the mock for Supabase without renaming features.

## Split

| Kind | Home | Examples |
|------|------|----------|
| Session | `src/store/session.js` | Signed-in Staff Member, role |
| Workspace (domain) | `src/store/workspace.js` | Projects, BOQ, network, access queue |
| Ephemeral UI | Component `useState` or a tiny field on the workspace store | Selected row, dialog open, stage filter, Gantt “critical only” |
| Computed | CPM Engine on read/edit | ES/EF/LS/LF, float, Longest Path |

Computed metrics are **not** stored as truth (D5 / ADR 0004). Recalculate after load and after every network edit.

## Stores

Zustand. Workspace persist uses `localStorage` so a refresh keeps demo edits. Session persist keeps the Staff Member until logout.

Do not put fetch logic inside components. Screens call store actions (or `src/data/*` helpers that wrap those actions).

## Adapter seam

```
feature  →  data/projects.js  →  mock implementation  →  workspace store
                         ↘ later: supabase implementation
```

Keep function names stable: `listProjects`, `createProject`, `loadNetwork`, `saveNode`, `submitAccessRequest`. The mock is allowed to be synchronous under an `async` signature so a later network hop does not change callers.

## Authz

`src/lib/permissions.js` maps capability → roles. UI and store actions both consult `can(role, capability)`. Never scatter `role === 'admin'` in feature code.

## URL is state too

React Router owns: who is looking at which Project and tab. Filters that should be shareable (stage chip, tab) belong in the URL (`?stage=`, `:tab`). Selection inside the Gantt can stay in memory.

## When Supabase arrives

1. Implement the same `data/*` functions with the JS client.
2. Stop persisting domain graphs in Zustand; keep Zustand for session + UI.
3. Prefer a query cache (e.g. TanStack Query) for server lists — **add it then**, not now.
4. Last-write-wins (ADR 0009) becomes “write with `updated_at`”; conflict UX can wait.

## Prototype flags

Synthetic demo data is labeled in the chrome. Settings can reset the workspace to seed. Demo passwords are not production secrets; they must not ship in a real `.env`.
