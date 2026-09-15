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

**Schema:** [`docs/ERD.md`](docs/ERD.md) · [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md). Closed choices: [`docs/OPEN-DECISIONS.md`](docs/OPEN-DECISIONS.md).

## Brand Commitments

- Name: Sadiconstruction / SADICON MANAGEMENT
- Visual identity is **not** locked to the first mockup (orange `#FF6E00`, charcoal, sharp rectangles, DM Serif / Work Sans, construction-directory chrome). Those are incumbent evidence and anti-reference for a replacement world.
- First surface for the new world: **landing** (access / brand). Authenticated Operate screens inherit that world; they do not keep a second identity.
- The Diazo Hang / hanging-print experiment is discarded: paper clips, kraft bands, grain, issue-stamps, collage, and scrapbook materials are anti-reference. The product must read as CPM software a PM would put on a meeting screen.
- Motion and interaction may be playful (orchestrated UI, calculated path, state choreography). Visual identity may not: no toy chrome, dark-neon, high-school collage, or physical-artefact cosplay.
- A finished redesign fails if: it could be any SaaS PM tool; it is still the old charcoal-orange mockup in new clothes; it reads as a craft project; a Project Manager would not trust it in front of stakeholders.

## Evidence on Hand

- [`CONTEXT.md`](CONTEXT.md), [`IDEA.md`](IDEA.md), [`docs/PRD.md`](docs/PRD.md), [`docs/Siteflow.md`](docs/Siteflow.md), [`docs/Userflow.md`](docs/Userflow.md)
- [`docs/ERD.md`](docs/ERD.md), [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md), [`docs/TICKETS.md`](docs/TICKETS.md), [`docs/FILE-STRUCTURE.md`](docs/FILE-STRUCTURE.md)
- [`docs/OPEN-DECISIONS.md`](docs/OPEN-DECISIONS.md) — human blockers only
- Clearwater Medical Center mock BOQ (PRJ-2024-008)
- Research: `docs/research/2026-09-14-deep-research-cpm-scheduling.md`, `docs/research/2026-09-15-free-tier-supabase-architecture.md`
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
