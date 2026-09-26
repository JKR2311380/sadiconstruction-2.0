# Sadiconstruction

Internal construction project-management app: view-only BOQ owns schedule Phase Roots; a first-party CPM engine evaluates Longest Path in the browser.

Working-app contract: open Sign-up, Roles = Admin | Planner, Supabase Free (Auth + Postgres + Storage). Until `VITE_SUPABASE_*` is set, Sign-up / Sign-in and the workspace use a local mock so `npm run dev` still runs.

## Preview locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Environment

```bash
cp .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`) |

Leave both blank for the mock session. Do not commit `.env`. Never put a secret or database password in `VITE_*`.

### Auth confirmations (required for Sign-up)

Authentication → Providers → Email → **Confirm email = off**.

### Seed (after migrate)

Apply `supabase/migrations` then `supabase/seed.sql` (`supabase db reset` locally).

Password for seeded Staff Members: `demo123`.

| Email | Role |
|-------|------|
| `admin@sadicon.local` | Admin |
| `planner@sadicon.local` | Planner |

New Sign-ups are Planners. With env vars set, projects / BOQ / schedule / documents / personnel persist to Supabase (schedule writes inputs only; no metric cache). Documents use private Storage (`project-documents`, ≤50 MB).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production bundle |
| `npm run preview` | Serve `dist/` |
| `npm run typecheck` | `tsc --noEmit` (CPM Engine) |
| `npm run lint` | ESLint |

## Docs

Start at [`docs/README.md`](docs/README.md). Auth/roles: [`docs/adr/0012-open-signup-two-roles.md`](docs/adr/0012-open-signup-two-roles.md).
