-- T7.1 calendars, schedule_nodes, dependencies, PH holiday seed, BOQ → Phase Root sync.
-- Metric cache columns exist but v1 adapters must not write them (D5).

create table if not exists public.project_calendars (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  name text not null default 'Project',
  working_week jsonb not null default '{"mon":true,"tue":true,"wed":true,"thu":true,"fri":true,"sat":true,"sun":false}'::jsonb,
  exceptions jsonb not null default '[]'::jsonb,
  hours_per_day numeric not null default 8
);

create or replace function public.easter_sunday(p_year int)
returns date
language plpgsql
immutable
as $$
declare
  a int := p_year % 19;
  b int := p_year / 100;
  c int := p_year % 100;
  d int := b / 4;
  e int := b % 4;
  f int := (b + 8) / 25;
  g int := (b - f + 1) / 3;
  h int := (19 * a + b - d - g + 15) % 30;
  i int := c / 4;
  k int := c % 4;
  l int := (32 + 2 * e + 2 * i - h - k) % 7;
  m int := (a + 11 * h + 22 * l) / 451;
  month int := (h + l - 7 * m + 114) / 31;
  day int := ((h + l - 7 * m + 114) % 31) + 1;
begin
  return make_date(p_year, month, day);
end;
$$;

create or replace function public.ph_holiday_exceptions(p_year int)
returns jsonb
language sql
immutable
as $$
  select jsonb_agg(jsonb_build_object('date', d::text, 'type', 'holiday', 'label', label) order by d)
  from (
    select make_date(p_year, 1, 1) as d, 'New Year''s Day'::text as label
    union all select public.easter_sunday(p_year) - 3, 'Maundy Thursday'
    union all select public.easter_sunday(p_year) - 2, 'Good Friday'
    union all select make_date(p_year, 4, 9), 'Araw ng Kagitingan'
    union all select make_date(p_year, 5, 1), 'Labor Day'
    union all select make_date(p_year, 6, 12), 'Independence Day'
    union all select make_date(p_year, 8, 21), 'Ninoy Aquino Day'
    union all select make_date(p_year, 8, 31) - ((extract(dow from make_date(p_year, 8, 31))::int + 6) % 7), 'National Heroes Day'
    union all select make_date(p_year, 11, 1), 'All Saints'' Day'
    union all select make_date(p_year, 11, 30), 'Bonifacio Day'
    union all select make_date(p_year, 12, 25), 'Christmas Day'
    union all select make_date(p_year, 12, 30), 'Rizal Day'
    union all select make_date(p_year, 12, 31), 'Last Day of the Year'
  ) holidays
$$;

create or replace function public.ensure_project_calendar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_calendars (project_id, exceptions)
  values (
    new.id,
    public.ph_holiday_exceptions(extract(year from coalesce(new.start_date, now()))::int)
  )
  on conflict (project_id) do nothing;
  return new;
end;
$$;

drop trigger if exists projects_ensure_calendar on public.projects;
create trigger projects_ensure_calendar
  after insert on public.projects
  for each row execute function public.ensure_project_calendar();

create table if not exists public.schedule_nodes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  parent_id uuid references public.schedule_nodes (id) on delete cascade,
  boq_phase_id uuid references public.boq_phases (id),
  node_kind text not null check (node_kind in ('phase_root', 'summary', 'leaf')),
  wbs_code text,
  name text not null,
  duration_days numeric not null default 0,
  is_loe boolean not null default false,
  sort_order int not null default 0,
  es numeric,
  ef numeric,
  ls numeric,
  lf numeric,
  total_float numeric,
  free_float numeric,
  is_critical boolean,
  metrics_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_nodes_phase_root check (
    (node_kind = 'phase_root' and parent_id is null and boq_phase_id is not null)
    or (node_kind in ('summary', 'leaf') and parent_id is not null)
  )
);

create table if not exists public.dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  predecessor_id uuid not null references public.schedule_nodes (id) on delete cascade,
  successor_id uuid not null references public.schedule_nodes (id) on delete cascade,
  dep_type text not null check (dep_type in ('FS', 'SS', 'FF', 'SF')),
  lag_days numeric not null default 0,
  updated_at timestamptz not null default now(),
  constraint dependencies_no_self check (predecessor_id <> successor_id),
  unique (predecessor_id, successor_id, dep_type)
);

create index if not exists schedule_nodes_project_parent_idx on public.schedule_nodes (project_id, parent_id);
create index if not exists schedule_nodes_boq_phase_idx on public.schedule_nodes (boq_phase_id);
create index if not exists dependencies_project_idx on public.dependencies (project_id);
create index if not exists dependencies_predecessor_idx on public.dependencies (predecessor_id);
create index if not exists dependencies_successor_idx on public.dependencies (successor_id);

drop trigger if exists schedule_nodes_set_updated_at on public.schedule_nodes;
create trigger schedule_nodes_set_updated_at
  before update on public.schedule_nodes
  for each row execute function public.set_updated_at();

drop trigger if exists dependencies_set_updated_at on public.dependencies;
create trigger dependencies_set_updated_at
  before update on public.dependencies
  for each row execute function public.set_updated_at();

alter table public.project_calendars enable row level security;
alter table public.schedule_nodes enable row level security;
alter table public.dependencies enable row level security;

drop policy if exists "staff crud calendars" on public.project_calendars;
create policy "staff crud calendars"
  on public.project_calendars for all to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

