# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing: Vite + React 19 + Tailwind CSS v4 + Supabase. Scheduling mockups may ship as static HTML under `docs/mockups/` until the authenticated shell exists.

## Users

- **Project Planner / Scheduler** — authors the activity network under BOQ phases; needs live critical path and float.
- **Project Manager** — reviews critical path and phase impact; communicates delay risk.

Internal construction org staff (not public multi-tenant SaaS).

## Product Purpose

Sadiconstruction is an internal construction project-management platform: projects, budgets, contractors, documents, view-only BOQ, and scheduling. Success for this surface: planners evaluate time risk on the same WBS as the approved BOQ without leaving the product.

## Positioning

**BOQ = immutable WBS; Scheduling = network + first-party CPM engine** reverse-engineered from Project Libre’s evaluation process (algorithms/equations) and recreated on the web stack — not by importing or embedding Project Libre.

## Operating Context

Authenticated shell → Projects → project detail tabs (Overview, Key Personnel, Documents, BOQ view-only, Scheduling). Scheduling is a split view: hierarchical activity tree + phase-colored Gantt. One global project calendar; Retained Logic only; nested summaries allowed under BOQ phases.

## Capabilities and Constraints

**In:** BOQ→WBS sync (locked phase roots); nested summaries + leaves; FS/SS/FF/SF + lag; CPM (topo, ES/EF/LS/LF, float, Longest Path); critical highlight; empty / cycle / valid states.

**Out:** Editable BOQ from Scheduling; Project Libre / MSPDI import; multi-calendar; Progress Override toggle; resource leveling; cost-loaded CPM.

**Undecided:** Full ERD/schema (separate doc later).

## Brand Commitments

- Name: Sadiconstruction / SADICON MANAGEMENT
- Accent orange `#FF6E00`; dark CTA `#181C20`; text `#111111`
- Rectangular controls (`rounded-none`)
- Display: DM Serif Display for brand/project titles; Work Sans for UI
- Construction / directory aesthetic for authenticated surfaces (see product BOQ mock and landing)

## Evidence on Hand

- [`CONTEXT.md`](CONTEXT.md), [`IDEA.md`](IDEA.md), [`docs/PRD.md`](docs/PRD.md), [`docs/Siteflow.md`](docs/Siteflow.md), [`docs/Userflow.md`](docs/Userflow.md)
- Clearwater Medical Center mock BOQ (PRJ-2024-008)
- Research: `docs/research/2026-09-14-deep-research-cpm-scheduling.md`
- Incumbent UI: `src/LandingPage.jsx`, `docs/mockups/scheduling-clearwater.html`

## Product Principles

1. Cost WBS owns schedule phase roots — schedule never invents billable phases.
2. Criticality is computed in-app (Longest Path), not trusted from desktop exports.
3. Operate UI: density and scanability over decorative chrome.
4. Show state clearly (empty, cycle, recalculating, valid).
5. Synthetic demo data is labeled as such until real project data exists.

## Accessibility & Inclusion

Target WCAG 2.2 AA contrast for body and controls; keyboard-focusable tabs and primary actions. No product-specific AT requirement beyond that yet.

---

> Init note: structured interview tool unavailable this session. Facts above are taken from existing product docs and code; treat as confirmed unless contradicted.
