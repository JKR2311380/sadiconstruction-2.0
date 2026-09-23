-- Add project budget so Overview can show the approved-BOQ envelope.

alter table public.projects
  add column if not exists budget numeric(14, 2);
