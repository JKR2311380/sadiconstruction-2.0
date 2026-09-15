# File structure — Sadiconstruction 2.0

> Target layout for the authenticated product. Deep modules: small interfaces at feature seams; CPM Engine has **no React imports**. Aligns with [`Siteflow.md`](Siteflow.md) and [`TICKETS.md`](TICKETS.md).

## Target tree

```
sadiconstruction-2.0/
├── CONTEXT.md                 # domain glossary only
├── PRODUCT.md
├── IDEA.md
├── DESIGN.md
├── README.md                  # setup for contributors (replace Vite boilerplate)
├── docs/
│   ├── PRD.md
│   ├── Siteflow.md
│   ├── Userflow.md
│   ├── ERD.md
│   ├── DATA-MODEL.md
│   ├── FILE-STRUCTURE.md      # this file
│   ├── TICKETS.md
│   ├── OPEN-DECISIONS.md
│   ├── REPO-STATUS.md
│   ├── adr/
│   ├── research/
│   └── mockups/
├── supabase/
│   ├── migrations/            # SQL migrations (schema + RLS)
│   ├── seed/                  # Clearwater demo seed (optional)
│   └── config.toml            # when CLI is adopted
├── public/
└── src/
    ├── main.jsx
    ├── App.jsx                # router shell only
    ├── index.css
    ├── shared/                # cross-feature UI primitives (buttons, tabs) — thin
    ├── lib/
    │   └── supabaseClient.js
    ├── data/                  # adapters at the Supabase seam
    │   ├── profiles.js
    │   ├── projects.js
    │   ├── boq.js
    │   ├── schedule.js
    │   └── documents.js
    └── features/
        ├── auth/
        │   ├── LoginPage.jsx
        │   ├── RequestAccessPage.jsx
        │   └── session.js     # listen / signOut interface
        ├── shell/
        │   ├── AppShell.jsx   # left nav
        │   └── ProtectedRoute.jsx
        ├── projects/
        │   ├── ProjectDirectory.jsx
        │   ├── ProjectDetail.jsx
        │   └── projectTabs.js
        ├── boq/
        │   └── BoqPanel.jsx   # view-only
        ├── scheduling/
        │   ├── SchedulingPanel.jsx   # split view composition
        │   ├── ActivityTree.jsx
        │   ├── GanttChart.jsx
        │   ├── index.js              # PUBLIC SEAM for the feature
        │   └── engine/               # PURE CPM module (no React / Supabase)
        │       ├── index.js          # recalculate(nodes, deps, calendar) → metrics | cycleError
        │       ├── topo.js
        │       ├── forwardBackward.js
        │       ├── longestPath.js
        │       └── calendar.js
        ├── documents/
        ├── contractors/              # later epic
        ├── reports/                  # later epic
        └── settings/
```

## Seams (deep modules)

| Module | Interface (what callers know) | Implementation stays inside |
|--------|-------------------------------|-----------------------------|
| `features/scheduling/engine` | `recalculate(nodes, deps, calendar) → metrics \| cycleError` | Topo, passes, Longest Path, LOE skip |
| `data/schedule` | `loadNetwork(projectId)`, `saveNode`, `saveDependency` | Supabase queries + mapping |
| `features/auth/session` | `getSession`, `onAuthChange`, `signOut` | Supabase auth wiring |
| `features/shell` | Renders nav + outlet; knows route table only | Layout chrome |

**Deletion test:** Removing `engine/` should force every caller to reinvent CPM — good. Removing a thin styled wrapper should not.

Expanded research (Linear epic grain, GitHub templates, deeper tree): [`research/2026-09-15-tickets-and-file-structure.md`](research/2026-09-15-tickets-and-file-structure.md).

## Governing docs map

| Need | Doc |
|------|-----|
| Terms | `CONTEXT.md` |
| Intent / constraints | `PRODUCT.md`, `IDEA.md`, `docs/PRD.md` |
| Where UI lives | `docs/Siteflow.md` |
| Journeys | `docs/Userflow.md` |
| Schema | `docs/ERD.md`, `docs/DATA-MODEL.md` |
| Hard decisions | `docs/adr/*` |
| Closed product choices | `docs/OPEN-DECISIONS.md` |
| Seams / pivot | `docs/ARCHITECTURE.md` |
| Client state | `docs/STATE_MANAGEMENT.md` |
| Apply DESIGN.md | `docs/UI_UX_GUIDELINES.md` |
| Build order | `docs/TICKETS.md` |
| Code today | `docs/REPO-STATUS.md` |

## Migration from current spike

Authenticated shell and feature folders are in place for the frontend prototype. Keep `engine/` free of React. Swap `data/mock` for Supabase adapters without renaming features.
