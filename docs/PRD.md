# PRD — Sadiconstruction (Scheduling-from-BOQ foundation)

> Solidified 2026-09-15. Glossary: [`CONTEXT.md`](../CONTEXT.md). Placement: [`Siteflow.md`](Siteflow.md). Journeys: [`Userflow.md`](Userflow.md). Schema: [`ERD.md`](ERD.md) · [`DATA-MODEL.md`](DATA-MODEL.md).  
> Research: [`research/2026-09-14-deep-research-cpm-scheduling.md`](research/2026-09-14-deep-research-cpm-scheduling.md) · free-tier notes under `docs/research/`.

## Problem

BOQ (money / scope by phase) and schedule (time / logic) are disconnected. Planners need Project Libre–class critical-path evaluation **inside** Sadiconstruction: same WBS as the BOQ, live recomputation, list + Gantt — without shipping or importing Project Libre.

## Product framing

Sadiconstruction is an **internal** construction project-management platform (not public multi-tenant SaaS). Near-term success is the authenticated shell plus **Scheduling tied to view-only BOQ**, on a **free-tier** Vite + React + Supabase stack.

## Goals

1. Tie Scheduling WBS to the approved BOQ (Phase Roots locked; one-way BOQ → schedule).
2. Own a first-party CPM Engine (topo sort, forward/backward pass, float, Longest Path) reverse-engineered from Project Libre’s evaluation process and recreated on Vite / React / Supabase.
3. Show Longest Path and float in a split list + Gantt view, colored by BOQ Phase.
4. Stay within Supabase Free constraints: client-side CPM, lean persistence, Storage for files (not DB bytea), single active project instance for prod.

## Non-goals

- Editing BOQ from Scheduling  
- Importing / embedding Project Libre or MSPDI / `.pod` as a product path  
- Probabilistic PERT / Monte Carlo as the engine  
- Resource leveling or cost-loaded CPM  
- Multiple calendars or a Progress Override toggle  
- Paying for Pro features as a prerequisite for v1  

## Locked decisions

| Topic | Decision |
|-------|----------|
| Calendar | One Project Calendar per Project |
| Out-of-sequence | Retained Logic only |
| WBS under a phase | Nested Summaries allowed |
| Project Libre | Reference for algorithms — recreate in our stack |
| Criticality | Longest Path (AACE 49R-06 family); LOE excluded when marked |
| BOQ | View-only in product UI |
| CPM placement | Client-side JS module; persist network inputs; recompute on edit |
| Persistence | Supabase Postgres + Auth + Storage (Free) |
| Hierarchy | Adjacency list (`parent_id`) for Schedule Nodes |

## Capabilities

### In (foundation)

| Capability | Requirement |
|------------|-------------|
| Auth shell | Staff Member session, protected routes, logout |
| Access screening | Access Request form; admin grants credentials (no open signup) |
| Project directory | Ribbon by Project Stage, search, sort, add, expenditure signal |
| Project tabs | Overview, Key Personnel, Documents, BOQ (view-only), Scheduling |
| BOQ → WBS sync | Seed / refresh Phase Roots from BOQ Phases; roots locked |
| Network authoring | Nested Summaries + Leaf Activities; Duration in working days |
| Dependencies | FS, SS, FF, SF + lag/lead |
| CPM Engine | Cycle detection; ES/EF/LS/LF; total & free float; Longest Path |
| Split-view Gantt | Phase color + critical highlight; sync with tree expand/selection |
| Recalculate | On every network edit (duration, dependency, structure) |
| Invalid states | Cycle Error banner; empty under phases; no BOQ phases gate |

### Later (supporting)

- Explicit LOE / hammock designation in UI (engine may stub exclusion early)
- Baseline vs update / delay snapshots
- MSPDI import as migration aid only (still recompute — never trust exported Critical)

## Actors

| Actor | Job |
|-------|-----|
| Planner / Scheduler | Build and maintain the network; keep Longest Path valid |
| Project Manager | Review Longest Path and phase impact; communicate risk |
| Admin | Approve Access Requests; manage Staff Member Roles |

Exact Role → permission matrix: [`OPEN-DECISIONS.md`](OPEN-DECISIONS.md) D1 / [`adr/0005-role-permission-matrix.md`](adr/0005-role-permission-matrix.md).

## Success criteria

1. Clearwater-like BOQ (Parts A/B/C) seeds Scheduling Phase Roots; planner nests summaries and leaves without inventing billable phases.
2. Changing a Duration or Dependency recalculates dates, float, and Longest Path without desktop tools.
3. Cycles halt CPM and surface a clear error until fixed.
4. Critical bars/rows are visually distinct from non-critical work on the Gantt.
5. App runs on Supabase Free without Edge Functions for CPM and without storing documents as bytea.

## Conceptual objects

See glossary in [`CONTEXT.md`](../CONTEXT.md). Schema in [`ERD.md`](ERD.md).

## Reference mock

Clearwater Medical Center · PRJ-2024-008 — BOQ Parts A (General Requirements), B (Site Works), C (Concrete Works).  
Interactive: [`mockups/scheduling-clearwater.html`](mockups/scheduling-clearwater.html)

## Free-tier constraints (product-facing)

| Constraint | Implication |
|------------|-------------|
| ~500 MB DB / project | Store inputs + light cached metrics; no file blobs in Postgres |
| 1 GB Storage · **50 MB max file** | Document uploads; enforce per-file + per-Project quotas ([Storage limits](https://supabase.com/docs/guides/storage/uploads/file-limits)) |
| Pause after inactivity (~1 week) | Internal use: expect cold starts; keep one active Free project |
| Edge Function quotas · **~2 s CPU** | Prefer client CPM; never Edge-per-keystroke ([Functions limits](https://supabase.com/docs/guides/functions/limits)) |
| No Free backups | Export/seed scripts and documented recovery — see OPEN-DECISIONS |
| Shared CPU · ~500 MB RAM | Lean queries; no server-side graph algorithms |

## Out of this doc

API contracts · pixel-perfect design tokens (see [`DESIGN.md`](../DESIGN.md)) · ticket IDs (see [`TICKETS.md`](TICKETS.md))
