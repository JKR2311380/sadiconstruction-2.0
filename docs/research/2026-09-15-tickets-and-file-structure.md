# Research — Ticket Breakdown, App File Structure & Governing Docs

> **Date:** 2026-09-15  
> **Product:** Sadiconstruction 2.0 — internal construction PM (Vite + React + Tailwind + Supabase)  
> **Current code:** landing + login spike only  
> **Product intent:** Auth + request access → left-nav shell → project directory → project tabs (Overview, Personnel, Documents, BOQ view-only, Scheduling CPM from BOQ)  
> **Governing product docs already in repo:** [`IDEA.md`](../../IDEA.md), [`docs/PRD.md`](../PRD.md), [`docs/Siteflow.md`](../Siteflow.md), [`docs/Userflow.md`](../Userflow.md), [`docs/ERD.md`](../ERD.md), [`docs/DATA-MODEL.md`](../DATA-MODEL.md), [`CONTEXT.md`](../../CONTEXT.md)

---

## 1. Verdict (actionable)

| Area | Recommendation for Sadiconstruction |
|------|-------------------------------------|
| **Ticket hierarchy** | Prefer **Linear-shaped** planning: one Initiative (or GitHub Milestone) for “Platform foundation + Scheduling from BOQ”; **Projects** ≈ product Epics; **Issues** ≈ Stories; **Sub-issues** ≈ Tasks. Keep epics outcome-scoped; put AC only on stories. |
| **App layout** | **Feature modules** under `src/features/{auth,shell,projects,boq,scheduling}/` with a **public `index.ts` seam** each; keep **CPM engine** as a deep pure module (`features/scheduling/engine/`) with no React/Supabase imports; `supabase/` for migrations + generated types. |
| **Docs layout** | Keep product truth in `docs/` (PRD / Siteflow / Userflow / ERD / Data Model); put ADRs in `docs/adr/`; research in `docs/research/`; optional ticket mirrors in `docs/tickets/`; root stays thin (`IDEA`, `CONTEXT`, `README`). |

Concrete epic list for this release is in **§5**.

---

## 2. Product / engineering ticket breakdown

### 2.1 What mature teams actually do

