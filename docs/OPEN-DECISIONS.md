# Open decisions

> Solidified 2026-09-15. Resolved 2026-09-15 in the prototype bootstrap pass.  
> Outcomes that are hard to reverse live in [`adr/`](adr/). Easy-to-reverse ones stay here as the record.  
> Reopen only with a superseding ADR — do not silently invent a second answer.

## How to use

Checkboxes are closed. If product reality changes, write a new ADR and update the row here to `SUPERSEDED`.

---

## D1 — Role permission matrix — RESOLVED

Roles: `admin`, `planner`.

| Capability | admin | planner |
|------------|:-----:|:-------:|
| Change Staff Member Role | ✓ | |
| Create / archive Projects | ✓ | ✓ |
| Seed / replace BOQ | ✓ | ✓ |
| Edit Scheduling network | ✓ | ✓ |
| View Scheduling / BOQ | ✓ | ✓ |
| Upload Documents | ✓ | ✓ |
| Edit Personnel roster | ✓ | ✓ |

SUPERSEDED four-role matrix — ADR [`0012-open-signup-two-roles.md`](adr/0012-open-signup-two-roles.md).

- [x] Decided: four roles, matrix above

---

## D2 — Bootstrap Admin — RESOLVED

**One-time seed script** (known email) is the production path. Dashboard SQL remains a documented fallback. “First user is admin” is rejected: Access Request screening exists specifically to prevent self-promotion.

Prototype: demo staff are seeded in the mock workspace (`admin@sadicon.local`). When Supabase lands, `supabase/seed/` creates the first Admin profile.

ADR: [`adr/0006-bootstrap-admin-seed.md`](adr/0006-bootstrap-admin-seed.md)

- [x] Decided: option 2 (seed script) + dashboard fallback

---

## D3 — Access Request notifications — RESOLVED

**In-app queue only for v1.** Admin learns by opening Settings → Access Requests. Email is additive later (SMTP / Free email limits are a real cost). The queue is required even if email exists, so ship the queue first.

- [x] Decided: option 1 (in-app queue); email deferred

---

## D4 — BOQ ingestion path — RESOLVED

**CSV upload (admin)** is the product path for real BOQ. SQL / mock seed remains for Clearwater demo. Manual line-by-line forms do not scale; integrations wait for a named source.

CSV is the common BOQ interchange from QS spreadsheets. Replace is admin-only (D1). Phase Root sync still runs after a successful load.

ADR: [`adr/0007-boq-csv-ingestion.md`](adr/0007-boq-csv-ingestion.md)

- [x] Decided: option 2 (CSV admin) + demo seed

---

## D5 — Metric cache columns — RESOLVED

**No cache for v1.** Always recompute in the browser after fetch/edit (ADR 0004). Optional `es/ef/...` columns stay in DATA-MODEL as a later door if first-paint on large networks hurts. Never treat stored `is_critical` as truth.

- [x] Decided: option 1 (no cache); option 3 remains the reopen trigger

---

## D6 — Working calendar defaults (PH context) — RESOLVED

Default Project Calendar: **Mon–Sat work / Sunday off**, 8 hours/day. Seed **Philippine regular + special non-working holidays** for the project year as editable exceptions. Construction practice is a six-day week with Sunday rest ([Respicio on construction hours](https://www.lawyer-philippines.com/articles/construction-industry-work-hour-standards)); office Mon–Fri calendars under-count site duration.

One calendar per project (already locked). Planners may edit exceptions; they do not get a second calendar.

ADR: [`adr/0008-ph-working-calendar.md`](adr/0008-ph-working-calendar.md)

- [x] Decided: option 1 + starter PH holidays = Yes

---

## D7 — Concurrent schedule edits — RESOLVED

**Last write wins for v1.** Internal single-org, small planner set. Persist `updated_at` on nodes/deps so a future optimistic-lock (`If-Match` / 409) can land without a schema reboot. Soft checkout is deferred until two planners actually collide.

ADR: [`adr/0009-last-write-wins.md`](adr/0009-last-write-wins.md)

- [x] Decided: option 1 (last write wins)

---

## D8 — Hosting & Free pause — RESOLVED

**Vite local / `vite preview` for this prototype.** Vercel/Netlify when a live demo URL is needed. **Accept Free-tier pause cold-start** for demos; move the Supabase project to Pro when the org is in daily use.

- [x] Decided: option 1 now; cold-start = Yes; Pro when live

---

## D9 — TypeScript now or later? — RESOLVED

**TypeScript only for `features/scheduling/engine`.** Vite already coexists JS/TS (`allowJs`). The CPM Engine is the module whose bugs are expensive and whose interface should stay small. App UI stays JSX until a later migrate-on-touch epic — not a prerequisite.

ADR: [`adr/0010-typescript-cpm-engine.md`](adr/0010-typescript-cpm-engine.md)

- [x] Decided: option 2 (TS for CPM engine)

---

## D10 — Reports & Contractors priority — RESOLVED

After Scheduling foundation: **Documents + Personnel** (they complete project-detail tabs). Reports and Contractors stay navigable stubs until a later epic. Do not freeze the whole app — stubs keep IA honest.

- [x] Decided: option 1 (Documents + Personnel next); stubs for E9

---

## D11 — Project Code format — RESOLVED

**Enforced `PRJ-YYYY-NNN` auto-number**, unique. Human-facing, sortable, matches Clearwater `PRJ-2024-008`. Free text collides and breaks directory scan.

- [x] Decided: option 2

---

## D12 — Currency & expenditure source — RESOLVED

Currency default **PHP (₱)**. Directory expenditure = **sum of BOQ line amounts when an approved BOQ exists**, with a **manual override** on Project for pre-BOQ / adjustments. Override null means “use derived.”

- [x] Decided: option 3 (both)

---

## D13 — Soft delete vs hard delete — RESOLVED

**Soft-delete Projects and Documents** (`deleted_at`) for undo. **Hard-delete Schedule Nodes and their Dependencies** so the CPM graph never walks tombstones (a known source of cycle/FK bugs in schedule products). Periodic purge of soft-deleted projects/docs is a script, not a product job, because Free DB still counts those rows.

ADR: [`adr/0011-deletion-strategy.md`](adr/0011-deletion-strategy.md)

- [x] Decided: option 3

---

## Resolved outside this file (do not reopen without ADR)

- BOQ view-only in UI  
- One Project Calendar; Retained Logic only  
- Nested Summaries under phases  
- Client-side CPM; Longest Path; no Project Libre import as product path  
- Single-org internal (not multi-tenant SaaS)  
- Free-tier Supabase constraints respected  
