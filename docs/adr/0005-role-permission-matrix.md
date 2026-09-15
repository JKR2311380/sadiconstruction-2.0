# ADR 0005 — Four roles, capability matrix

Internal staff are not job-title soup: `admin`, `planner`, `project_manager`, `viewer` on `profiles.role`. Mutations follow the matrix in [`OPEN-DECISIONS.md`](../OPEN-DECISIONS.md) D1 (admin all; planner projects+schedule+docs; PM view + document upload; viewer read-only). That matches how construction orgs separate schedule authorship from PM review without inventing per-project membership (ADR 0002).

**Considered:** collapsing planner+PM; per-project `project_members`.

**Consequences:** RLS helpers key off `profiles.role`. Adding a role is a new ADR plus matrix row; adding project-scoped ACLs is a conscious reboot of ADR 0002.
