# PERT-CPM + Project Libre reverse-engineering (spike)

> Clearwater Medical Center · PRJ-2024-008 · BOQ WBS from product mock (Sep 2026)

## Verdict

**Do not reverse-engineer Project Libre’s `.pod` binary as the product path.** Treat Project Libre as an *authoring/validation* tool: export **MSPDI XML**, ingest **tasks + durations + predecessor links**, and **recompute CPM in-app** (forward/backward pass → total float → critical where float = 0).

**Do not trust stored CPM fields as authoritative.** Primary-source review ([`docs/projectlibre-cpm-research.md`](../projectlibre-cpm-research.md)) shows ProjectLibre computes ES/EF/LS/LF, slack, and critical **at runtime**; its MSPDI exports often include `Critical` + `Start`/`Finish` but **omit** `EarlyStart` / `LateStart` / `TotalSlack` / `FreeSlack`.

BOQ line items are **cost/qty**, not a schedule. They supply the **WBS**; Scheduling still needs **duration + dependency** fields.

**Canonical deep dive:** [`docs/projectlibre-cpm-research.md`](../projectlibre-cpm-research.md) (formats, engine sources, MSPDI map, JS libraries). This file keeps the Clearwater BOQ extract + mock CPM run.

---

## BOQ → WBS extracted from mock

| Item | Description | Unit | Qty | Amount (₱) |
|------|-------------|------|-----|------------|
| **A** | General Requirements & Preliminaries | — | — | 13,843,422 |
| A.1 | Mobilization & Demobilization | lot | 1 | 1,835,414 |
| A.2 | Temporary Facilities & Site Office | lot | 1 | 834,391 |
| A.3 | Project Signage & Safety Barricades | lot | 1 | 345,159 |
| A.4 | Project Management & Supervision | mo | 18 | 10,828,458 |
| **B** | Site Works & Earthworks | — | — | 9,619,035 |
| B.1 | Site Clearing & Grubbing | m² | 9,027 | 767,295 |
| B.2 | Excavation Works (Bulk) | m³ | 15,176 | 4,856,320 |
| B.3 | Backfilling & Compaction | m³ | 4,298 | 1,283,440 |
| B.4 | Gravel Fill Bedding (100mm thk.) | m³ | 1,689 | 2,449,050 |
| B.5 | Dewatering Works | lot | 1 | 262,930 |
| **C** | Concrete Works (line items not visible in mock) | — | — | 135,527,300 |
| | **Grand total (project)** | | | **395,105,259** |

**Scheduling notes from BOQ alone**

- A.4’s `18 mo` is a **level-of-effort / hammock** span, not a CPM-driving activity.
- Parts A→B→C order implies a **construction sequence**, but predecessors are *assumed* for the spike until a real Project Libre plan or Scheduling mock exists.
- Part C must be expanded before concrete-phase critical path is trustworthy.

---

## How Project Libre stores critical-path data

### File formats