**Linear (primary product model)**  
Linear’s official conceptual model is: **Issues** (atomic work) → **Projects** (shared outcome / feature launch) → **Initiatives** (strategic multi-project efforts), with optional **Milestones** inside a project and **Cycles** as the team time-box (not nested in the hierarchy). Sub-issues exist when work is “too large for one issue but too small for a project.”  
Source: [Linear — Concepts](https://linear.app/docs/conceptual-model), [Linear — Projects](https://linear.app/docs/projects), [Linear — Scaling companies](https://linear.app/docs/how-to-use-linear-large-scaling-companies).

**Mapping for an internal SaaS team that still says “Epic → Story → Task”:**

| Familiar Agile term | Linear object | GitHub equivalent |
|---------------------|---------------|-------------------|
| Initiative / Theme | Initiative | Milestone or Project board + label `theme` |
| Epic | Project (or parent Issue labeled Epic) | Issue type `Epic` / parent issue |
| Story | Issue | Issue type `Story` |
| Task | Sub-issue | Issue type `Task` / checklist / sub-issue |
| Enabler | Issue with label `enabler` | Same |

**GitHub issue forms (primary tooling practice)**  
GitHub documents YAML issue forms under `.github/ISSUE_TEMPLATE/`, with optional native `type:` (Epic / Story / Task / Bug), labels, projects, and structured body fields. Prefix filenames (`01-epic.yml`, `02-story.yml`) to control chooser order; use `config.yml` to disable blank issues for contributors.  
Source: [Configuring issue templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository), [Syntax for issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms).

**Agent-ready ticket discipline (widely adopted patterns)**  
Consistent patterns across Linear craft skills and GitHub “breakdown-plan” style work:

- **Epics:** Goal · Outcomes · Out of scope · Child list — **no** acceptance criteria.  
- **Stories:** Imperative title · link to epic · problem/solution · **testable AC checklist** · repo paths / seams to touch · “do not touch”.  
- **Split by domain seam** when UI + persistence + pure engine change together (separate linked tickets; dependency order: schema → engine → API/hooks → UI).  
- **Reference governing docs** (`docs/PRD.md`, `docs/Userflow.md`) instead of pasting the PRD into every ticket.

Sources: [MarsBased Linear guidelines](https://github.com/MarsBased/handbook/blob/main/guides/linear-guidelines.md), [linearstories hierarchy rules](https://github.com/stackingturtles/linearstories), [GitHub awesome-copilot breakdown-plan](https://github.com/github/awesome-copilot/blob/main/skills/breakdown-plan/SKILL.md), [agent-ready Linear template](https://github.com/b-open-io/prompts/blob/master/skills/linear-planning/references/issue-template.md).

### 2.2 How construction / PM SaaS product surfaces map to epics

Mature construction platforms **slice product by domain tool**, not by technical layer. Procore’s public surface and API treat **WBS / BOQ-like financials** and **project tools** as separate modules that share project identity and budget/WBS codes; schedule is another tool family. That is the right epic grain for Sadiconstruction: Auth, Shell, Projects, BOQ, Scheduling — not “Frontend Epic” / “Backend Epic”.  
Sources: [Procore — tools that support WBS](https://en-gb.support.procore.com/faq/which-procore-tools-support-work-breakdown-structure), [Procore REST — WBS segments](https://developers.procore.com/reference/rest/segments).

Implication for tickets: **BOQ → Schedule WBS sync** is an explicit cross-module story with a one-way seam (BOQ owns phase roots; Scheduling never invents billable phases) — matching your PRD / Siteflow.

### 2.3 How open-source CPM projects structure *engineering* work (module seams → ticket seams)

| Project | Layout signal | Ticket implication |
|---------|---------------|--------------------|
| **Project Libre / OpenProj** | Multi-module: `openproj_core` (domain + `com.projity.pm.criticalpath`) vs `openproj_ui` vs `openproj_exchange`. Scheduling behind `SchedulingAlgorithm` / `CriticalPath`; UI does not own the math. | Separate epics/stories for **engine**, **persistence/model**, **UI**. Engine stories ship with pure unit tests first. |
| **cpm-scheduling-saas** | `backend/` (pure CPM fns + API) · `frontend/` (Gantt) · `db/` (schema/RLS) · `contracts/` (JSON Schema). | Epic slices: schema/RLS → calculate contract → board UI. Keep a **contracts** story when payloads stabilize. |
| **ganttRx** | Library isolates canvas Gantt + CPM/auto-schedule from host app. | Optional later: extract UI widget; **do not** couple first CPM stories to a third-party Gantt. |
| **Project-Management-Tool** | `models/` · `services/` (algorithms) · `components/` · `hooks/`. | Stories that change CPM live in `services`/engine; UI stories only consume metrics. |

Sources: [ProjectLibre module tree (mirror)](https://github.laiyagushi.com/smartqubit/projectlibre), [CriticalPath / SchedulingAlgorithm package](https://www.javatips.net/api/ProjectLibre-master/openproj_core/src/com/projity/pm/criticalpath/SchedulingAlgorithm.java), [cpm-scheduling-saas README](https://github.com/m0989369498-svg/cpm-scheduling-saas), [ganttRx](https://github.com/lucassmaestri/ganttRx), [mbarryyy/Project-Management-Tool](https://github.com/mbarryyy/Project-Management-Tool).

### 2.4 Practical slicing rules for CPM + BOQ

1. **Vertical slices that end in demoable UI**, but keep the **CPM engine as its own enabler milestone** with golden fixtures (Clearwater network).  
2. **Never** mix “fix cycle banner” and “implement forward pass” in one story — different AC, different tests.  
3. Gate Scheduling UI on **approved BOQ phases exist** (Siteflow empty/invalid states).  
4. Prerequisites (auth, shell, projects, seed BOQ) are **blocking epics**, not footnotes on Scheduling.  
5. Story size target: one PR, ≤ ~1–2 days; if a story needs both schema migration and Gantt arrows, split.

### 2.5 Suggested issue templates (drop into `.github/ISSUE_TEMPLATE/`)

**Epic body skeleton**

```markdown
## Goal
## Outcomes
## Out of scope
## Governing docs
- PRD / Siteflow / Userflow / ERD / ADR links
## Child stories
- [ ] …
## Definition of done
- [ ] All children Done
- [ ] Demo path recorded (actor + URL)
```

**Story body skeleton**

```markdown
## Parent
Epic: …
## User story
As a … I want … so that …
## Spec pointers
- `docs/Userflow.md` Flow A steps …
- Seams: `features/scheduling/engine`, …
## Do not touch
- …
## Acceptance criteria
- [ ] …
- [ ] Unit/integration test named …
```

---

## 3. Recommended Vite + React + Supabase folder structure

### 3.1 Patterns from primary / notable starters

| Source | Layout takeaway |
|--------|-----------------|
| [Supabase React user-management (Vite)](https://github.com/supabase/supabase/tree/master/examples/user-management/react-user-management) | Thin spike: `supabaseClient`, Auth, Account at `src/` root — fine for demos, **not** for multi-domain SaaS. |
| [kortix-ai/vite-supabase-starter](https://github.com/kortix-ai/vite-supabase-starter) | `src/lib/supabase.ts`, `routes/`, `components/ui/`, `supabase/functions/` — **agent conventions** documented in-repo (how to add routes, protected layouts, API layer). |
| [pomkatsu/vite-react-supabase-starter](https://github.com/pomkatsu/vite-react-supabase-starter) | `features/auth`, `components/layout` (AppShell), `supabase/migrations`, seed — closest SaaS shell pattern. |
| [mmvergara/react-supabase-auth-template](https://github.com/mmvergara/react-supabase-auth-template) | Session context + router guards as first-class seams. |
| Feature-module / FSD-style guides | One public `index.ts` per feature; no deep cross-feature imports; shared primitives only in `shared/` or `components/ui`. |

### 3.2 Deep-module rules (AI-navigable)

Use Ousterhout-style **depth**: small interface, large implementation; name the **seam** explicitly.

| Module | Public interface (small) | Hidden implementation |
|--------|--------------------------|------------------------|
| `scheduling/engine` | `calculateSchedule(input) → { metrics \| cycleError }` | topo sort, FS/SS/FF/SF + lag, calendar, Longest Path |
| `boq` | `listPhases(projectId)`, `getApprovedBoq(projectId)` | tables, RLS, mappers |
| `scheduling` (app) | hooks + page: load network, mutate node/dependency, run engine, persist inputs | Gantt, grid editors |
| `auth` | `useSession`, `RequireStaff`, request-access actions | Supabase Auth details |
| `projects` | `listProjects`, `getProject`, directory UI | filters, stage badges |

**Import law**

- `features/A` may import `features/B` **only** via `features/B` public exports.  
- `engine` must not import React, router, or Supabase.  
- UI may call `calculateSchedule` after load; DB stores **inputs** (nodes, deps, calendar), not authoritative floats ([`DATA-MODEL.md`](../DATA-MODEL.md)).

### 3.3 Target tree for Sadiconstruction

```text
sadiconstruction-2.0/
├── src/
│   ├── app/                      # providers, router composition only
│   │   ├── App.tsx
│   │   ├── providers.tsx
│   │   └── router.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   ├── components/       # Login, RequestAccess
│   │   │   ├── hooks/            # useSession, useAccessRequest
│   │   │   ├── guards.tsx
│   │   │   └── index.ts          # PUBLIC SEAM
│   │   ├── shell/
│   │   │   ├── components/       # LeftNav, AppShell, ProjectTabs
│   │   │   └── index.ts
│   │   ├── projects/
│   │   │   ├── api/
│   │   │   ├── components/       # Directory, Overview tab shell
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   ├── personnel/            # thin tab module
│   │   ├── documents/            # metadata + Storage paths
│   │   ├── boq/
│   │   │   ├── api/
│   │   │   ├── components/       # view-only BOQ
│   │   │   ├── hooks/
│   │   │   └── index.ts          # export phase DTO used by scheduling
│   │   └── scheduling/
│   │       ├── engine/           # DEEP MODULE — pure TS
│   │       │   ├── types.ts
│   │       │   ├── topo.ts
│   │       │   ├── forward-backward.ts
│   │       │   ├── longest-path.ts
│   │       │   ├── calendar.ts
│   │       │   ├── calculate.ts  # single entry
│   │       │   ├── calculate.test.ts
│   │       │   └── index.ts
│   │       ├── api/              # persist nodes/deps; no CPM in SQL
│   │       ├── components/       # ActivityTree, Gantt, CycleBanner
│   │       ├── hooks/            # useSchedule, useRecalculate
│   │       ├── fixtures/         # Clearwater golden network
│   │       └── index.ts
│   ├── shared/                   # or components/ + lib/
│   │   ├── ui/                   # Tailwind primitives
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   └── cn.ts
│   │   └── types/                # re-export generated DB types
│   ├── pages/                    # optional thin route adapters
│   └── main.tsx
├── supabase/
│   ├── config.toml
│   ├── migrations/               # one concern per migration when possible
│   ├── seed.sql                  # Clearwater project + BOQ phases
│   └── functions/                # only if server logic needed later
├── docs/                         # see §4
└── .github/ISSUE_TEMPLATE/
```

**Why this over type-folders (`components/`, `hooks/` globally):** domain change locality matches tickets (“Scheduling epic” → one folder); agents grep `features/scheduling` instead of hunting across `hooks/` and `services/`.

**Migration path from today’s spike:** move `LoginPage.jsx` / `supabaseClient.js` into `features/auth` + `shared/lib/supabase.ts` in Epic A without redesigning UI.

### 3.4 Testing seams

| Layer | Test location | What to assert |
|-------|---------------|----------------|
| Engine | `engine/*.test.ts` | Clearwater critical set, cycle rejection, lag types |
| API mappers | `features/*/api/*.test.ts` | DTO ↔ row shape |
| UI | sparse component tests / Playwright later | empty / valid / cycle states from Siteflow |

---

## 4. How to organize governing docs in the repo

### 4.1 Principles (primary sources)

- **ADRs live in the same repo as the code**, short Markdown, sequential IDs, supersede don’t delete — Nygard’s original practice (`doc/arch/adr-NNN.md`) and MADR’s `docs/decisions/`.  
  Sources: [Nygard — Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), [MADR](https://github.com/adr/madr), [Google Cloud — ADR overview](https://docs.cloud.google.com/architecture/architecture-decision-records).
- **Product specs are not ADRs.** PRD / Siteflow / Userflow answer *what* and *where in the product*; ADRs answer *why we chose a durable technical option*.
- **Research is input**, not product truth — keep dated under `docs/research/` (this file’s convention).
- **Tickets** may be mirrored as Markdown for AI/offline planning, but the tracker (Linear/GitHub) remains execution SoT.

### 4.2 Recommended layout (fits what you already have)

```text
/
├── README.md                 # run / stack / link to docs index
├── IDEA.md                   # one-liner + insight (keep short)
├── CONTEXT.md                # ubiquitous language (glossary)
├── PRODUCT.md / DESIGN.md    # optional umbrella; don’t duplicate PRD
├── docs/
│   ├── README.md             # index: what to read in what order
│   ├── PRD.md                # requirements SoT for Scheduling-from-BOQ
│   ├── Siteflow.md           # product placement / IA
│   ├── Userflow.md           # actor journeys
│   ├── ERD.md                # diagram
│   ├── DATA-MODEL.md         # tables, persist-vs-compute
│   ├── OPEN-DECISIONS.md     # optional scratch before ADR
│   ├── adr/
│   │   ├── README.md         # index + status legend
│   │   ├── 0000-template.md
│   │   ├── 0001-client-side-cpm-engine.md
│   │   ├── 0002-boq-owns-phase-roots.md
│   │   └── …
│   ├── research/
│   │   ├── 2026-09-14-deep-research-cpm-scheduling.md
│   │   ├── 2026-09-15-tickets-and-file-structure.md  ← this file
│   │   └── …
│   ├── tickets/              # optional mirrors of epics/stories
│   │   ├── README.md         # “mirrors only; create issues from these”
│   │   ├── E01-auth.md
│   │   └── …
│   └── mockups/              # already referenced from Siteflow
└── .github/
    ├── ISSUE_TEMPLATE/
    └── PULL_REQUEST_TEMPLATE.md  # checkbox: new ADR needed?
```

### 4.3 Doc roles (no overlap)

| Doc | Owns | Does not own |
|-----|------|--------------|
| IDEA | Problem/insight elevator | AC, schema |
| PRD | Goals, non-goals, capabilities | Folder structure, sprint plan |
| Siteflow | Placement in shell/tabs | Algorithms |
| Userflow | Actor journeys + failure recovery | Table columns |
| ERD / Data Model | Entities & persist rules | UI chrome |
| ADR | One durable technical choice | Feature laundry lists |
| Research | Cited investigation | Binding requirements (promote into PRD/ADR) |
| Tickets | Executable slices + AC | Conflicting “second PRD” |

### 4.4 First ADRs to file when implementation starts

1. **Client-side CPM** (matches ERD stance) vs Edge Function.  
2. **BOQ → phase roots one-way sync** mechanism (trigger on read vs materialize rows).  
3. **Feature-folder + public `index.ts` import law**.  
4. **Auth model**: access-request gate before `profiles` (Staff Member).

---

## 5. Concrete epic list — Sadiconstruction foundation + Scheduling from BOQ

Assumptions from current docs: single-org internal app; CPM client-side; BOQ view-only; Scheduling needs approved BOQ phases; Clearwater (PRJ-2024-008) as reference.

**Tracker mapping:** treat each **E0x** as a Linear **Project** (or GitHub Epic issue). Stories = issues. Tasks = sub-issues only when a story exceeds one PR.

**Suggested Initiative:** `I1 — Platform shell + Scheduling from BOQ (v1)`

**Dependency order:** E01 → E02 → E03 → E04 → (E05 ∥ E06 early) → E07 → E08 → E09 → E10.

---

### E01 — Auth & access gate

**Outcome:** Guests can request access; approved staff can sign in; unauthenticated users never reach the app shell.

| ID | Story | Notes / AC focus |
|----|-------|------------------|
| E01-S1 | Supabase client + env + generated types pipeline | `shared/lib/supabase.ts`; `supabase gen types` |
| E01-S2 | Login (email OTP or password — pick in ADR) | Session via `getUser()` pattern per Supabase React example |
| E01-S3 | Access request form + persistence | `access_requests` table; no Staff Member until approve |
| E01-S4 | Admin approve/reject → create `profiles` | Role enum per DATA-MODEL |
| E01-S5 | Route guards (`RequireStaff`) | Redirect landing/login |

**Out of scope:** SSO, multi-tenant orgs, password reset polish beyond MVP.

---

### E02 — App shell & left navigation

**Outcome:** Authenticated chrome matches Siteflow: left nav + outlet for Projects (Reports/Contractors/Settings can be stubs).

| ID | Story | Notes / AC focus |
|----|-------|------------------|
| E02-S1 | `AppShell` + left nav IA | Projects active; other items stub routes |
| E02-S2 | Sign-out + staff display | |
| E02-S3 | Responsive nav (usable mobile) | No redesign of Scheduling yet |

---

### E03 — Project directory

**Outcome:** Staff can list/open projects (seed Clearwater).

| ID | Story | Notes / AC focus |
|----|-------|------------------|
| E03-S1 | `projects` table + RLS (staff read) | |
| E03-S2 | Directory list UI (code, name, stage) | |
| E03-S3 | Create project (minimal fields) | Admin/planner only if roles exist |
| E03-S4 | Project route `/projects/:id` | |

---

### E04 — Project detail tabs shell

**Outcome:** Tab bar: Overview · Personnel · Documents · BOQ · Scheduling; deep-link restores tab.

| ID | Story | Notes / AC focus |
|----|-------|------------------|
| E04-S1 | Tab router + empty panels | Matches Siteflow placement |
| E04-S2 | Overview stub (identity fields) | |
| E04-S3 | Personnel stub list | Can be placeholder rows |
| E04-S4 | Documents stub (metadata only) | Storage wiring optional later |

---

### E05 — BOQ view-only + phase seed

**Outcome:** Approved BOQ phases/lines visible; phases are the WBS source for Scheduling.

| ID | Story | Notes / AC focus |
|----|-------|------------------|
| E05-S1 | BOQ / phase / line schema + seed Clearwater A/B/C | |
| E05-S2 | BOQ tab read-only UI | No edit controls |
| E05-S3 | Public seam `getApprovedPhases(projectId)` | Consumed by Scheduling |
| E05-S4 | Gate helper `projectHasApprovedBoq` | Drives Scheduling empty state |

---

### E06 — Scheduling data model & BOQ → WBS sync

**Outcome:** Schedule nodes/deps/calendar persist; phase roots locked 1:1 to BOQ phases.

| ID | Story | Notes / AC focus |
|----|-------|------------------|
| E06-S1 | `schedule_nodes`, `dependencies`, `project_calendars` migrations | Per ERD/DATA-MODEL |
| E06-S2 | Materialize/ensure phase-root nodes from BOQ | Idempotent; cannot delete/reparent roots from API |
| E06-S3 | CRUD nested summaries + leaves under a phase | |
| E06-S4 | CRUD dependencies (FS/SS/FF/SF + lag) | Validation of endpoint existence |
| E06-S5 | Global calendar read/update (working days) | One calendar per project |

**ADR:** sync-on-open vs DB trigger — pick one before S2.

---

### E07 — CPM engine (pure module)

**Outcome:** Deterministic CPM matching Product Libre–class process: topo → forward/back → float → Longest Path; cycles fail closed.

| ID | Story | Notes / AC focus |
|----|-------|------------------|
| E07-S1 | Engine types + `calculateSchedule` signature | No React |
| E07-S2 | Topo sort + cycle error payload | |
| E07-S3 | Forward / backward pass + working-day calendar | |
| E07-S4 | Total float (+ free float if in PRD foundation) | |
| E07-S5 | Longest Path criticality | AACE-oriented; LOE exclude hook even if LOE UI later |
| E07-S6 | Clearwater golden fixture tests | Freeze expected critical set |

**Out of scope:** Progress Override, multi-calendar, resource leveling, PERT engine.

---

### E08 — Scheduling UI (list + Gantt)

**Outcome:** Siteflow split view; Userflow A/B/C supported for happy path + cycle.

| ID | Story | Notes / AC focus |
|----|-------|------------------|
| E08-S1 | Load network + run engine on mount | |
| E08-S2 | Activity tree columns (duration, preds, ES/EF/LS/LF, TF, critical) | Phase roots locked in UI |
| E08-S3 | Add summary / leaf under phase | |
| E08-S4 | Edit duration + predecessors → recalc | |
| E08-S5 | Gantt bars + phase colors + critical paint | |
| E08-S6 | Cycle banner + halt critical paint | Userflow failure table |
| E08-S7 | Empty states (no BOQ / phases only) | Siteflow states |

---

### E09 — Hardening & roles

**Outcome:** Planner edit vs PM read-heavy path; basic RLS aligned to roles.

| ID | Story | Notes / AC focus |
|----|-------|------------------|
| E09-S1 | RLS: schedule writes for planner/admin | PM/viewer read |
| E09-S2 | UI read-only mode for PM | Flow C |
| E09-S3 | Recalc stamp / ignore stale cache columns | DATA-MODEL rule |

---

### E10 — Quality gate / demo slice

**Outcome:** Rehearsable Clearwater demo; docs + tickets cross-linked.

| ID | Story | Notes / AC focus |
|----|-------|------------------|
| E10-S1 | Seed script one-command demo | |
| E10-S2 | Playwright (or manual script) for Flow A | |
| E10-S3 | ADR pack + docs README index | |
| E10-S4 | Issue templates landed in `.github` | |

---

### Epic → folder → doc traceability

| Epic | Primary folders | Governing docs |
|------|-----------------|----------------|
| E01 | `features/auth` | CONTEXT (Staff/Access Request), ERD |
| E02 | `features/shell` | Siteflow |
| E03–E04 | `features/projects` | Siteflow, ERD |
| E05 | `features/boq` | PRD, Siteflow, ERD |
| E06 | `features/scheduling/api` | ERD, DATA-MODEL, PRD locked decisions |
| E07 | `features/scheduling/engine` | PRD, research CPM docs, Userflow calc path |
| E08 | `features/scheduling/components` | Siteflow, Userflow, mockups |
| E09–E10 | cross-cutting | ADR, DATA-MODEL |

---

## 6. Suggested first ADRs & first week of tickets

**Week 0 (docs/process only)**  
- Add `docs/adr/0001-…` client-side CPM, `0002-…` BOQ owns phase roots, `0003-…` feature modules.  
- Create Initiative + E01–E05 projects/epics in tracker from §5.  
- Add GitHub/Linear issue templates.

**Week 1 engineering**  
- E01-S1…S5 and E02-S1 (shell) — unlocks everything else.  
- Parallelize E07-S1…S2 (engine types + topo) against E03 once auth works — engine has no UI dependency.

---

## 7. Sources

### Ticket / planning
- [Linear Concepts](https://linear.app/docs/conceptual-model)  
- [Linear Projects](https://linear.app/docs/projects)  
- [Linear — large companies](https://linear.app/docs/how-to-use-linear-large-scaling-companies)  
- [GitHub — Configuring issue templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)  
- [GitHub — Syntax for issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)  
- [MarsBased handbook — Linear guidelines](https://github.com/MarsBased/handbook/blob/main/guides/linear-guidelines.md)  
- [stackingturtles/linearstories](https://github.com/stackingturtles/linearstories)  
- [github/awesome-copilot — breakdown-plan](https://github.com/github/awesome-copilot/blob/main/skills/breakdown-plan/SKILL.md)  
- [b-open-io — agent-ready issue template](https://github.com/b-open-io/prompts/blob/master/skills/linear-planning/references/issue-template.md)

### Construction product module grain
- [Procore — WBS-supporting tools](https://en-gb.support.procore.com/faq/which-procore-tools-support-work-breakdown-structure)  
- [Procore API — WBS segments](https://developers.procore.com/reference/rest/segments)

### CPM / PM open source layouts
- [ProjectLibre / OpenProj multi-module layout](https://github.laiyagushi.com/smartqubit/projectlibre)  
- [SchedulingAlgorithm (openproj_core criticalpath)](https://www.javatips.net/api/ProjectLibre-master/openproj_core/src/com/projity/pm/criticalpath/SchedulingAlgorithm.java)  
- [erdincay/projectlibre — CriticalPath usage notes](https://context7.com/erdincay/projectlibre/llms.txt)  
- [m0989369498-svg/cpm-scheduling-saas](https://github.com/m0989369498-svg/cpm-scheduling-saas)  
- [lucassmaestri/ganttRx](https://github.com/lucassmaestri/ganttRx)  
- [mbarryyy/Project-Management-Tool](https://github.com/mbarryyy/Project-Management-Tool)

### Vite + React + Supabase structure
- [Supabase — React user management example](https://github.com/supabase/supabase/tree/master/examples/user-management/react-user-management)  
- [kortix-ai/vite-supabase-starter](https://github.com/kortix-ai/vite-supabase-starter)  
- [pomkatsu/vite-react-supabase-starter](https://github.com/pomkatsu/vite-react-supabase-starter)  
- [mmvergara/react-supabase-auth-template](https://github.com/mmvergara/react-supabase-auth-template)

### Docs / ADRs
- [Nygard — Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)  
- [MADR (adr/madr)](https://github.com/adr/madr)  
- [Google Cloud — Architecture decision records overview](https://docs.cloud.google.com/architecture/architecture-decision-records)

### In-repo product context
- [`docs/PRD.md`](../PRD.md), [`docs/Siteflow.md`](../Siteflow.md), [`docs/Userflow.md`](../Userflow.md), [`docs/ERD.md`](../ERD.md), [`docs/DATA-MODEL.md`](../DATA-MODEL.md), [`CONTEXT.md`](../../CONTEXT.md)
