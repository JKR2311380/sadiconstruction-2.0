# Data Model — Sadiconstruction (v1)

> Physical/logical table guidance for Supabase Postgres. Diagram: [`ERD.md`](ERD.md). Glossary: [`CONTEXT.md`](../CONTEXT.md).  
> Free-tier: keep rows lean; files in Storage; CPM client-side.

## Persist vs compute

| Concept | Persist? | Notes |
|---------|----------|-------|
| Project, stages, codes | Yes | Source of directory |
| BOQ Phase / Line | Yes | BOQ is system of record for cost WBS |
| Schedule Node structure | Yes | name, kind, parent, duration, sort, LOE flag |
| Dependency | Yes | type + lag |
| Project Calendar | Yes | working week + exception dates |
| ES/EF/LS/LF, floats, critical | **Compute** (optional cache) | Authoritative path is CPM Engine after load; cache only for faster first paint / offline-ish UX |
| Gantt pixels / zoom | No | Client UI state |
| Document bytes | Storage bucket | DB holds path + metadata only |

**Rule:** Never treat cached `is_critical` as truth across edits without a recalc stamp.

## Tables

### `profiles` (Staff Member)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | = `auth.users.id` |
| `email` | text unique | |
| `full_name` | text | |
| `role` | text | `admin` \| `planner` (default `planner` on Sign-up) |
| `is_active` | boolean | default true |
| `created_at` / `updated_at` | timestamptz | |

### `access_requests`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `email` | text | |
| `full_name` | text | |
| `company_note` | text null | optional message |
| `status` | text | `pending` \| `approved` \| `rejected` |
| `reviewed_by` | uuid null FK → profiles | |
| `reviewed_at` | timestamptz null | |
| `created_at` | timestamptz | |

Public insert for create; select/update restricted to admin.

### `projects`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `code` | text unique | `PRJ-YYYY-NNN` auto-number |
| `name` | text | |
| `stage` | text | `planning` \| `active` \| `on_hold` \| `delayed` \| `completed` |
| `priority` | smallint null | sort key |
| `progress_pct` | numeric(5,2) | 0–100; may be manual until schedule drives it |
| `expenditure` | numeric(14,2) null | **manual override**; null ⇒ sum BOQ line amounts |
| `currency` | text | default `PHP` |
| `start_date` | date null | |
| `target_end_date` | date null | |
| `created_by` | uuid FK → profiles | |
| `created_at` / `updated_at` | timestamptz | |

### `project_calendars`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `project_id` | uuid unique FK | one calendar per project |
| `name` | text | default `Project` |
| `working_week` | jsonb | e.g. `{ "mon":true,...,"sun":false }` |
| `exceptions` | jsonb | array of `{ date, type: "holiday"\|"extra_work" }` |
| `hours_per_day` | numeric | default 8 (durations still in whole days for v1) |

### `boqs`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `project_id` | uuid unique FK | one approved BOQ in v1 |
| `status` | text | `approved` (only status needed for Scheduling seed) |
| `title` | text | |
| `approved_at` | timestamptz | |
| `approved_by` | uuid null FK | |

### `boq_phases`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `boq_id` | uuid FK | |
| `code` | text | A / B / C |
| `name` | text | |
| `color_token` | text | maps to DESIGN phase colors |
| `sort_order` | int | |

Unique `(boq_id, code)`.

### `boq_lines`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `phase_id` | uuid FK | |
| `item_code` | text | |
| `description` | text | |
| `unit` | text | |
| `quantity` | numeric | |
| `rate` | numeric | |
| `amount` | numeric | prefer generated/stored consistently; pick one in migration |
| `sort_order` | int | |

### `schedule_nodes`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `project_id` | uuid FK | |
| `parent_id` | uuid null FK → schedule_nodes | null ⇒ Phase Root |
| `boq_phase_id` | uuid null FK → boq_phases | required for phase_root; inherited for descendants |
| `node_kind` | text | `phase_root` \| `summary` \| `leaf` |
| `wbs_code` | text null | display code; can be maintained by app |
| `name` | text | |
| `duration_days` | numeric | leaves only; 0 = milestone |
| `is_loe` | boolean | default false |
| `sort_order` | int | |
| `es` / `ef` / `ls` / `lf` | numeric null | **not used in v1** — always recompute (D5) |
| `total_float` / `free_float` | numeric null | optional cache |
| `is_critical` | boolean null | optional cache |
| `metrics_at` | timestamptz null | when cache was written |
| `created_at` / `updated_at` | timestamptz | |

