# UI / UX guidelines — living

> Operate-mode product UI. Tokens and component character live in [`DESIGN.md`](../DESIGN.md). This file is how to *apply* that world on new screens without fossilizing pixels.

## Mode

Authenticated surfaces are **Operate**: the planner finishes a network; the PM reads risk. Scanability beats decoration. The public landing is a different surface (Persuade) — do not copy its hero type scale into the shell.

## Inherit, don't reinvent

When adding a screen:

1. Reuse shell, tabs, table, dialog, and button variants already in the app.
2. Color through semantic tokens (`bg-sidebar`, `text-primary`, `bg-destructive`) — DESIGN maps them to orange / charcoal / paper.
3. Rectangular controls (`--radius: 0`). Active nav is a **2px orange left rail**, not a pill.
4. Project titles use the display face; data, labels, and buttons use Work Sans. Tabular nums on schedule metrics.

If a new pattern is needed, add it once and point here in a sentence. Do not fork a second button language.

## Information density

- Directory, BOQ, and Scheduling are **tables**, not card grids of icon + heading.
- Empty, cycle, recalculating, and valid are visible states (Siteflow). Prefer an `Alert` / empty teaching copy over a blank table.
- Motion: ~150ms on hover/focus and state change. No page-load choreography.

## Copy

Use glossary words from `CONTEXT.md`: Staff Member, Access Request, Phase Root, Leaf Activity, Cycle Error, Longest Path. Controls name the action (“Add activity”, “Fix network”). Synthetic data is labeled as such.

## Access

Gate **actions** with `can(capability)` (ADR 0005). Hidden controls for roles that cannot act; still show the view if the role can view. Do not hide Scheduling from a viewer.

## Responsive

Desktop is the primary scheduling workstation. Below ~960px: stack the split view (tree above Gantt), collapse the charcoal nav to a sheet. Do not fluid-scale headings in the app chrome.

## Pivot

Brand hex values may move in `DESIGN.md` and `src/index.css` together. Layout recipes here stay valid if orange becomes another accent. Dark mode is a Settings toggle using the same semantic tokens — not a second component set.

## Provenance

Incumbent world: landing + `docs/mockups/scheduling-clearwater.html`. New authenticated routes extend that world; they do not run a replacement identity.
