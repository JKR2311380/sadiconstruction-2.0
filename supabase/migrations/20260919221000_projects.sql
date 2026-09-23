-- T3.1 projects + RLS. Single-org: every active Staff Member may CRUD (soft-delete).

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  client text,
  site text,
  stage text not null default 'planning'
    check (stage in ('planning', 'active', 'on_hold', 'delayed', 'completed')),
  priority smallint,
  progress_pct numeric(5, 2) not null default 0,
  expenditure numeric(14, 2),
  currency text not null default 'PHP',
  start_date date,
  target_end_date date,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists projects_stage_idx on public.projects (stage);
create index if not exists projects_code_idx on public.projects (code);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create or replace function public.next_project_code(p_year int default extract(year from now())::int)
returns text
language plpgsql
stable
as $$
declare
  n int;
begin
  select coalesce(
    max(substring(code from 'PRJ-' || p_year::text || '-([0-9]{3})')::int),
    0
  ) + 1
  into n
  from public.projects
  where code ~ ('^PRJ-' || p_year::text || '-[0-9]{3}$');
  return 'PRJ-' || p_year::text || '-' || lpad(n::text, 3, '0');
end;
$$;

alter table public.projects enable row level security;

drop policy if exists "staff select projects" on public.projects;
create policy "staff select projects"
  on public.projects for select to authenticated
  using (public.is_active_staff());

drop policy if exists "staff insert projects" on public.projects;
create policy "staff insert projects"
  on public.projects for insert to authenticated
  with check (public.is_active_staff());

drop policy if exists "staff update projects" on public.projects;
create policy "staff update projects"
  on public.projects for update to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

grant select, insert, update on public.projects to authenticated;
grant execute on function public.next_project_code(int) to authenticated;
