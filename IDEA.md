# IDEA — Critical-path Scheduling from BOQ

> Status: foundation solidified 2026-09-15 · Clearwater Medical Center (PRJ-2024-008)  
> Foundation: [`docs/PRD.md`](docs/PRD.md) · [`docs/Siteflow.md`](docs/Siteflow.md) · [`docs/Userflow.md`](docs/Userflow.md)  
> Schema / build: [`docs/ERD.md`](docs/ERD.md) · [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) · [`docs/TICKETS.md`](docs/TICKETS.md) · [`docs/FILE-STRUCTURE.md`](docs/FILE-STRUCTURE.md)  
> Closed choices: [`docs/OPEN-DECISIONS.md`](docs/OPEN-DECISIONS.md)  
> Related: [`CONTEXT.md`](CONTEXT.md) · [`docs/research/2026-09-14-deep-research-cpm-scheduling.md`](docs/research/2026-09-14-deep-research-cpm-scheduling.md) · [`docs/projectlibre-cpm-research.md`](docs/projectlibre-cpm-research.md)

## One-liner

Turn the view-only **Bill of Quantities** into a **Scheduling** network with an in-app CPM engine — reverse-engineered from how Project Libre evaluates plans (algorithms, equations, runtime recalculation) and **recreated** on Sadiconstruction’s modern stack (Vite / React / Supabase), not by importing or embedding Project Libre.

## Problem

Financial execution (BOQ) and time execution (schedule) live in silos. Planners need the same kind of critical-path evaluation Project Libre provides, but inside the product: BOQ-linked WBS, list + Gantt, and live recomputation when the network changes. Shipping Project Libre (or trusting its file exports) is the wrong model for a web platform.

## Insight

**BOQ = immutable WBS. Scheduling = network + our own CPM engine.**

Project Libre is a **reference implementation** to study, not a dependency:

1. Map BOQ phases/lines to schedule WBS (summary nodes locked from BOQ; nested summaries allowed under a phase).
2. Author activities, durations, one global calendar, dependencies in-app.
3. Validate DAG (topological sort / cycle detection), then run forward + backward pass — same family of math Project Libre’s `CriticalPath` engine uses at runtime.
4. Identify criticality with **Longest Path** (AACE 49R-06), not naïve “TF ≤ 0” alone — exclude LOE/hammocks from the driving path.
5. **Reverse-engineer → recreate:** take Project Libre’s process (topo sort, calendar-aware ES/EF/LS/LF, slack, criticality) and implement equivalent algorithms/equations in our stack. Do **not** import `.pod`/MSPDI as the product path; do **not** embed the desktop app.

PERT three-point math may help derive a single duration; the engine itself stays deterministic CPM.

## Stack stance

| Layer | Approach |
|-------|----------|
| Reference | Project Libre / OpenProj CPM behavior + MSPDI field semantics (for understanding only) |
| Engine | First-party JS/TS CPM in the Vite/React app (or shared module) — formulas we own |
| Persistence | Supabase Free — see [`docs/ERD.md`](docs/ERD.md) / [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) |
| UI | Scheduling tab: activity tree + Gantt, phase-colored, critical highlight |

## Functions & features

### Core (foundational)

| Capability | What it does |
|------------|----------------|
| **BOQ→WBS sync** | Read-only phase roots from BOQ; schedule cannot invent billable phases |
| **Network authoring** | Nested summaries + leaf activities; FS/SS/FF/SF + lag/lead |
| **In-app CPM engine** | Topological sort, single global calendar, ES/EF/LS/LF, total & free float — recreated from researched Project Libre / CPM process |
| **Longest Path criticality** | Trace driving relationships; exclude LOE from false-critical paths |
| **Split-view Gantt** | List left + Gantt right; color by BOQ phase; highlight critical bars |
| **Retained Logic** | Out-of-sequence actuals follow Retained Logic only (no Progress Override toggle) |

### Supporting (post-foundation)

| Capability | What it does |
|------------|----------------|
| **LOE / hammock** | Span dates (e.g. A.4 Supervision) without driving Longest Path |
| **Delay snapshots** | Baseline vs update; float consumption (SCL-oriented) |

### Out of scope

- Importing or embedding Project Libre / parsing `.pod` or MSPDI as a product feature  
- Probabilistic PERT / Monte Carlo as the primary engine  
- Resource leveling  
- Cost-loaded CPM  
- Authoring BOQ from the schedule  
- Multiple calendars; Progress Override UI  

## Siteflow sketch

```
Project (e.g. Clearwater)
  → Tabs: Overview | Key Personnel | Documents | BOQ (view-only) | Scheduling
       → Scheduling: BOQ phase roots + nested summaries/leaves (left) + Gantt (right)
       → States: empty (headers only) | cycle error (halt CPM) | recalculating
```

## Userflow sketch

1. **Planner — create & evaluate:** open Scheduling → WBS from BOQ → add nested summaries/activities/durations/links → topo sort → forward/backward → Longest Path → Gantt highlights.  
2. **PM — review:** read critical path and phase-colored impact (authoring secondary).

## Locked product decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Calendars | **One global project calendar** |
| 2 | Out-of-sequence progress | **Retained Logic only** — no Progress Override toggle |
| 3 | WBS under a BOQ phase | **Nested summary tasks allowed** under a phase |
| 4 | Project Libre relationship | **Reverse-engineer algorithms/equations → recreate in our stack** — not file import, not embedding the program |

## Success looks like

On Clearwater-like BOQ (Parts A/B/C), Scheduling shows the same WBS (with nested structure under phases), a phase-colored Gantt, and a Longest Path critical sequence that updates whenever durations or links change — powered by a first-party CPM engine whose behavior is informed by how Project Libre evaluates networks, implemented for Vite / React / Supabase.

## Research corpus

| Doc | Role |
|-----|------|
| [`docs/research/2026-09-14-deep-research-cpm-scheduling.md`](docs/research/2026-09-14-deep-research-cpm-scheduling.md) | Deep research (algorithms, Project Libre internals as reference, feature inventory) |
| [`docs/projectlibre-cpm-research.md`](docs/projectlibre-cpm-research.md) | Project Libre / MSPDI primary-source notes (reference for recreation) |
| [`docs/research/2026-09-14-pert-cpm-projectlibre.md`](docs/research/2026-09-14-pert-cpm-projectlibre.md) | Clearwater mock CPM numeric pass |