| Format | Role | Parse without desktop app? |
|--------|------|----------------------------|
| `.pod` | Native Project Libre | Partially: for v1.5.5+, POD embeds MSPDI after `@@@@@@@@@@ProjectLibreSeparator_MSXML@@@@@@@@@@` ([MPXJ `ProjectLibreReader`](https://www.mpxj.org/apidocs/org/mpxj/projectlibre/ProjectLibreReader.html)). Pre-1.5.5 may have no XML. |
| `.xml` (MSPDI) | Import/export interchange | Yes — preferred interchange format. |

### Engine vs file

Project Libre’s scheduling algorithm is `com.projity.pm.criticalpath.CriticalPath`. After `project.recalculate()`, tasks expose early/late dates, slack, and `isCritical()`. Export via `MSPDISerializer` writes the **network + scheduled dates**; full Early*/Late*/slack elements are **optional** and frequently absent in real ProjectLibre XML.

### MSPDI fields that matter ([Microsoft Learn — Task elements](https://learn.microsoft.com/en-us/office-project/xml-data-interchange/task-elements-and-xml-structure?view=project-client-2016))

| Element | Meaning |
|---------|---------|
| `Duration` | Task length |
| `PredecessorLink` / `PredecessorUID` / `Type` / `LinkLag` | Dependencies (FS/SS/FF/SF + lag) |
| `EarlyStart`, `EarlyFinish`, `LateStart`, `LateFinish` | CPM dates |
| `TotalSlack`, `FreeSlack` | Float (often in tenths of minutes in MSPDI) |
| `Critical` | Boolean flag |
| `WBS`, `OutlineNumber` | Hierarchy (maps cleanly to BOQ A.1, B.2, …) |
| `Summary` | Parent rollup (Parts A/B/C) — exclude from network leaves |

---

## Reverse-engineering options

### A — Trust exported CPM fields

Parse `Critical`, `TotalSlack`, ES/EF/LS/LF from MSPDI when present.

- **Pros:** Fast if the file came from MS Project with a full CPM field suite.
- **Cons:** ProjectLibre XML often lacks Early*/Late*/slack; `Critical` alone gives no float for near-critical UI; calendars/constraints/actuals can diverge across engines.

### B — Recompute CPM from the network (recommended)

Ingest only: task id, duration, calendar (optional), predecessor links. Run forward + backward pass in Sadiconstruction.

- **Pros:** Deterministic, testable, works if planners build the network in-app or import a half-baked XML.
- **Cons:** Must implement (or reuse) calendars, lag, and non-FS link types if you support them.

### Practical pipeline for this product

```
BOQ (view-only WBS + cost)
    → Scheduling activities (1:1 or N:1 with BOQ lines)
        → duration + predecessors (authored in UI or imported)
            → CPM engine
                → critical flag + total float
                    → Gantt highlight + “critical tasks” list
```

Optional: **File → Save As XML** from Project Libre → upload → same engine. Prefer [MPXJ](https://www.mpxj.org/) (JVM) or a thin XML parse in Node if staying JS-only; `projectlibre-mcp` shows the same idea (`critical_path` tool reads calendarized slack from real files).

---

## Minimal CPM (Finish-to-Start, zero lag)

1. Build DAG from predecessors; reject cycles.
2. **Forward:** `ES = max(EF of preds)` (0 if none); `EF = ES + duration`.
3. Project duration = `max(EF)`.
4. **Backward:** `LF = min(LS of succs)` (project duration if none); `LS = LF − duration`.
5. **Total float** `TF = LS − ES` (≡ `LF − EF`).
6. **Critical** iff `TF === 0` (within calendar/tolerance).

PERT (optimistic/most-likely/pessimistic) is optional later: use expected duration `t_e = (a + 4m + b) / 6` as CPM input; critical path math stays CPM.

---

## Mock CPM on Clearwater BOQ (spike assumptions)

**Durations are working-day estimates for exploration only** (not derived from qty rates). Assumed FS network:

```
A.1 → A.2 → B.1 → B.2 → B.3 → B.4 → C
A.1 → A.3 ↗
B.1 → B.5 ──────────────↗
```

A.4 (18 mo supervision) excluded as hammock/LOE. Part C collapsed to one 120-day node until line items exist.

| ID | Duration (d) | ES | EF | LS | LF | TF | Critical? |
|----|-------------:|---:|---:|---:|---:|---:|-----------|
| A.1 | 10 | 0 | 10 | 0 | 10 | 0 | **Yes** |
| A.2 | 15 | 10 | 25 | 10 | 25 | 0 | **Yes** |
| A.3 | 5 | 10 | 15 | 20 | 25 | 10 | No |
| B.1 | 12 | 25 | 37 | 25 | 37 | 0 | **Yes** |
| B.2 | 45 | 37 | 82 | 37 | 82 | 0 | **Yes** |
| B.5 | 20 | 37 | 57 | 92 | 112 | 55 | No |
| B.3 | 20 | 82 | 102 | 82 | 102 | 0 | **Yes** |
| B.4 | 10 | 102 | 112 | 102 | 112 | 0 | **Yes** |
| C | 120 | 112 | 232 | 112 | 232 | 0 | **Yes** |

**Project duration (mock):** 232 working days  
**Critical path:** `A.1 → A.2 → B.1 → B.2 → B.3 → B.4 → C`  
**Float examples:** A.3 has 10d; B.5 (dewatering) has 55d under these assumptions — excavation drives the site phase, not dewatering.

---

## Fit to Sadiconstruction Scheduling tab

Per product docs: activity list (left) + Gantt (right), color by **BOQ phase**.

Recommended domain fields on an activity:

- `boqItemId` / WBS (`A.1`, `B.2`, …)
- `durationDays` (or PERT triple later)
- `predecessors[]` `{ id, type: 'FS'|'SS'|'FF'|'SF', lagDays }`
- computed: `es`, `ef`, `ls`, `lf`, `totalFloat`, `isCritical`

Gantt: paint `isCritical` distinctly; list view can sort/filter critical tasks for delay risk (ties to portfolio “Delayed” ribbon later).

---

## Sources

- [MSPDI Task elements (Microsoft Learn)](https://learn.microsoft.com/en-us/office-project/xml-data-interchange/task-elements-and-xml-structure?view=project-client-2016)
- [MPXJ ProjectLibreReader](https://www.mpxj.org/apidocs/org/mpxj/projectlibre/ProjectLibreReader.html) — POD = serialized Java + embedded MSPDI
- [MPXJ MSPDI howto](https://www.mpxj.org/howto-write-mspdi/)
- [Project Libre CriticalPath / MSPDISerializer API notes](https://context7.com/erdincay/projectlibre/llms.txt)
- [projectlibre-mcp](https://github.com/Osyanne/projectlibre-mcp) — practical POD/XML read + `critical_path` tooling
- Mock BOQ UI: Clearwater Medical Center, PRJ-2024-008 (product screenshot)

---

## Open questions (for next step)

1. Confirm **durations** (production rates vs planner-entered days).
2. Expand **Part C** concrete line items for a real critical path through structure.
3. Decide whether Scheduling **imports Project Libre XML** or is **authored only in-app** with optional export.
