# ADR 0011 — Soft-delete projects/docs; hard-delete schedule graph

Projects and Documents get `deleted_at` so an accidental archive is recoverable. Schedule Nodes and Dependencies are **hard-deleted** (cascade edges) because CPM must walk a live DAG: tombstoned predecessors are a known cause of cycle/FK inconsistency in schedule products. Soft-deleted rows still count against Free DB, so a periodic purge script is part of the ops story, not a product feature.

**Considered:** soft-delete everywhere; hard-delete everything in v1.

**Consequences:** engine and adapters never filter `deleted_at` on nodes — gone means gone. Restoring a Project does not resurrect discarded activities; those must be re-authored or loaded from a baseline (post-foundation).
