# Sadiconstruction — Project Context

> Working context for humans and AI agents. Last updated: 2026-09-14.

## What this is

**Sadiconstruction** (branded in UI as *Sadiconstruction* / *SADICON MANAGEMENT*) is an **internal construction project-management platform** for an organization. The product vision is end-to-end control of **projects, budgets, contractors, documents, scheduling, and reporting**, with Philippine-context signals (e.g. ₱ capital) in the marketing copy.

This repo (`sadiconstruction-2.0`) is currently an **early prototype**: a polished marketing landing page plus a Supabase email/password login spike. There is **no authenticated app shell** and **no domain modules** implemented here yet. The fuller product behavior below comes from the team’s design/update docs and is the **intended product**, not what ships in this codebase today.

Package name: `sadiconstruction` · version `0.0.0` · private.

## Source docs (product intent)

| Doc | Link | Role |
|-----|------|------|
| Sadi Construction Updated | [Google Doc](https://docs.google.com/document/d/1XIjmzbjB9cSNKhLT252K9pYdZFRK79z2UwMwai3MlQ4/edit?usp=sharing) | Landing/login updates, dashboard IA, project detail tabs, reports, contractors, settings |
| Sadiconstruction Latest Updates | [Google Doc](https://docs.google.com/document/d/1t2aotFlIY0lVEVGFpn84OQP9dbATCD6ZqIL2daAJfBA/edit?usp=sharing) | BOQ + Scheduling (Gantt) inside a project; landing hero aesthetic notes |

Summaries below are distilled from those docs (text only; screenshots in the docs are not reproduced here).

---

## Intended product (from update docs)

### Entry surfaces

1. **Landing page** — branded marketing entry; orange accent; hero imagery chosen to complement orange (docs note a dominantly blue hero image in a later update).
2. **Login** — staff sign-in.
3. **Request Access** — form on/near login so **guests can be screened before** getting an account (not open self-serve signup).

### Authenticated shell — left dashboard

After login, a left dashboard/sidebar with:

| Menu | Purpose |
|------|---------|
| **Project list** | Browse and manage the project directory (database-style aesthetic) |
| **Project reports** | Inbox-style report/email system |
| **Contractors list** | Contractor registry and history |
| **Settings** | Includes Dark Mode |

### Project directory (list)

- **Monitoring ribbon** at the top of the project list.
- Toggle / filter by stage: **Active**, **On Hold**, **Completed**, **Delayed**, **Planning**.
- Monitor **total expenditure**.
- **Search** for projects.
- **Add new project**.
- Sort by **priority**, **completion date**, and **progress**.

### Inside a project

| Tab / menu | What the user gets |
|------------|--------------------|
| **Overview** | Budget, number of personnel involved, percent completion |
| **Key Personnel** | Detailed employee list for the project + start dates |
| **Documents** | Construction docs (engineering plans, permits); **upload** supported |
| **Bill of Quantities (BOQ)** | Complete approved BOQ, structured by **phase**; **view-only** to prevent tampering |
| **Scheduling** | Activity list (left) + auto **Gantt chart** (right); activities **color-coded by phase**; BOQ phases feed scheduling reference |

### Reports tab

Formatted as an **email / inbox system**. Users receive:

- Site incident reports
- Material delivery notices
- Other project-related messages

### Contractors tab

List of contractors involved across projects, including:

- Certifications
- Projects they currently handle
- Projects they have handled for the company

### Settings

- **Dark Mode** option

---

## Goals (near-term for this repo)

1. Turn the login spike into a real auth lifecycle (session, protected routes, logout, post-login shell).
2. Introduce routing and a minimal authenticated layout matching the **left dashboard** IA above.
3. Align login UI with the landing brand; implement **Request Access** screening flow from the docs.
4. Document local setup (env vars) and replace the stock Vite README with product docs.
5. Implement first product slice: **project directory** (ribbon filters, search, sort, add) → then project **Overview**.

## Non-goals (current stage)

- Public multi-tenant SaaS marketplace
- Editable BOQ (docs specify view-only)
- Rewriting the stack (Vite + React + Tailwind + Supabase is intentional for now)

## Tech stack

| Layer | Choice |
|--------|--------|
| UI | React 19 (`react`, `react-dom`) |
| Build | Vite 8 + `@vitejs/plugin-react` |
| Language | JavaScript (JSX); TypeScript types present only as `@types/*` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Auth / BaaS | Supabase JS (`@supabase/supabase-js`) |
| Fonts | DM Serif Display, Inter, Work Sans (loaded in `index.html`) |
| Lint | ESLint 10 + react-hooks / react-refresh |

**Not in use yet:** React Router (or any router), TypeScript in app source, tests, CI, component library, global state library, custom API server.

## Repo map

```
sadiconstruction-2.0/
├── index.html              # shell, title, Google Fonts
├── package.json
├── vite.config.js          # React + Tailwind plugins
├── eslint.config.js
├── README.md               # stock Vite template (not product docs)
├── public/                 # favicon + leftover template icons
└── src/
    ├── main.jsx            # createRoot entry
    ├── App.jsx             # boolean toggle: landing ↔ login
    ├── LandingPage.jsx     # marketing hero + stats
    ├── LoginPage.jsx       # Supabase password sign-in
    ├── supabaseClient.js   # createClient from Vite env
    ├── index.css           # @import "tailwindcss"
    ├── App.css             # unused Vite template CSS
    └── assets/             # crane_bg.jpg (used); other assets unused/leftover
```

## Runtime architecture (this repo today)

### Navigation

There is **no URL router**. `App` holds `showLogin` state and swaps:

- `LandingPage` → `onNavigateToLogin` sets login view
- `LoginPage` is passed `onNavigateBack`, but **does not accept or use it**

Deep links, browser back, and shareable URLs do not work.

### Auth

- Client: `src/supabaseClient.js` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Login: `supabase.auth.signInWithPassword` in `LoginPage`
- On success: UI shows “Login successful!” only — **no redirect, no session listener, no logout, no protected UI**
- Request Access form from the update docs is **not implemented** in this repo yet
- No `.env.example` in the repo; local env must be created manually (`.env.local` is gitignored)

### Data / product domain

No tables, queries, RLS docs, or domain modules in this repo yet. **Intended** domains from marketing + update docs:

- Projects (directory, overview, personnel, documents, BOQ, scheduling)
- Budgets / expenditure
- Contractors
- Reports / messaging
- Compliance-related docs (plans, permits)
- Settings (including dark mode)

## Intended user flow (from docs)

```
Landing
  → Log in  OR  Request Access (guest screening)
    → Authenticated Dashboard (left nav)
         → Projects (ribbon: Active | On Hold | Completed | Delayed | Planning;
                    search, sort, add, expenditure)
              → Project detail
                   → Overview | Key Personnel | Documents | BOQ | Scheduling
         → Reports (inbox: incidents, deliveries, project mail)
         → Contractors (certs + project history)
         → Settings (Dark Mode)
```

**Current flow in this repo:** Landing → Login → success message only (no dashboard).

## Brand & UI notes

**Landing direction (keep as source of truth where possible):**

- Accent orange `#FF6E00` (docs explicitly moved hero aesthetics to orange accents)
- Dark CTA `#181C20`
- Text `#111111`
- Rectangular (`rounded-none`) buttons
- Serif display headlines (DM Serif Display intent via `font-serif`)
- Full-bleed site photography; docs also describe pairing orange accents with a dominantly blue hero image
- Stats strip under the hero (projects / capital / on-time / contractors)
- Authenticated UI aims for a **database / directory aesthetic** for the project list

**Known UI gaps in this repo:**

- Fonts are loaded in HTML but **not mapped in Tailwind `@theme`**
- Login page uses a different orange (`#FF7F3F`), rounded cards, and an emoji mark — inconsistent with landing
- Nav anchors `#features`, `#about`, `#contact` have no matching sections
- Stock Vite favicon; unused template assets and `App.css` remain

## How to run (expected)

```bash
npm install
# Create .env.local with:
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...
npm run dev
```

Scripts: `dev`, `build`, `lint`, `preview`.

## Current status snapshot

| Area | Status in this repo | Per product docs |
|------|---------------------|------------------|
| Landing hero | Present (orange + crane image) | Updated aesthetics documented |
| Login | Auth spike only | + Request Access screening form |
| Dashboard / left nav | Missing | Projects, Reports, Contractors, Settings |
| Project directory | Missing | Ribbon, filters, search, sort, add, expenditure |
| Project detail | Missing | Overview, Personnel, Documents, BOQ, Scheduling |
| Reports inbox | Missing | Incidents, deliveries, project email |
| Contractors | Missing | Certs + project history |
| Settings / dark mode | Missing | Documented |
| Routing / session | Missing | Assumed for full app |

## Conventions for agents

- Prefer extending the existing Vite + React + Tailwind + Supabase stack unless the user asks to change it.
- Treat the **landing brand language** and the **update docs’ IA** as product truth; implement toward that shell.
- **BOQ is view-only** — do not build edit flows unless the user explicitly changes that rule.
- Scheduling should stay **phase-aligned** with BOQ and support a **list + Gantt** layout.
- Do not invent a full product schema without confirming domain priorities with the user; when in doubt, start with the project directory.
- Keep secrets out of git; use Vite `VITE_*` env vars only.
- Avoid drive-by refactors of unrelated template leftovers unless cleaning them is part of the task.

## Related artifacts

- Product context canvas: open [Sadiconstruction product context](C:/Users/Yushin/.cursor/projects/c-Users-Yushin-OneDrive-Desktop-BSCPE-3-7-Personal-Projects-SadiCon-sadiconstruction-2-0/canvases/sadiconstruction-product-context.canvas.tsx) beside chat
- [`IDEA.md`](IDEA.md) — critical-path scheduling from BOQ (locked decisions + feature inventory)
- [`docs/PRD.md`](docs/PRD.md) · [`docs/Siteflow.md`](docs/Siteflow.md) · [`docs/Userflow.md`](docs/Userflow.md) — lean foundation docs (ERD separate)
- [`docs/research/2026-09-14-deep-research-cpm-scheduling.md`](docs/research/2026-09-14-deep-research-cpm-scheduling.md) — ingested deep research
- [Sadi Construction Updated](https://docs.google.com/document/d/1XIjmzbjB9cSNKhLT252K9pYdZFRK79z2UwMwai3MlQ4/edit?usp=sharing)
- [Sadiconstruction Latest Updates](https://docs.google.com/document/d/1t2aotFlIY0lVEVGFpn84OQP9dbATCD6ZqIL2daAJfBA/edit?usp=sharing)
- `README.md` — still the default Vite boilerplate; replace when documenting setup for contributors
