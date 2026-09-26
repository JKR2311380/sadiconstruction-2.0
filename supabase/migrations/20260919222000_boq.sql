-- T5.1 BOQ tables. Amount is stored at write time. RLS: active Staff Member CRUD.

create table if not exists public.boqs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  status text not null default 'approved' check (status = 'approved'),
  title text not null default '',
  approved_at timestamptz,
  approved_by uuid references public.profiles (id)
);

create table if not exists public.boq_phases (
  id uuid primary key default gen_random_uuid(),
  boq_id uuid not null references public.boqs (id) on delete cascade,
  code text not null,
  name text not null,
  color_token text not null default 'a',
  sort_order int not null default 0,
  unique (boq_id, code)
);

create table if not exists public.boq_lines (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.boq_phases (id) on delete cascade,
  item_code text not null default '',
  description text not null default '',
  unit text not null default '',
  quantity numeric not null default 0,
  rate numeric not null default 0,
  amount numeric not null default 0,
  sort_order int not null default 0
);

create index if not exists boq_phases_boq_id_idx on public.boq_phases (boq_id);
create index if not exists boq_lines_phase_id_idx on public.boq_lines (phase_id);

alter table public.boqs enable row level security;
alter table public.boq_phases enable row level security;
alter table public.boq_lines enable row level security;

drop policy if exists "staff crud boqs" on public.boqs;
create policy "staff crud boqs"
  on public.boqs for all to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

drop policy if exists "staff crud boq_phases" on public.boq_phases;
create policy "staff crud boq_phases"
  on public.boq_phases for all to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

drop policy if exists "staff crud boq_lines" on public.boq_lines;
create policy "staff crud boq_lines"
  on public.boq_lines for all to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

grant select, insert, update, delete on public.boqs, public.boq_phases, public.boq_lines to authenticated;