drop policy if exists "staff crud schedule_nodes" on public.schedule_nodes;
create policy "staff crud schedule_nodes"
  on public.schedule_nodes for all to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

drop policy if exists "staff crud dependencies" on public.dependencies;
create policy "staff crud dependencies"
  on public.dependencies for all to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

grant select, insert, update, delete on public.project_calendars, public.schedule_nodes, public.dependencies to authenticated;

create or replace function public.sync_phase_roots(p_project_id uuid)
returns void
language plpgsql
as $$
declare
  phase record;
begin
  if not public.is_active_staff() then
    raise exception 'not authorized';
  end if;

  delete from public.schedule_nodes n
  where n.project_id = p_project_id
    and n.node_kind = 'phase_root'
    and n.boq_phase_id is not null
    and not exists (
      select 1
      from public.boq_phases p
      join public.boqs b on b.id = p.boq_id
      where p.id = n.boq_phase_id
        and b.project_id = p_project_id
    );

  for phase in
    select p.id, p.code, p.name, p.color_token, p.sort_order
    from public.boq_phases p
    join public.boqs b on b.id = p.boq_id
    where b.project_id = p_project_id
    order by p.sort_order
  loop
    if exists (
      select 1 from public.schedule_nodes
      where project_id = p_project_id
        and node_kind = 'phase_root'
        and boq_phase_id = phase.id
    ) then
      update public.schedule_nodes
      set name = phase.code || ' – ' || phase.name,
          wbs_code = phase.code,
          sort_order = phase.sort_order
      where project_id = p_project_id
        and node_kind = 'phase_root'
        and boq_phase_id = phase.id;
    else
      insert into public.schedule_nodes (
        project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, sort_order
      ) values (
        p_project_id, null, phase.id, 'phase_root', phase.code,
        phase.code || ' – ' || phase.name, 0, phase.sort_order
      );
    end if;
  end loop;
end;
$$;

create or replace function public.replace_boq(p_project_id uuid, p_payload jsonb)
returns uuid
language plpgsql
as $$
declare
  boq_id uuid;
  phase jsonb;
  line jsonb;
  phase_id uuid;
  sort_i int;
  line_i int;
begin
  if not public.is_active_staff() then
    raise exception 'not authorized';
  end if;

  perform pg_advisory_xact_lock(('x' || substr(md5(p_project_id::text), 1, 16))::bit(64)::bigint);

  select id into boq_id from public.boqs where project_id = p_project_id;
  if boq_id is null then
    insert into public.boqs (project_id, status, title, approved_at, approved_by)
    values (
      p_project_id,
      'approved',
      coalesce(p_payload ->> 'title', 'Uploaded BOQ'),
      now(),
      auth.uid()
    )
    returning id into boq_id;
  else
    update public.boqs
    set title = coalesce(p_payload ->> 'title', title),
        status = 'approved',
        approved_at = now(),
        approved_by = auth.uid()
    where id = boq_id;
  end if;

  delete from public.schedule_nodes n
  using public.boq_phases p
  where n.boq_phase_id = p.id
    and p.boq_id = boq_id
    and p.code not in (
      select jsonb_array_elements(coalesce(p_payload -> 'phases', '[]'::jsonb)) ->> 'code'
    );

  delete from public.boq_phases
  where boq_id = boq_id
    and code not in (
      select jsonb_array_elements(coalesce(p_payload -> 'phases', '[]'::jsonb)) ->> 'code'
    );

  sort_i := 0;
  for phase in select * from jsonb_array_elements(p_payload -> 'phases')
  loop
    sort_i := sort_i + 1;
    select id into phase_id
    from public.boq_phases
    where boq_id = boq_id and code = phase ->> 'code';

    if phase_id is null then
      insert into public.boq_phases (boq_id, code, name, color_token, sort_order)
      values (
        boq_id,
        phase ->> 'code',
        phase ->> 'name',
        coalesce(phase ->> 'color_token', 'a'),
        coalesce((phase ->> 'sort_order')::int, sort_i)
      )
      returning id into phase_id;
    else
      update public.boq_phases
      set name = phase ->> 'name',
          color_token = coalesce(phase ->> 'color_token', color_token),
          sort_order = coalesce((phase ->> 'sort_order')::int, sort_order)
      where id = phase_id;
    end if;

    delete from public.boq_lines where public.boq_lines.phase_id = phase_id;
    line_i := 0;
    for line in select * from jsonb_array_elements(coalesce(phase -> 'lines', '[]'::jsonb))
    loop
      line_i := line_i + 1;
      insert into public.boq_lines (
        phase_id, item_code, description, unit, quantity, rate, amount, sort_order
      ) values (
        phase_id,
        coalesce(line ->> 'item_code', ''),
        coalesce(line ->> 'description', ''),
        coalesce(line ->> 'unit', ''),
        coalesce((line ->> 'quantity')::numeric, 0),
        coalesce((line ->> 'rate')::numeric, 0),
        coalesce(
          nullif(line ->> 'amount', '')::numeric,
          coalesce((line ->> 'quantity')::numeric, 0) * coalesce((line ->> 'rate')::numeric, 0)
        ),
        coalesce((line ->> 'sort_order')::int, line_i)
      );
    end loop;
  end loop;

  perform public.sync_phase_roots(p_project_id);
  return boq_id;
end;
$$;

grant execute on function public.sync_phase_roots(uuid) to authenticated;
grant execute on function public.replace_boq(uuid, jsonb) to authenticated;
grant execute on function public.ph_holiday_exceptions(int) to authenticated;
