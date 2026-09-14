# Siteflow — Critical-path Scheduling from BOQ

> Where things live in the product. Complements [`PRD.md`](PRD.md) and [`Userflow.md`](Userflow.md). No data model.

## Product placement

```
Authenticated shell
  └── Projects → Project detail (e.g. Clearwater / PRJ-2024-008)
        └── Tabs
              ├── Overview
              ├── Key Personnel
              ├── Documents
              ├── Bill of Quantities   ← view-only; source of phase WBS
              └── Scheduling           ← this feature
```

BOQ and Scheduling are sibling tabs on the same project. WBS roots on Scheduling are driven by BOQ phases; the user does not create new billable phases from Scheduling.

## Scheduling surface

One composition: **split view**.

| Region | Role |
|--------|------|
| **Left — activity tree** | Hierarchical grid: BOQ phase roots (locked) → nested summaries → leaves |
| **Right — Gantt** | Time-scaled bars aligned to the same rows; phase color; critical highlight; dependency arrows |

### Left panel columns (conceptual)

WBS / name · Duration · Predecessors · ES · EF · LS · LF · Total float · Critical indicator

Phase-root rows: visually locked (no delete/reparent off BOQ; no inventing sibling phases).  
Under a phase: user may add nested summaries and leaves.

### Right panel behavior

- Bar color inherits **BOQ phase**  
- Longest Path activities use a distinct **critical** treatment (border/fill — exact visual in design later)  
- Gantt stays in sync with left-row selection / expand-collapse  

## Navigation relationships

| From | To | Purpose |
|------|----|---------|
| BOQ tab | Scheduling tab | Same project; planner moves from cost WBS to time network |
| Scheduling | BOQ | Read-only check of phase/line scope (no edit) |
| Project list | Project → Scheduling | Deep link / tab restore when routing exists |

## System states

| State | What the user sees |
|-------|--------------------|
| **Empty** | Phase roots only; prompt to add activities / nested summaries under a phase |
| **Valid** | Tree + Gantt; metrics filled; critical path highlighted |
| **Recalculating** | Brief busy affordance after an edit; then refresh metrics/Gantt |
| **Cycle / invalid** | CPM halted; banner lists involved nodes; Gantt critical paint suppressed until fixed |
| **No BOQ phases** | Scheduling cannot seed WBS; message to ensure approved BOQ exists (product-level gate) |

## What is not on this surface

- BOQ amount editing  
- Project Libre / file import controls  
- Calendar picker per task (one global project calendar — settings elsewhere if needed)  
- Progress Override mode switch  
- Reports / contractors / portfolio ribbon (other shell areas)

## Related docs

[`IDEA.md`](../IDEA.md) · [`PRD.md`](PRD.md) · [`Userflow.md`](Userflow.md) · [`CONTEXT.md`](../CONTEXT.md)

## Mockups

- High-fidelity interactive SPA (static data): [`mockups/scheduling-clearwater.html`](mockups/scheduling-clearwater.html)
  - Shell: Projects / Reports / Contractors / Settings
  - Project tabs: Overview, Personnel, Documents, BOQ (view-only), Scheduling
  - Scheduling: expand/collapse, edit duration, predecessors, add activity/summary, critical filter, cycle demo, in-browser CPM
- High-fidelity static PNG: [`mockups/scheduling-hf-impeccable.png`](mockups/scheduling-hf-impeccable.png)
