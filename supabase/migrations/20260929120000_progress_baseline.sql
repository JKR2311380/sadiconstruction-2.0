-- Schedule progress (per leaf) and a single saved baseline per project.

alter table public.schedule_nodes
  add column if not exists progress_pct numeric not null default 0
  check (progress_pct >= 0 and progress_pct <= 100);

create table if not exists public.schedule_baselines (
  project_id uuid primary key references public.projects (id) on delete cascade,
  captured_at timestamptz not null default now(),
  project_duration_days numeric not null default 0,
  nodes jsonb not null default '{}'::jsonb
);

alter table public.schedule_baselines enable row level security;

drop policy if exists "staff crud schedule_baselines" on public.schedule_baselines;
create policy "staff crud schedule_baselines"
  on public.schedule_baselines for all to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

grant select, insert, update, delete on public.schedule_baselines to authenticated;
