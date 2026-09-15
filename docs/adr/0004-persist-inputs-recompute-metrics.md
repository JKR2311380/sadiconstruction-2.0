# ADR 0004 — Persist network inputs; recompute metrics

Exported Critical / slack fields from desktop tools are snapshots. AACE-oriented Longest Path and calendar math must run under our rules (Retained Logic, one Project Calendar). We persist structure (nodes, durations, dependencies, calendar) and recompute ES/EF/LS/LF, float, and criticality in the CPM Engine. Optional cache columns may speed first paint but are invalidated by `metrics_at` / recalc.

**Considered:** Trusting stored critical flags; server-only recalc.

**Consequences:** UI must always be able to recalc from inputs; cache can drift if writes skip the engine — treat cache as disposable.