**Invariants (enforce in app + DB checks where cheap):**

- `phase_root` ⇒ `parent_id IS NULL` AND `boq_phase_id IS NOT NULL`
- `summary` \| `leaf` ⇒ `parent_id IS NOT NULL`
- Only `leaf` (and milestone) author `duration_days` for CPM; summaries derive rollup in UI/engine

### `dependencies`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `project_id` | uuid FK | denormalized for RLS |
| `predecessor_id` | uuid FK → schedule_nodes | |
| `successor_id` | uuid FK → schedule_nodes | |
| `dep_type` | text | `FS` \| `SS` \| `FF` \| `SF` |
| `lag_days` | numeric | negative = lead |

Check `predecessor_id <> successor_id`. Unique `(predecessor_id, successor_id, dep_type)`.

### `documents`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `project_id` | uuid FK | |
| `title` | text | |
| `storage_path` | text | bucket path |
| `content_type` | text | |
| `byte_size` | bigint | enforce ≤ **50 MB** Free global max; prefer tighter per-bucket |
| `uploaded_by` | uuid FK | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `deleted_at` | timestamptz null | soft-delete only |

Bucket: `project-documents` (private); path `{project_id}/{doc_id}`.

### `project_personnel`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `project_id` | uuid FK | |
| `staff_id` | uuid FK → profiles | **null**; roster is free-text, not a Staff Member list |
| `name` | text | required |
| `title` | text | role on this project |
| `start_date` | date null | |
| `end_date` | date null | |

### `contractors` / `contractor_certs` / `contractor_projects`

Minimal registry for later slices; include FKs now or migrate when building Contractors tab — prefer **lazy create** when that epic starts (see TICKETS).

### `report_messages`

Inbox rows for Reports epic; lazy create.

## Soft delete

`deleted_at` on `projects` and `documents` only. **Hard-delete** `schedule_nodes` and `dependencies` (cascade edges) so CPM never walks tombstones. Periodic purge script for soft-deleted rows — Free DB still counts them. See [`adr/0011-deletion-strategy.md`](adr/0011-deletion-strategy.md).

**Not adopted for v1 authz:** per-project `project_members`. ADR 0002 keeps single-org `profiles.role`.

## Indexes (minimum)

- `projects(stage)`, `projects(code)`
- `schedule_nodes(project_id, parent_id)`, `schedule_nodes(boq_phase_id)`
- `dependencies(project_id)`, `dependencies(predecessor_id)`, `dependencies(successor_id)`
- `boq_phases(boq_id)`, `boq_lines(phase_id)`
- `documents(project_id)`

## RLS sketch (single-org)

Internal staff: all **active** profiles may `SELECT` most project data. Mutations gated by `role` — **canonical matrix** in [`OPEN-DECISIONS.md`](OPEN-DECISIONS.md) D1 / [`adr/0005-role-permission-matrix.md`](adr/0005-role-permission-matrix.md):

| Action | admin | planner | project_manager | viewer |
|--------|-------|---------|-----------------|--------|
| Manage Access Requests | ✓ | | | |
| CRUD projects | ✓ | ✓ | | |
| Edit BOQ | ✓ only (or service role seed) | | | |
| Edit schedule network | ✓ | ✓ | | |
| View schedule / BOQ | ✓ | ✓ | ✓ | ✓ |
| Upload documents | ✓ | ✓ | ✓ | |

Use `security definer` helpers for role checks to avoid policy recursion. Enable RLS on every table.

## Sync: BOQ → Phase Roots

On BOQ approve / Scheduling first open:

1. For each `boq_phases` row missing a `phase_root` node → insert Schedule Node.
2. Never delete Phase Roots that still have a BOQ Phase; orphan roots only if phase removed (admin path).
3. Renames/colors flow Phase → root display.

## Later: baselines (not v1 tables)

`schedule_baselines` + `schedule_baseline_nodes` copying durations/deps/metrics at snapshot time — deferred.

## Related ADRs

- [`adr/0001-client-side-cpm-on-free-tier.md`](adr/0001-client-side-cpm-on-free-tier.md)
- [`adr/0002-single-org-internal-auth.md`](adr/0002-single-org-internal-auth.md)
- [`adr/0003-adjacency-list-wbs.md`](adr/0003-adjacency-list-wbs.md)
- [`adr/0004-persist-inputs-recompute-metrics.md`](adr/0004-persist-inputs-recompute-metrics.md)
