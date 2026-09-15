# Free-tier Supabase architecture for an internal construction PM app

> **Date:** 2026-09-15  
> **Stack focus:** Vite + React + Supabase Free Plan  
> **Scope:** Data model and architecture constraints (not UI).  
> **Method:** Claims traced to official Supabase and PostgreSQL documentation (primary sources). Blog roundups excluded.

---

> **Product decision overlay:** Governing docs adopt single-org `profiles.role` ([ADR 0002](../adr/0002-single-org-internal-auth.md)), not `project_members` for v1. Membership-table RLS remains a valid later upgrade if D1 in OPEN-DECISIONS requires project-scoped ACLs. Client-side CPM and adjacency-list WBS match ADRs 0001 / 0003.

---

## Summary

An internal multi-project construction PM app can run on Supabase Free Plan, but the hard ceilings that shape the data model are **500 MB database size per project**, **1 GB file storage**, **50 MB max upload**, **Shared CPU · 500 MB RAM**, **Edge Function 2 s CPU / 150 s wall-clock**, **no automatic backups**, and **pause after 1 week of inactivity**. Auth MAU (50,000) is unlikely to bind an internal team; storage and database size will.

Recommended architecture under those limits:

1. **Schema:** `auth.users` stays Auth-owned; put app identity in `public.profiles` (UUID FK, `ON DELETE CASCADE`). Authorize multi-project access via a membership table and RLS policies that filter on membership sets—not client-supplied project IDs alone. Enable RLS + least-privilege grants on every exposed table.
2. **WBS / schedule hierarchy:** Prefer **adjacency list** (`parent_id`) plus optional **materialized path** (`ltree` or `text[]` path) for subtree reads. Avoid nested-set as the primary store: Postgres first-class tools are recursive CTEs and `ltree`, not nested intervals.
3. **CPM placement:** Run the interactive Critical Path Method engine **client-side** (or in a Web Worker). Persist inputs + computed snapshot in Postgres. Do **not** put CPM on Edge Functions on Free Plan (2 s CPU budget). Avoid large CPM runs inside Free Plan Postgres (shared CPU / 500 MB RAM).
4. **Documents:** Private Storage buckets, path-scoped RLS (`project_id/…`), signed URLs for download, per-bucket MIME/size limits, metadata in Postgres. Expect **1 GB total** and **50 MB/file** to force external object storage or Pro Plan for real construction document libraries.
5. **Lifecycle fields:** Soft-delete with `deleted_at` in app tables; use Auth soft-delete only when deprovisioning users. Prefer **UUID PKs** (Auth already uses UUID; Postgres documents UUIDs for distributed uniqueness). Prefer time-ordered UUIDv7 when the Postgres version supports `uuidv7()`.

---

## Free-tier constraints table

