# Siteflow — Sadiconstruction product placement

> Solidified 2026-09-15. Complements [`PRD.md`](PRD.md) and [`Userflow.md`](Userflow.md). Glossary: [`CONTEXT.md`](../CONTEXT.md). No column-level schema (see [`ERD.md`](ERD.md)).

## Global IA

```
Public
  ├── Landing
  ├── Login (Staff Member)
  └── Request Access (Access Request)

Authenticated shell (left nav)
  ├── Projects          ← project directory
  ├── Reports           ← inbox (later slice)
  ├── Contractors       ← registry (later slice)
  └── Settings          ← includes Dark Mode

Project detail (e.g. Clearwater / PRJ-2024-008)
  └── Tabs
        ├── Overview
        ├── Key Personnel
        ├── Documents
        ├── Bill of Quantities   ← view-only; source of Phase Roots
        └── Scheduling           ← network + CPM + Gantt
```

BOQ and Scheduling are **sibling tabs** on the same Project. Phase Roots on Scheduling are driven by BOQ Phases; the planner does not create new billable phases from Scheduling.

## Project directory surface

| Region | Role |
|--------|------|
| Monitoring ribbon | Filter by Project Stage: Planning, Active, On Hold, Delayed, Completed |
| Tools | Search, sort (priority / completion / progress), Add Project, total expenditure signal |
| List | Directory aesthetic; open → Project detail (last tab or Overview) |

## Scheduling surface

One composition: **split view**.

| Region | Role |
|--------|------|
| **Left — activity tree** | Hierarchical grid: Phase Roots (locked) → Nested Summaries → Leaf Activities |
| **Right — Gantt** | Time-scaled bars aligned to the same rows; phase color; critical highlight; dependency arrows |

### Left panel columns (conceptual)

WBS / name · Duration · Predecessors · ES · EF · LS · LF · Total float · Critical indicator

Phase Root rows: visually locked (no delete / reparent off BOQ; no inventing sibling phases).  
Under a phase: planner may add Nested Summaries and Leaf Activities.

### Right panel behavior

- Bar color inherits **BOQ Phase**
- Longest Path activities use a distinct **critical** treatment
- Gantt stays in sync with left-row selection / expand-collapse
- Critical paint suppressed while Cycle Error is active

## Navigation relationships

| From | To | Purpose |
|------|----|---------|
| Landing | Login / Request Access | Enter or apply |
| Login success | Projects (directory) | Default post-auth landing |
| BOQ tab | Scheduling tab | Same Project; cost WBS → time network |
| Scheduling | BOQ | Read-only check of phase/line scope |
| Project list | Project → Scheduling | Deep link / tab restore when routing exists |

## System states (Scheduling)

| State | What the user sees |
|-------|--------------------|
| **Empty** | Phase Roots only; prompt to add Nested Summaries / Leaf Activities |
| **Valid** | Tree + Gantt; metrics filled; Longest Path highlighted |
| **Recalculating** | Brief busy affordance after an edit; then refresh metrics/Gantt |
| **Cycle / invalid** | CPM halted; banner lists involved Schedule Nodes; critical paint off |
| **No BOQ phases** | Cannot seed WBS; message to ensure approved BOQ exists |
| **Access denied** | Staff Member lacks Role for edit; view remains if the matrix allows it (ADR 0005) |

## What is not on these surfaces

- BOQ amount editing  
- Project Libre / file import controls  
- Calendar picker per Leaf Activity  
- Progress Override mode switch  
- Portfolio / multi-project Gantt  

## File / module placement (product → code)

| Surface | Intended module seam |
|---------|----------------------|
| Auth + Access Request | `src/features/auth` |
| Shell / nav | `src/features/shell` |
| Project directory + detail chrome | `src/features/projects` |
| BOQ view | `src/features/boq` |
| Scheduling UI | `src/features/scheduling` |
| CPM Engine | `src/features/scheduling/engine` (pure; no React) |
| Supabase adapters | `src/data/*` |

Full tree: [`FILE-STRUCTURE.md`](FILE-STRUCTURE.md).

## Related docs

[`IDEA.md`](../IDEA.md) · [`PRD.md`](PRD.md) · [`Userflow.md`](Userflow.md) · [`CONTEXT.md`](../CONTEXT.md) · [`DESIGN.md`](../DESIGN.md)

## Mockups

- Interactive SPA (static data): [`mockups/scheduling-clearwater.html`](mockups/scheduling-clearwater.html)
- Static PNG: [`mockups/scheduling-hf-impeccable.png`](mockups/scheduling-hf-impeccable.png)
