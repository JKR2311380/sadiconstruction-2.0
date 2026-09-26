-- Pin search_path on public functions flagged by db advisors (lint 0011).

alter function public.set_updated_at() set search_path = public;
alter function public.next_project_code(int) set search_path = public;
alter function public.easter_sunday(int) set search_path = public;
alter function public.ph_holiday_exceptions(int) set search_path = public;
alter function public.sync_phase_roots(uuid) set search_path = public;
alter function public.replace_boq(uuid, jsonb) set search_path = public;