Sources: [Pricing](https://supabase.com/pricing), [Billing on Supabase](https://supabase.com/docs/guides/platform/billing-on-supabase), [Database size](https://supabase.com/docs/guides/platform/database-size), [Edge Functions limits](https://supabase.com/docs/guides/functions/limits), [Realtime limits](https://supabase.com/docs/guides/realtime/limits), [Storage file limits](https://supabase.com/docs/guides/storage/uploads/file-limits), [Storage pricing](https://supabase.com/docs/guides/storage/pricing), [Free project pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [MAU usage](https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users), [Cron](https://supabase.com/docs/guides/cron), [Fair Use (Billing FAQ)](https://supabase.com/docs/guides/platform/billing-faq).

| Resource | Free Plan limit (official) | Architecture implication for construction PM |
| --- | --- | --- |
| Active projects | 2 active; paused do not count | One prod + one staging max without pause juggling. |
| Inactivity pause | Paused after ~1 week low DB activity; restore ≤ 1 year | Internal apps that sit idle (weekends/holidays) can pause; paid plan removes pausing. |
| Compute | Shared CPU · 500 MB RAM (Pricing) | Heavy SQL (large CPM, recursive WBS over huge graphs) competes for scarce RAM/CPU. |
| Database size | **500 MB per project** (Postgres data size, not disk). Free projects also get ~1 GB disk but **read-only trips at 500 MB DB size**. New projects already ~40–60 MB. | Cap history, attachments-as-bytes in DB, wide audit logs, and unused indexes. Vacuum after large deletes; space may not return to OS without upgrade/migration. |
| Egress | 5 GB + 5 GB cached egress | Prefer CDN-cached Storage reads; avoid bulk Realtime fan-out of large payloads. |
| Auth total users | Unlimited | Fine for internal orgs. |
| Auth MAU | 50,000 included. MAU = distinct users who **sign in or refresh token** in the billing cycle (once per user). | Internal team size ≪ quota. Token refresh still counts as activity for that user once per cycle. |
| Auth SSO (SAML) | **Unavailable** on Free | No corporate IdP SSO without Pro+. |
| Auth audit logs | 1 hour retention | Do not rely on platform auth logs for compliance; store app-level audit in your tables (and watch DB size). |
| Automatic backups | **Not included** | Export/migrate strategy required; data loss risk if project is lost. |
| Storage size | **1 GB** included | Construction docs (drawings, RFIs, submittals) will hit this quickly. |
| Max file upload | **50 MB** global max on Free | Many PDFs/DWGs exceed 50 MB → must compress, split, or use external storage / upgrade. |
| Image transformations | Unavailable on Free | No server-side image resize via Storage transforms. |
| Edge Function invocations | 500,000 / month | Usually OK for webhooks/admin; not for per-keystroke CPM. |
| Edge Function count | Free: **100** functions / project | Plenty for a PM app if you consolidate routes (cold-start advice). |
| Edge runtime | Memory **256 MB**; CPU **2 s**/request; wall-clock Free **150 s**; idle timeout **150 s** | CPU-bound CPM will hit 2 s long before wall-clock. No long-running workers. |
| Cron / jobs | `pg_cron` supported; docs recommend ≤ 8 concurrent jobs, each ≤ **10 minutes** | Scheduled work must be short/idempotent; not a substitute for a job queue for heavy CPM. |
| Realtime messages | **2 million** / month | Prefer channel-per-project; avoid broadcasting full schedule graphs. |
| Realtime peak connections | **200** | Fine for small office; concurrent field tablets + office can approach it. |
| Realtime msg/sec | **100**/s (Free) | Bursty collaborative editing of schedules can trip disconnects. |
| Realtime broadcast payload | **256 KB** (Free) | Do not push entire WBS/CPM results over Realtime. |
| Postgres Changes payload | **1,024 KB**; oversized fields truncated to ≤ 64 bytes | Large row updates (JSON schedule blobs) may arrive incomplete via Realtime. |
| Log retention (API & DB) | **1 day** | Short operational history; export if needed. |
| Fair Use | Exceeding Free quotas → grace period then restrictions (pause, read-only, API **402**) | Soft deletes and retained docs inflate averages; cleanup matters. |

---

## Schema / RLS recommendations

### 1. `auth.users` vs `public.profiles`

Official guidance: the Auth schema is **not** exposed in the auto-generated API. Application-facing user data belongs in `public` (or another exposed schema), with a FK to `auth.users` and `ON DELETE CASCADE`, RLS enabled, and least-privilege grants.

- Pattern: `public.profiles (id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE, …)`.
- Sync on signup with an `AFTER INSERT` trigger on `auth.users` calling a `SECURITY DEFINER` function with `search_path = ''`.
- Caution: a failing trigger can **block signups**—test thoroughly.
- Do **not** put authorization-sensitive fields only in `user_metadata` / JWT-editable metadata; Auth docs warn `user_metadata` is user-editable and must not drive RLS.

Sources: [Managing user data](https://supabase.com/docs/guides/auth/managing-user-data), [Users object / user_metadata warning](https://supabase.com/docs/guides/auth/users), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

### 2. Multi-project internal tenancy (membership + RLS)

Treat each **construction project** as a tenant row. Membership is the source of truth:

```text
profiles ──< project_members >── projects
                    │
                    └── role (pm, planner, viewer, …)
```

Child tables (`activities`, `dependencies`, `documents`, `boq_items`, …) carry `project_id` and are gated by membership.

RLS practice from official docs:

1. **Enable RLS** on every table in an exposed schema; **revoke** blanket `anon`/`authenticated` grants; grant back only needed ops.
2. Write **one policy per operation** (`SELECT` / `INSERT` / `UPDATE` / `DELETE`); avoid opaque `FOR ALL` when possible.
3. Prefer membership-set filters (no join back to the row’s table inside the policy):

```sql
-- Pattern aligned with official RLS performance guidance
create policy "member can read activities"
on public.activities
for select
to authenticated
using (
  project_id in (
    select project_id
    from public.project_members
    where user_id = (select auth.uid())
  )
);
```

4. Wrap helpers: `(select auth.uid())` so Postgres can cache the scalar.
5. Index policy filter columns (`project_id`, `project_members(user_id)`, etc.).
6. **Also filter in the client query** (`.eq('project_id', …)`); RLS is security, not a substitute for query filters.
7. For recursive membership checks, use schema-qualified `SECURITY DEFINER` helpers with locked `search_path`; do not rely on exposing them via the Data API.
8. Test allow/deny with `supabase test db`.
9. Views default to **security definer** behavior and can bypass RLS—treat views as carefully as tables.

Sources: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [RLS performance](https://supabase.com/docs/guides/database/postgres/row-level-security-performance), [Securing your API](https://supabase.com/docs/guides/api/securing-your-api).

### 3. Client-side vs Database Functions vs Edge Functions

| Workload | Prefer | Why (official) |
| --- | --- | --- |
| CRUD under RLS, small validations | Client → PostgREST | Direct Data API; policies enforce access. |
| Data-intensive ops near the data (membership checks, constrained updates, small graph helpers) | **Database Functions** (`rpc`) | Docs: data-intensive → Database Functions inside Postgres. Use `SECURITY INVOKER` by default; if `DEFINER`, set `search_path`. |
| Webhooks, email, third-party APIs, short orchestration | **Edge Functions** | Docs list webhooks, email, low-latency HTTP; design for cold starts; “heavy long-running jobs should be moved to background workers.” |
| Interactive CPM / long graph math | **Browser (Vite/React) ± Worker** | Edge: **2 s CPU**; Free DB: shared CPU / 500 MB RAM; Cron jobs ≤ 10 minutes but still share Free compute. |

Sources: [Database Functions](https://supabase.com/docs/guides/database/functions), [Edge Functions overview](https://supabase.com/docs/guides/functions), [Edge Functions limits](https://supabase.com/docs/guides/functions/limits), [Routing / cold starts](https://supabase.com/docs/guides/functions/routing), [Cron](https://supabase.com/docs/guides/cron).

### 4. Soft deletes, audit fields, UUID vs serial

**Soft deletes (app data)**  
Postgres does not provide a built-in soft-delete type. Standard practice under Free Plan constraints:

- `deleted_at timestamptz null` (prefer timestamp over boolean for audit).
- Default queries / views / RLS `USING (deleted_at is null)` (or explicit “include deleted” for admins).
- Soft-deleted rows **still consume the 500 MB quota** until hard-deleted + vacuumed ([Database size](https://supabase.com/docs/guides/platform/database-size), [Data deletion](https://supabase.com/docs/guides/database/postgres/data-deletion)).
- Plan periodic hard-delete of aged soft rows; after large deletes run `VACUUM` (note `VACUUM FULL` locks the table).

**Auth user soft delete**  
`auth.admin.deleteUser(id, { shouldSoftDelete: true })` sets `deleted_at` and disables the account while preserving Auth data. Default is hard delete. Soft-deleting only app tables **does not** revoke Auth; the user can still authenticate. Outstanding access JWTs remain valid until `exp`.

Sources: [Managing user data](https://supabase.com/docs/guides/auth/managing-user-data), [JS/Python admin deleteUser](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser) (same `shouldSoftDelete` semantics across SDKs).

**Audit fields**  
Recommended columns on mutable project entities: `created_at`, `updated_at`, `created_by`, `updated_by` (UUIDs → `profiles`/`auth.users`), optional `deleted_at` / `deleted_by`. Platform Auth audit log retention on Free is **1 hour**—not a substitute for app audit tables ([Pricing](https://supabase.com/pricing)). Keep audit rows lean (who/when/entity/action + small JSON diff); full change history of large schedule blobs will burn the 500 MB quota.

**UUID vs serial / identity**

| Approach | Official basis | Fit for this app |
| --- | --- | --- |
| `uuid` PK (`gen_random_uuid()` / `uuidv4()`) | Postgres UUID type; good uniqueness vs sequences that are only unique within one DB | Aligns with `auth.users.id`; safe for client-generated IDs and merges. |
| `uuidv7()` | Time-ordered UUID; better index locality (Postgres 18+) | Prefer **if** project Postgres version exposes `uuidv7()`. Confirm version before mandating. |
| `GENERATED … AS IDENTITY` / serial | Official identity columns for sequence keys | Fine for internal-only counters (WBS codes, display numbers) as **secondary** keys—not as the only join key to Auth. |

Sources: [UUID type](https://www.postgresql.org/docs/current/datatype-uuid.html), [UUID functions](https://www.postgresql.org/docs/current/functions-uuid.html), [Identity columns](https://www.postgresql.org/docs/current/ddl-identity-columns.html).

**Practical recommendation:** UUID primary keys everywhere you sync with Auth or may export/import projects; optional human-readable `code` / identity column for WBS numbering.

---

## Hierarchical WBS / schedule activities

Construction WBS and schedule activities are trees (sometimes forests per project) with frequent **reparent**, **insert**, and **reorder** operations, plus occasional “all descendants of phase X” queries.

### Options

| Model | How it works | Strengths | Weaknesses for schedules |
| --- | --- | --- | --- |
| **Adjacency list** | `parent_id` FK to same table | Simple writes/moves; natural for editors; Postgres documents recursive CTEs for hierarchical walk | Subtree queries need `WITH RECURSIVE`; deep trees cost iterative work on Free CPU |
| **Materialized path** | Store path string / `ltree` / `uuid[]` | Fast descendant/ancestor predicates; GiST indexes on `ltree` | Path must be maintained on move; label constraints on `ltree` |
| **Nested set** (left/right intervals) | Store `lft`/`rgt` spanning subtree | Fast subtree read without recursion | Inserts/moves rewrite many rows—expensive under Shared CPU and write amplification toward 500 MB indexes/WAL |

### Postgres first-party facilities (prefer these)

1. **Adjacency list + `WITH RECURSIVE`** — Postgres explicitly documents recursive CTEs for hierarchical / tree-structured data (parts explosion example, tree search with path arrays for depth-first order).  
   Source: [WITH Queries / Recursive Queries](https://www.postgresql.org/docs/current/queries-with.html).

2. **`ltree` materialized path** — Trusted extension; label paths like `Top.Phase.Foundation`; operators `<@` / `@>` for descendant/ancestor; GiST indexes. Supabase upgrade docs discuss **`ltree` indexes**, confirming platform use of the extension.  
   Sources: [ltree](https://www.postgresql.org/docs/current/ltree.html), [Platform upgrading (ltree reindex note)](https://supabase.com/docs/guides/platform/upgrading), [Extensions overview](https://supabase.com/docs/guides/database/extensions).

3. **Materialized views** — Can cache expensive hierarchy rollups but require refresh; consume DB size.  
   Source: [Materialized Views](https://www.postgresql.org/docs/current/rules-materializedviews.html).

### Recommendation for Sadiconstruction

- **Canonical store:** adjacency list (`project_id`, `parent_id`, `sort_order`) for activities / WBS nodes.  
- **Optional cache:** `path ltree` (or `text` path of stable codes) maintained by trigger for subtree filters and reports.  
- **Do not** use nested-set as the write path for an editable construction schedule on Free Plan.  
- Scope all hierarchy queries **by `project_id` first** to bound recursive work.  
- Keep CPM **network** (precedence graph) in a separate `dependencies` table; WBS parent/child is not the same as FS/SS/FF/SF logic.

---

## CPM compute placement recommendation

### Constraints that decide placement

- Edge Functions: **2 seconds CPU per request**, 256 MB memory, Free wall-clock 150 s ([limits](https://supabase.com/docs/guides/functions/limits)). CPU and wall-clock are independent; CPU-bound work dies first ([troubleshooting](https://supabase.com/docs/guides/troubleshooting/edge-function-wall-clock-time-limit-reached-Nk38bW)).
- Edge overview: cold starts happen; **heavy long-running jobs → background workers** ([Edge Functions](https://supabase.com/docs/guides/functions)).
- Free DB: Shared CPU · 500 MB RAM ([Pricing](https://supabase.com/pricing)).
- Cron: jobs should run ≤ **10 minutes**, ≤ 8 concurrent ([Cron](https://supabase.com/docs/guides/cron))—still on the same small Free instance if implemented as SQL.
- No Free-tier managed long-running worker product; Queues/`pgmq` patterns still need somewhere to run consumers.

### Recommendation

| Layer | Role |
| --- | --- |
| **Client (Vite/React ± Web Worker)** | Topological sort, forward/backward pass, longest-path marking for interactive editing. Scales with the user’s machine; no Edge CPU meter. |
| **Postgres** | Persist activities, calendars, dependencies, constraints, data date, and **last computed snapshot** (ES/EF/LS/LF/float/critical flags, computed_at). Optional small `rpc` for tiny networks or integrity checks—not full multi-calendar forensic CPM. |
| **Edge Functions** | Avoid for CPM. Use for webhooks, notifications, signed-URL minting, admin ops. |
| **Realtime** | Broadcast **invalidation events** (“schedule changed”) or tiny summaries—not full graphs (256 KB broadcast limit; 100 msg/s). |

**Why not server-side on Free:** Construction CPM with calendars, retained logic, and longest-path tracing is CPU-heavy relative to a **2 s** Edge budget and a **shared 500 MB** DB. Recomputing on every dependency edit server-side would also burn invocations and risk Fair Use pressure.

**Integrity model:** Treat client results as authoritative for UI only after validation (DAG check, finite dates). Persist inputs always; persist outputs as a snapshot for reports/export. For disputed forensic schedules, upgrade compute or run offline—Free Plan is not a scheduling appliance.

---

## Storage recommendations

### Hard Free limits

- **1 GB** total Storage quota ([Pricing](https://supabase.com/pricing), [Storage pricing](https://supabase.com/docs/guides/storage/pricing)).
- **50 MB** max file size on Free ([File limits](https://supabase.com/docs/guides/storage/uploads/file-limits)).
- Image Transformations unavailable ([Pricing](https://supabase.com/pricing)).

### Patterns

1. **Private buckets by default** for construction documents (drawings, RFIs, submittals, photos). Public buckets are CDN-friendly but inappropriate for proprietary plans ([Serving assets](https://supabase.com/docs/guides/storage/serving/downloads)).
2. **RLS on `storage.objects`** — Storage denies uploads without policies. Scope by bucket and folder; common pattern: first path segment = `auth.uid()` or project id the member can access ([Storage access control](https://supabase.com/docs/guides/storage/security/access-control)).
3. **Path convention:** `{project_id}/{doc_type}/{uuid}_{safe_filename}` so policies can check `project_id` via `(storage.foldername(name))[1]` and join membership (via helper or mirrored metadata).
4. **Postgres metadata table** (`documents`: project_id, storage_path, title, mime, byte_size, revision, uploaded_by, soft-delete). Do **not** store file bytes in Postgres (burns the 500 MB DB quota).
5. **Signed URLs** for time-limited download/share; authenticated GET for app sessions ([Serving assets](https://supabase.com/docs/guides/storage/serving/downloads)).
6. **Per-bucket `fileSizeLimit` / `allowedMimeTypes`** tighter than the 50 MB global cap ([Creating buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets)).
7. **Egress:** Prefer cached CDN paths where appropriate; Free includes only 5 GB cached + 5 GB origin-class egress ([Pricing](https://supabase.com/pricing)).
8. **Auth delete caveat:** You cannot delete an Auth user who still **owns** Storage objects—reassign or delete objects first ([Managing user data](https://supabase.com/docs/guides/auth/managing-user-data)).
9. **When 1 GB / 50 MB is insufficient:** Upgrade Storage (Pro: 100 GB included, up to 500 GB file limit) or store large binaries in an external object store and keep only pointers in Supabase.

### Optimization (official)

Limit upload size; delete unused assets; index columns used in Storage RLS ([Storage scaling](https://supabase.com/docs/guides/storage/production/scaling), [Manage Storage size](https://supabase.com/docs/guides/platform/manage-your-usage/storage-size)).

---

## Open risks

1. **500 MB database ceiling** — Soft deletes, schedule snapshots, audit JSON, indexes, and WAL-related disk pressure can push Free projects into **read-only** or org Fair Use **402** based on **average** daily DB size across the billing period ([Database size](https://supabase.com/docs/guides/platform/database-size), [Billing FAQ Fair Use](https://supabase.com/docs/guides/platform/billing-faq)).
2. **No automatic backups on Free** — Operational data loss risk; need export discipline ([Pricing](https://supabase.com/pricing)).
3. **Project pausing** — Idle internal tools pause after ~7 days; resume required; restore window documented as up to 1 year ([Free project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)).
4. **Document reality vs 1 GB / 50 MB** — Typical construction PDFs and CAD exports exceed Free Storage; plan Pro or external object storage early.
5. **CPM correctness vs Free compute** — Client-side CPM avoids Edge CPU limits but introduces trust/version skew across clients unless snapshots are server-validated; server-side full CPM is a poor Free-tier fit.
6. **Realtime truncation** — Large activity rows may produce incomplete Postgres Changes payloads when over size limits ([Realtime limits](https://supabase.com/docs/guides/realtime/limits)).
7. **SAML SSO unavailable** — Enterprise customers expecting corporate SSO need Pro+ ([Billing usage table](https://supabase.com/docs/guides/platform/billing-on-supabase)).
8. **`ltree` upgrade footguns** — After certain Postgres upgrades, `ltree` indexes may need `REINDEX` or queries miss rows ([Upgrading](https://supabase.com/docs/guides/platform/upgrading)).
9. **Auth soft-delete vs app soft-delete confusion** — App-only `deleted_at` does not revoke access; JWT remains valid until expiry after Auth delete ([Managing user data](https://supabase.com/docs/guides/auth/managing-user-data)).
10. **Shared CPU contention** — Recursive WBS queries + Realtime + Storage metadata + Cron on one Free instance can amplify latency under concurrent planners.

---

## Source index

| Topic | URL |
| --- | --- |
| Pricing (Free quotas, Storage 50 MB, Auth, Realtime, Edge invocations) | https://supabase.com/pricing |
| Org billing & quota table | https://supabase.com/docs/guides/platform/billing-on-supabase |
| Database vs disk size, Free read-only at 500 MB | https://supabase.com/docs/guides/platform/database-size |
| Disk size billing note (Free uses DB size) | https://supabase.com/docs/guides/platform/manage-your-usage/disk-size |
| Free pausing | https://supabase.com/docs/guides/platform/free-project-pausing |
| Fair Use restrictions | https://supabase.com/docs/guides/platform/billing-faq |
| MAU definition | https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users |
| Edge Function limits | https://supabase.com/docs/guides/functions/limits |
| Edge Functions overview / when to use | https://supabase.com/docs/guides/functions |
| Edge cold starts / routing | https://supabase.com/docs/guides/functions/routing |
| Database vs Edge Functions | https://supabase.com/docs/guides/database/functions |
| Cron job guidance | https://supabase.com/docs/guides/cron |
| Realtime limits | https://supabase.com/docs/guides/realtime/limits |
| RLS | https://supabase.com/docs/guides/database/postgres/row-level-security |
| RLS performance | https://supabase.com/docs/guides/database/postgres/row-level-security-performance |
| Securing the API | https://supabase.com/docs/guides/api/securing-your-api |
| Profiles / auth.users | https://supabase.com/docs/guides/auth/managing-user-data |
| Users / metadata warning | https://supabase.com/docs/guides/auth/users |
| Storage access control | https://supabase.com/docs/guides/storage/security/access-control |
| Storage file limits | https://supabase.com/docs/guides/storage/uploads/file-limits |
| Storage serving / signed URLs | https://supabase.com/docs/guides/storage/serving/downloads |
| Storage pricing | https://supabase.com/docs/guides/storage/pricing |
| Creating buckets (MIME/size) | https://supabase.com/docs/guides/storage/buckets/creating-buckets |
| Data deletion / vacuum | https://supabase.com/docs/guides/database/postgres/data-deletion |
| Recursive CTEs | https://www.postgresql.org/docs/current/queries-with.html |
| ltree | https://www.postgresql.org/docs/current/ltree.html |
| UUID type / functions | https://www.postgresql.org/docs/current/datatype-uuid.html · https://www.postgresql.org/docs/current/functions-uuid.html |
| Identity columns | https://www.postgresql.org/docs/current/ddl-identity-columns.html |
| Materialized views | https://www.postgresql.org/docs/current/rules-materializedviews.html |
| Extensions / ltree upgrade note | https://supabase.com/docs/guides/database/extensions · https://supabase.com/docs/guides/platform/upgrading |

---

*End of research note. Re-check https://supabase.com/pricing before locking quotas into a PRD—Free Plan numbers can change.*
