# Tickets — implementation backlog

> Solidified 2026-09-15. Ordered for a free-tier vertical slice. Glossary: [`CONTEXT.md`](../CONTEXT.md). Schema: [`DATA-MODEL.md`](DATA-MODEL.md). Structure: [`FILE-STRUCTURE.md`](FILE-STRUCTURE.md).  
> Expanded epic/story grain (E01–E10, Linear mapping, issue templates): [`research/2026-09-15-tickets-and-file-structure.md`](research/2026-09-15-tickets-and-file-structure.md).

## Epic map

```
E0 Research & governing docs     ← done this ideation pass
E1 Auth & Access Request
E2 App shell & routing
E3 Project directory
E4 Project detail chrome + Overview
E5 BOQ view-only + seed data
E6 CPM Engine (pure module)
E7 Scheduling UI (tree + Gantt)
E8 Documents (Storage)
E9 Contractors / Reports / Settings  ← later
E10 CI/CD                            ← specified; not implemented
```

---

## E0 — Governing docs (complete)

- [x] Solidify PRD, Siteflow, Userflow  
- [x] ERD + Data Model + ADRs  
- [x] File structure + tickets  
- [x] OPEN-DECISIONS resolved (2026-09-15 prototype pass) + living ARCHITECTURE / STATE / UI_UX  

---

## E1 — Auth & Access Request

| ID | Ticket | Acceptance |
|----|--------|------------|
| T1.1 | Session lifecycle | `onAuthStateChange`; persist session; logout control in shell |
| T1.2 | Protected routes | Unauthenticated users cannot see Projects; redirect to Login |
| T1.3 | Request Access page | Guest submits `access_requests`; success confirmation; no auto-account |
| T1.4 | Admin approve path | Admin marks request approved and creates auth user + `profiles` row (script or simple admin UI) |
| T1.5 | `.env.example` + README setup | Document `VITE_SUPABASE_*`; remove stock Vite-only README claims |

**Depends on:** OPEN-DECISIONS — Role names; how Admin is bootstrapped.

---

## E2 — App shell & routing

| ID | Ticket | Acceptance |
|----|--------|------------|
| T2.1 | Add React Router | URL routes for landing, login, request-access, app/* |
| T2.2 | AppShell left nav | Projects, Reports, Contractors, Settings links; active rail per DESIGN |
| T2.3 | Brand-aligned login | Match landing orange `#FF6E00`, rectangular controls; drop emoji mark |

---

## E3 — Project directory

| ID | Ticket | Acceptance |
|----|--------|------------|
| T3.1 | Migrations: `projects` | Table + RLS per DATA-MODEL |
| T3.2 | Directory list UI | Ribbon stages, search, sort, expenditure total |
| T3.3 | Add Project | Creates row with code + name + stage Planning |
| T3.4 | Seed Clearwater | Optional seed PRJ-2024-008 for demos |

---

## E4 — Project detail + Overview

| ID | Ticket | Acceptance |
|----|--------|------------|
| T4.1 | Project detail route | `/projects/:id` with tab chrome |
| T4.2 | Tabs | Overview, Key Personnel, Documents, BOQ, Scheduling (stubs OK) |
| T4.3 | Overview panel | Budget/expenditure, personnel count, progress % from project row |

---

## E5 — BOQ view-only

| ID | Ticket | Acceptance |
|----|--------|------------|
| T5.1 | Migrations: `boqs`, `boq_phases`, `boq_lines` | RLS; amounts consistent |
| T5.2 | BOQ panel UI | Phase sections + lines; **no edit controls** |
| T5.3 | Clearwater BOQ seed | Parts A/B/C matching mock |
| T5.4 | Phase Root sync helper | Function/service: ensure `schedule_nodes` phase_roots exist for each phase |

**Depends on:** OPEN-DECISIONS — BOQ ingestion path beyond seed.

---

## E6 — CPM Engine (pure)

| ID | Ticket | Acceptance |
|----|--------|------------|
| T6.1 | Module skeleton | `features/scheduling/engine`: `recalculate(input) → { nodes, criticalIds, error? }` |
| T6.2 | Topo + cycle detection | Kahn or DFS; Cycle Error payload with node ids |
| T6.3 | Project Calendar stepping | Working-day add/sub for forward/backward |
| T6.4 | Forward / backward + float | ES/EF/LS/LF, total float, free float; FS/SS/FF/SF + lag |
| T6.5 | Longest Path | Driving relationships; skip `is_loe` |
| T6.6 | Fixture tests | Clearwater numeric cases from research docs |

**No React. No Supabase imports inside `engine/`.**

---

## E7 — Scheduling UI

| ID | Ticket | Acceptance |
|----|--------|------------|
| T7.1 | Migrations: `schedule_nodes`, `dependencies`, `project_calendars` | Per DATA-MODEL |
| T7.2 | Load/save adapters | `data/schedule.js` |
| T7.3 | Activity tree | Locked Phase Roots; add summary/leaf; edit duration; predecessors |
| T7.4 | Wire CPM | Recalc on edit; empty / valid / cycle / recalculating states |
| T7.5 | Gantt | Phase colors; critical highlight; row sync |
| T7.6 | Persist after valid recalc | Save inputs (+ optional metric cache) |

---

## E8 — Documents

| ID | Ticket | Acceptance |
|----|--------|------------|
| T8.1 | Storage bucket + `documents` table | Done — private `project-documents`, ≤50 MB, soft-delete |
| T8.2 | Upload / list UI | Done — Documents tab uploads bytes + metadata |

---

## E9 — Later slices

| ID | Ticket | Notes |
|----|--------|-------|
| T9.1 | Key Personnel CRUD | Done — free-text `project_personnel` (no required `staff_id`) |
| T9.2 | Contractors registry | **OUT** of the working app |
| T9.3 | Reports inbox | **OUT** of the working app |
| T9.4 | Settings / Dark Mode | Done |
| T9.5 | LOE UI designation | Engine already skips flag |
| T9.6 | Baseline snapshots | Post-foundation |

---

## E10 — CI/CD (specified, not implemented)

Contract: [`CI-CD.md`](CI-CD.md). Do not add `.github/workflows/*` until these tickets are pulled.

| ID | Ticket | Acceptance |
|----|--------|------------|
| T10.1 | CI workflow | PR + default-branch: `npm ci`, lint, typecheck, build; Node pinned; lockfile cache |
| T10.2 | Required checks | Default branch protection requires the CI workflow after it has a green run |
| T10.3 | CD preview / production | Only after a host is chosen (D8). Deploy `dist/` artifact; secrets in GitHub Environments |
| T10.4 | Engine tests in CI | After T6.6; add the test job — do not invent a failing `npm test` before the script exists |

**Do not start T10.3** while hosting is local-only.

---

## Suggested first sprint (vertical)

1. T1.1–T1.2, T1.5  
2. T2.1–T2.2  
3. T3.1–T3.3  
4. T4.1–T4.2  
5. T5.1–T5.3 (seed)  
6. T6.1–T6.6 (can parallelize with UI)  
7. T7.*  

## Ticket hygiene

- One acceptance block per ticket; link PRD capability.  
- Prefer GitHub Issues with labels `epic:eN`, `area:cpm`, `area:auth`.  
- Do not start E7 UI without T6.1 interface frozen.  
- Do not mark Scheduling done without Cycle Error path (PRD success criterion).
