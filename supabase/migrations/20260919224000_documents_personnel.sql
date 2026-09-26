-- T8.1 documents + private Storage bucket (≤50 MB). T9.1 project_personnel (free-text roster).
-- Soft-delete documents only (ADR 0011). Personnel rows are hard-deleted.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  storage_path text not null unique,
  content_type text,
  byte_size bigint not null default 0
    check (byte_size >= 0 and byte_size <= 52428800),
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists documents_project_id_idx on public.documents (project_id);

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

drop policy if exists "staff select documents" on public.documents;
create policy "staff select documents"
  on public.documents for select to authenticated
  using (public.is_active_staff());

drop policy if exists "staff insert documents" on public.documents;
create policy "staff insert documents"
  on public.documents for insert to authenticated
  with check (public.is_active_staff());

drop policy if exists "staff update documents" on public.documents;
create policy "staff update documents"
  on public.documents for update to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

grant select, insert, update on public.documents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('project-documents', 'project-documents', false, 52428800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "staff read project-documents" on storage.objects;
create policy "staff read project-documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'project-documents' and public.is_active_staff());

drop policy if exists "staff insert project-documents" on storage.objects;
create policy "staff insert project-documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'project-documents' and public.is_active_staff());

drop policy if exists "staff update project-documents" on storage.objects;
create policy "staff update project-documents"
  on storage.objects for update to authenticated
  using (bucket_id = 'project-documents' and public.is_active_staff())
  with check (bucket_id = 'project-documents' and public.is_active_staff());

drop policy if exists "staff delete project-documents" on storage.objects;
create policy "staff delete project-documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'project-documents' and public.is_active_staff());

create table if not exists public.project_personnel (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  staff_id uuid references public.profiles (id),
  name text not null,
  title text not null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_personnel_project_id_idx on public.project_personnel (project_id);

drop trigger if exists project_personnel_set_updated_at on public.project_personnel;
create trigger project_personnel_set_updated_at
  before update on public.project_personnel
  for each row execute function public.set_updated_at();

alter table public.project_personnel enable row level security;

drop policy if exists "staff select personnel" on public.project_personnel;
create policy "staff select personnel"
  on public.project_personnel for select to authenticated
  using (public.is_active_staff());

drop policy if exists "staff insert personnel" on public.project_personnel;
create policy "staff insert personnel"
  on public.project_personnel for insert to authenticated
  with check (public.is_active_staff());

drop policy if exists "staff update personnel" on public.project_personnel;
create policy "staff update personnel"
  on public.project_personnel for update to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

drop policy if exists "staff delete personnel" on public.project_personnel;
create policy "staff delete personnel"
  on public.project_personnel for delete to authenticated
  using (public.is_active_staff());

grant select, insert, update, delete on public.project_personnel to authenticated;
