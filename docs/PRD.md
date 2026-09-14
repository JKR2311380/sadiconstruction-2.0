# PRD — Critical-path Scheduling from BOQ

> Lean product requirements. Schema lives in a separate ERD later.  
> Source of truth for intent: [`IDEA.md`](../IDEA.md) · Research: [`docs/research/2026-09-14-deep-research-cpm-scheduling.md`](research/2026-09-14-deep-research-cpm-scheduling.md)

## Problem

BOQ (money / scope by phase) and schedule (time / logic) are disconnected. Planners need Project Libre–class critical-path evaluation **inside** Sadiconstruction: same WBS as the BOQ, live recomputation, list + Gantt — without shipping or importing Project Libre.

## Goals

1. Tie Scheduling WBS to the approved BOQ (phase roots locked; one-way BOQ → schedule).
2. Own a first-party CPM engine (topo sort, forward/backward pass, float, Longest Path) reverse-engineered from Project Libre’s evaluation process and recreated on Vite / React / Supabase.
3. Show critical path and float in a split list + Gantt view, colored by BOQ phase.

## Non-goals

- Editing BOQ from Scheduling  
- Importing / embedding Project Libre or MSPDI / `.pod`  
- Probabilistic PERT / Monte Carlo as the engine  
- Resource leveling or cost-loaded CPM  
- Multiple calendars or a Progress Override toggle  

## Locked decisions

| Topic | Decision |
|-------|----------|
| Calendar | One global project calendar |
| Out-of-sequence | Retained Logic only |
| WBS under a phase | Nested summary tasks allowed |
| Project Libre | Reference for algorithms/equations — recreate in our stack |

## Capabilities

**In**

- BOQ → WBS sync (read-only phase roots)  
- Nested summaries + leaf activities under a phase  
- Durations (working days on the global calendar)  
- Predecessors: FS, SS, FF, SF + lag/lead  
- CPM: cycle detection, ES/EF/LS/LF, total float, free float  
- Criticality: Longest Path; LOE/hammocks excluded from driving path (LOE marking can land post-foundation)  
- Split-view Gantt: phase color + critical highlight  
- Recalculate on every network edit  

**Later (supporting)**

- Explicit LOE / hammock designation  
- Baseline vs update / delay snapshots  

## Actors

| Actor | Job |
|-------|-----|
| Planner / Scheduler | Build and maintain the network; keep critical path valid |
| Project Manager | Review critical path and phase impact; communicate risk |

## Success criteria

- Clearwater-like BOQ (Parts A/B/C) seeds Scheduling phase roots; planner can nest summaries and leaves without inventing new billable phases.  
- Changing a duration or predecessor recalculates dates, float, and Longest Path without desktop tools.  
- Cycles halt CPM and surface a clear error until fixed.  
- Critical bars/rows are visually distinct from non-critical work on the Gantt.

## Conceptual objects (not schema)

Project · BOQ phase / line · Schedule node (phase root | nested summary | leaf) · Dependency · Global calendar · Computed schedule metrics (ES/EF/LS/LF, float, critical)

## Reference mock

Clearwater Medical Center · PRJ-2024-008 — BOQ Parts A (General Requirements), B (Site Works), C (Concrete Works).

## Out of this doc

Data model / ERD · API contracts · ticket breakdown · implementation plan
