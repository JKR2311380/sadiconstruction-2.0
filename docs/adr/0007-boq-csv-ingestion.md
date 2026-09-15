# ADR 0007 — Admin CSV is how BOQ enters

Scheduling needs approved BOQ Phases. Beyond demo seed, Admin replaces a Project BOQ via **CSV** (phase + line columns). QS teams already live in spreadsheets; a line-item form does not scale; named ERP integrations wait until a source exists. After a successful parse, Phase Root sync runs; the UI stays view-only for everyone else (PRD).

**Considered:** SQL-only forever; manual forms; a future integration as the v1 path.

**Consequences:** CSV schema is a versioned contract (document it next to the parser). Bad files fail closed — they do not partial-write Phase Roots.
