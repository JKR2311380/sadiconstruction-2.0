# ADR 0012 — Open Sign-up, two Roles (Admin + Planner)

**Status:** accepted. Supersedes ADR 0002 (Access Request screening), ADR 0005 (four-role matrix), and ADR 0006 (admin-only bootstrap / no self Sign-up). Single-org tenancy from ADR 0002 is restated here, not dropped.

The working app is not production. Anyone may Sign-up with email and password (no verification, no Access Request). New Staff Members are Planners. Roles are only `admin` and `planner`. Planner has the full product (projects, BOQ CSV replace, schedule, documents, personnel). Admin has the same plus changing Staff Member Roles. Seed one Admin and one Planner after migrate so demos have known credentials. Every signed-in Staff Member sees every Project (single-org; no `organizations` / multi-tenant membership).

**Considered:** Access Request screening; four roles (Admin / Planner / Project Manager / Viewer); open Sign-up with honor-system role pick; Planner-only with no Admin.

**Consequences:** Self-promotion to Admin is possible only if an existing Admin promotes them (or seed is abused). Multi-company tenancy remains a conscious reboot. Matrix and RLS live in [`OPEN-DECISIONS.md`](../OPEN-DECISIONS.md) D1.
