# ADR 0002 — Single-org internal auth (not multi-tenant)

Sadiconstruction is an internal tool for one construction organization. We use Supabase Auth + a `profiles` row (`role`, `is_active`) and Access Requests for screening — not `organizations` / multi-tenant membership tables. That removes a class of RLS complexity and matches “not public SaaS” in the PRD while staying Free-tier simple.

**Considered:** Full org_members tenancy (correct for SaaS, overbuilt here).

**Consequences:** Multi-company / franchise later requires a migration; document that as a conscious reboot, not a silent assumption.
