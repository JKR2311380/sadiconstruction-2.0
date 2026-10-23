-- T10 (QA-022, QA-005): clean up schedule_nodes rows written before the T09 fix.
-- NOT RUN. Review the two dry-run lists first; run the write block only after approving them.
-- Deploy the T09 code before running this, or new rows keep arriving with the prefix.

-- ---------------------------------------------------------------------------
-- 1. Dry run: names that carry the parent's code as a prefix ("A.1.QA Durable Foundation").
--    Seeded rows store their OWN code plus a space ("A.1 Mobilization & Demobilization"),
--    which also starts with the parent's code and a dot, so those are excluded.
-- ---------------------------------------------------------------------------
select n.project_id, n.id, n.wbs_code,
       n.name                                  as name_before,
       substr(n.name, length(p.wbs_code) + 2)  as name_after
from public.schedule_nodes n
join public.schedule_nodes p on p.id = n.parent_id
where p.wbs_code is not null
  and left(n.name, length(p.wbs_code) + 1) = p.wbs_code || '.'
  and length(n.name) > length(p.wbs_code) + 1
  and (n.wbs_code is null or left(n.name, length(n.wbs_code) + 1) <> n.wbs_code || ' ')
order by n.project_id, n.wbs_code;

-- ---------------------------------------------------------------------------
-- 2. Dry run: siblings that share a WBS code. The earliest row keeps its code.
--    Rows with children are listed but not renumbered below: their descendants'
--    codes would need the same change, so handle those by hand.
-- ---------------------------------------------------------------------------
with ranked as (
  select n.id, n.project_id, n.parent_id, n.wbs_code, n.name, n.created_at,
         row_number() over (partition by n.parent_id, n.wbs_code order by n.created_at, n.id) as rn,
         exists (select 1 from public.schedule_nodes c where c.parent_id = n.id) as has_children
  from public.schedule_nodes n
  where n.parent_id is not null and n.wbs_code is not null
)
select * from ranked where rn > 1 order by project_id, wbs_code, rn;

-- ---------------------------------------------------------------------------
-- 3. Write block. Everything is in one transaction; end with ROLLBACK to rehearse.
-- ---------------------------------------------------------------------------
begin;

create table if not exists public.qa_t10_schedule_nodes_backup as
select id, name, wbs_code, sort_order, now() as backed_up_at
from public.schedule_nodes
where false;

insert into public.qa_t10_schedule_nodes_backup (id, name, wbs_code, sort_order, backed_up_at)
select id, name, wbs_code, sort_order, now() from public.schedule_nodes;

-- 3a. Strip the parent-code prefix (same predicate as dry run 1).
update public.schedule_nodes n
set name = substr(n.name, length(p.wbs_code) + 2)
from public.schedule_nodes p
where p.id = n.parent_id
  and p.wbs_code is not null
  and left(n.name, length(p.wbs_code) + 1) = p.wbs_code || '.'
  and length(n.name) > length(p.wbs_code) + 1
  and (n.wbs_code is null or left(n.name, length(n.wbs_code) + 1) <> n.wbs_code || ' ');

-- 3b. Give later duplicates the next free index under their parent (leaf rows only).
with ranked as (
  select n.id, n.parent_id,
         row_number() over (partition by n.parent_id, n.wbs_code order by n.created_at, n.id) as rn
  from public.schedule_nodes n
  where n.parent_id is not null and n.wbs_code is not null
),
dupes as (
  select r.id, r.parent_id,
         row_number() over (partition by r.parent_id order by r.id) as extra
  from ranked r
  where r.rn > 1
    and not exists (select 1 from public.schedule_nodes c where c.parent_id = r.id)
),
tops as (
  select s.parent_id,
         max(coalesce(substring(s.wbs_code from '\.([0-9]+)$')::int, 0)) as top_index,
         max(s.sort_order) as top_sort
  from public.schedule_nodes s
  where s.parent_id is not null
  group by s.parent_id
)
update public.schedule_nodes n
set wbs_code   = p.wbs_code || '.' || (t.top_index + d.extra),
    sort_order = t.top_sort + d.extra
from dupes d
join tops t on t.parent_id = d.parent_id
join public.schedule_nodes p on p.id = d.parent_id
where n.id = d.id and p.wbs_code is not null;

-- Check: both dry runs above should now return no rows (except duplicates with children).
-- Then COMMIT, or ROLLBACK to leave the data untouched.

-- commit;
rollback;

-- ---------------------------------------------------------------------------
-- Undo after a commit:
--   update public.schedule_nodes n
--   set name = b.name, wbs_code = b.wbs_code, sort_order = b.sort_order
--   from public.qa_t10_schedule_nodes_backup b where b.id = n.id;
-- Drop the backup table once the result is accepted:
--   drop table public.qa_t10_schedule_nodes_backup;
-- ---------------------------------------------------------------------------
