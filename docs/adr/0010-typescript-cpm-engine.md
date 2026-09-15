# ADR 0010 — TypeScript for the CPM Engine only

The engine is a pure module with a small public seam (`recalculate`). Wrong types here produce silent date/float bugs. We write `src/features/scheduling/engine` in **TypeScript** and leave the Vite React UI in JSX until a migrate-on-touch epic. Vite + `allowJs` makes the hybrid cheap; a full-app TS prerequisite would block the prototype.

**Considered:** JS everywhere; TS as a repo-wide epic first.

**Consequences:** `tsconfig` is strict for `.ts`, tolerant of `.js`. Callers import the engine seam, not internal files. Expanding TS is allowed file-by-file; it is not required to ship a screen.
