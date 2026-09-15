# Sadiconstruction

Internal construction project-management app: view-only BOQ owns schedule Phase Roots; a first-party CPM engine evaluates Longest Path in the browser.

This checkout is a **frontend prototype** (mock staff, localStorage workspace). Supabase is a later adapter behind the same `src/data` seams.

## Preview locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Demo password for every Staff Member: `demo`

| Email | Role |
|-------|------|
| `planner@sadicon.local` | Planner (edit schedule) |
| `pm@sadicon.local` | Project Manager (review) |
| `admin@sadicon.local` | Admin (Access Requests, BOQ CSV) |
| `viewer@sadicon.local` | Viewer |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production bundle |
| `npm run preview` | Serve `dist/` |
| `npm run typecheck` | `tsc --noEmit` (CPM Engine) |
| `npm run lint` | ESLint |

## Docs

Start at [`docs/README.md`](docs/README.md). Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Resolved product choices: [`docs/OPEN-DECISIONS.md`](docs/OPEN-DECISIONS.md).
