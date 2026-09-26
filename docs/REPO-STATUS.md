# Repo status — what exists in code today

> Last reviewed: 2026-09-19.

Vite + React 19 shell with working-app auth (Sign-up / Sign-in; Admin | Planner) and `src/data` adapters for projects, BOQ, schedule, documents, and personnel. Mock session + localStorage workspace when `VITE_SUPABASE_*` is unset. CPM Engine is TypeScript under `src/features/scheduling/engine`.

`supabase/migrations`: profiles, projects, BOQ, calendars, schedule_nodes, dependencies, documents + Storage bucket `project-documents`, project_personnel + RLS. `supabase/seed.sql` seeds Admin + Planner.

Nav: Projects + Settings. Access Request / Reports / Contractors are out.
