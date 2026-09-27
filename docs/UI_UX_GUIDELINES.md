# UI / UX guidelines — living

> Operate-mode product UI. Tokens and component character live in
> [`DESIGN.md`](../DESIGN.md). This file is how to *apply* that world on new
> screens without fossilizing pixels.

## Mode

Authenticated surfaces are **Operate**: the planner finishes a network; the
PM reads risk. Scanability beats decoration. The public landing is a
different surface (Persuade) — do not copy its hero type scale or motion
into the shell.

## Inherit, don't reinvent

When adding a screen:

1. Reuse shell, tabs, table, dialog, and button variants already in
   `src/components/ui/*`. Do not write a new one-off CSS class for something
   a shadcn primitive already covers.
2. Color through semantic tokens (`bg-background`, `text-primary`,
   `bg-destructive`, `border-border`/`border-input`) — never a hardcoded hex.
   `DESIGN.md` maps them to the neutral ground + single blue accent.
3. Depth is `border` + `shadow-sm/md/lg` from the shared scale. Don't
   reintroduce the retired `.neu-*`/`shadow-neu-*` classes — if you find one
   still in a file under `src/features/`, that file hasn't been migrated yet
   (currently only `src/features/auth/`).
4. Radius comes from the 4/8/12/16 scale (`rounded-sm…rounded-2xl`). Don't
   invent a new radius value inline unless you're building one of the
   documented bespoke diagram exceptions in `DESIGN.md`.
5. Project/section titles use the display face (Geist Sans); data, labels,
   and buttons use Inter. Tabular nums (Geist Mono, `font-readout`) on every
   schedule/BOQ numeric.

If a new pattern is needed, add it once in `src/components/ui/` and point
here in a sentence. Do not fork a second button/card/table language.

## Information density

- Directory, BOQ, and Scheduling are **tables**, not card grids of icon +
  heading + text.
- Empty, cycle, recalculating, and valid are visible states (see Siteflow).
  Prefer the shared `Empty`/`Alert` components with teaching copy over a
  blank table.
- Motion: ~150ms on hover/focus and state change only. No page-load
  choreography in the app shell — that's landing-only.

## Copy

Use glossary words from `CONTEXT.md`: Staff Member, Access Request, Phase
Root, Leaf Activity, Cycle Error, Longest Path. Controls name the action
("Add activity", "Fix network"). Synthetic data is labeled as such.

## Access

Gate **actions** with `can(capability)` (ADR 0005). Hidden controls for
roles that cannot act; still show the view if the role can view. Do not
hide Scheduling from a viewer.

## Responsive

Desktop is the primary scheduling workstation. Below ~960px: stack the split
view (tree above Gantt), collapse the nav to a sheet (already wired in
`AppShell`). Do not fluid-scale headings in the app chrome — that's a
landing-only technique (`display-xl`/`display-lg` fluid clamps).

## Pivot

Token values live in `src/index.css` (`:root`/`.dark`) and `DESIGN.md`
together — change both when the palette moves. Layout recipes here stay
valid regardless of which hex the accent resolves to. Dark mode is a
Settings toggle using the same semantic tokens, not a second component set.

## Provenance

Full rationale for the professional-unification pass: `DESIGN-DIRECTION.md`
(historical) and tracking issue [#2](https://github.com/JKR2311380/sadiconstruction-2.0/issues/2).
New authenticated routes extend the world documented in `DESIGN.md`; they do
not run a replacement identity.
