# Design system — Sadiconstruction

> Documents what actually shipped from the professional-unification pass
> (tracking issue [#2](https://github.com/JKR2311380/sadiconstruction-2.0/issues/2),
> Batches 1–4). This file — together with [`docs/UI_UX_GUIDELINES.md`](docs/UI_UX_GUIDELINES.md)
> for how to apply it — is the source of truth going forward, replacing
> `DESIGN-DIRECTION.md` (kept in repo history as the design rationale, not as
> a living doc) and the deleted `design-system.md` (documented a pre-Site Mark
> landing that no longer exists).

## World

One system, two volumes. Landing (Persuade) and the authenticated app
(Operate) share the same type system, color system, radius scale, and shadow
scale — Persuade is louder (bigger display type, motion, the CPM hero scene),
Operate is quieter (density, scanability, ~150ms hover/focus motion only).
Neither reads as a separate brand.

Depth comes from real elevation: a 1px border plus a soft, offset shadow.
There is no neumorphic double-shadow "pillowing" and no brutalist hard-ink
strokes anywhere in the shipped surfaces.

## Typography

| Role | Family | Weights | Usage |
|---|---|---|---|
| Display / heading | **Geist Sans** | 500–700 | H1–H3, section heads, card/panel titles, nav brand |
| Body / UI | **Inter** | 400–600 | paragraphs, buttons, form controls, nav, table cells |
| Numeric / data readout | **Geist Mono** | 400–500, tabular nums | schedule dates, ES/EF/LS/LF, durations, float, currency, codes |

Loaded via `@fontsource/*` in `src/index.css`; exposed as `--font-heading`,
`--font-sans`, `--font-readout`. No condensed or display-novelty faces
anywhere. Letter-spacing at or near 0.

## Color, radius, shadow

Single semantic token set in `src/index.css` (`@theme inline` + `:root`/`.dark`),
consumed by both surfaces — there is no parallel `--sm-*` palette; the
landing's own custom properties in `sitemark.css` are additive scoping
(`--sm-*` names) that resolve to the *same* hex values as the app tokens
(e.g. `--sm-accent: #2563eb` == `--primary`), not a second palette.

- **Ground**: `--background`/`--foreground` — near-white / near-black, not the
  old warm clay or concrete-grey.
- **Accent**: one blue (`--primary: #2563eb` light / `#60a5fa` dark), used for
  the primary action and the critical-path signal. The old terracotta,
  lime, and unshipped orange accents are gone.
- **Radius**: one scale — `--radius-sm/md/lg/xl` = `4px/8px/12px/16px`,
  mapped through Tailwind's `rounded-sm…rounded-2xl` utilities (`rounded-2xl`
  = 16px = `--radius-xl`). `--radius` (= `--radius-md`) exists only to back a
  couple of `calc(var(--radius) − Npx)` uses in `input-group.jsx`.
  **Documented exception**: a handful of bespoke landing diagrams — the
  Engine diagram, ProofGraph, and ProductDemos' inner per-module chrome —
  intentionally keep sharper 1–2px radii as part of their
  blueprint/instrument-panel character (`sitemark.css`, DESIGN-DIRECTION.md
  §7.3–7.5). This is a live open question tracked on issue #12, not an
  oversight.
- **Shadow**: one ramp, `--shadow-sm/md/lg`, a soft drop shadow + 1px border —
  no inset/outset double-shadow system. The old `--shadow-neu-*` custom
  properties and `.neu-*` utility classes are gone from every shared
  `src/components/ui/*` primitive and from `shell`, `scheduling`, `boq`,
  `projects`, `documents`, and `settings`. (`src/features/auth/` has not been
  migrated yet — out of scope for Batch 4, tracked separately.)
- **Status / phase colors** (`--status-*`, `--phase-*`) stay conceptually the
  same, retuned to sit inside the neutral+accent palette.

## Component foundation

`src/components/ui/*` (shadcn) is the only place buttons, inputs, dialogs,
tabs, cards, and tables live for the app. Every primitive there now renders
with `border` + `shadow-sm/md/lg` instead of the retired neumorphic classes.
Building a new screen means composing these, not writing new one-off CSS.

## Motion

One job per library (unchanged from DESIGN-DIRECTION.md §6):

- **Framer Motion** — React-state-driven UI motion (enter/exit, tab swaps,
  hover/tap feedback).
- **GSAP** (`@gsap/react`'s `useGSAP`) — timeline/scroll-driven sequences: the
  hero build-phases choreography, scroll-triggered reveals, the Roles figure
  pose tweening.
- **ReactBits** — pre-built micro-interactions used as-is or lightly themed.
- Everything resolves to the resting frame under `prefers-reduced-motion`.
  The app shell keeps a ~150ms hover/focus-only ceiling; only the landing
  gets expressive motion.

## Mark — the Spine S

The brand mark is a finish-to-start link drawn as an **S**: a start node,
right-angle turns like the engine diagram's dependency arrows, and the
handover ring at the end. The initial and the critical path in one shape.
It lives in `src/components/brand/SpineIcon.tsx` (+ `spine-mark.css`); use
the component, never a copied SVG.

- **Geometry** (64u tile, `rx` 14): path `M48 16 H16 V32 H48 V48 H22`,
  6u stroke, start node ⌀10u at (48,16), handover ring ⌀12u / 3u stroke at
  (16,48). Clear space = one 16u margin.
- **Variants** (`variant`): `blue` (default: app icon, favicon, shell),
  `ink`, `ground`, `navy`, `white` (on a blue field). Mark colors are fixed
  brand hexes, not theme tokens, so it reads the same in light and dark.
- **Optical size**: at ≤20px the ring closes to a solid dot
  (`public/favicon.svg` is that version). `public/apple-touch-icon.png` is
  full-bleed because iOS applies its own corner mask.
- **Lockup**: icon + "Sadiconstruction" in Geist Sans (700 on the landing
  hero, 600 in the shell), optional "SADICON MANAGEMENT" descriptor in
  Geist Mono. Float Amber never appears in the mark.
- **Dynamic states** (`motion`), all CSS, all resolving to the static mark
  under `prefers-reduced-motion`:
  - `reveal`: landing hero only. Tile 0–320ms, start node 120ms, path draws
    220–840ms (`--sm-ease-swap`), ring lands 800ms with one ripple. The
    wordmark rises from 560ms at 24ms per letter (`--sm-ease-enter`) and the
    hero copy follows from 1.0s. The R3F scene mounts after the reveal
    (`BuildPhases` `SCENE_DELAY_MS`) so WebGL setup can't stall it.
  - `loading`: path draws on and erases. Used by `WorkspaceSkeleton`.
  - `recalculating`: pulse runs start → handover over a faded path.
  - `handover`: the end node pings (valid schedule).
- Concept board (static + dynamic, alternates B/C rejected):
  <https://claude.ai/artifact/G8y2q4esfUzgDLK4wDLFie>

## Landing — Site Mark (`/`)

Mode: **Persuade**. Lives in `src/features/landing/sitemark/`
(`LandingPage.tsx` renders only this world — the earlier "Acoustic-Tech"
landing, `design-system.md`, and its component tree/`acoustic.css` have been
deleted as dead code).

`sitemark.css`, scoped to `.sm-root`, layers Site Mark-specific tokens
(`--sm-bg`, `--sm-surface`, `--sm-ink`, `--sm-mute`, `--sm-line`,
`--sm-concrete(-deep)`, `--sm-steel(-soft)`, `--sm-navy`, `--sm-amber`,
`--sm-accent`) and easing curves (`--sm-ease-enter`/`--sm-ease-swap`) on top
of the shared type/radius/shadow system — not a competing palette. The
former `--sm-mark` lime "critical spine" accent has been fully retired;
`--sm-accent` (`#2563eb`, same value as `--primary`) is the only accent left
in this file.

Shell components (`ProductDemos`, `RolesToggle`/`Mascot`, section headers,
buttons/tabs) are shadcn + Framer Motion/GSAP per §6. The remaining bespoke
pieces — the Engine diagram's CPM SVG, ProofGraph's chart track/bars, and
ProductDemos' inner GSAP-timeline markup — stay as purpose-built
`sitemark.css` classes by design (see the radius exception above); full
deletion of `sitemark.css` is tracked on issue #12, not assumed by this
document.

The hero keeps its GSAP-driven `BuildPhases` R3F scene (`hero/`) — the one
place 3-D earns its seat. The Roles figure is a plain HTML/CSS `Mascot` SVG,
GSAP-tweened; the earlier Kenney 3-D worker model was removed.

## Provenance

- Full rationale and before/after for every batch: `DESIGN-DIRECTION.md`
  (historical — not updated further; this file and
  `docs/UI_UX_GUIDELINES.md` are the living docs now)
- Tracking issue: [#2](https://github.com/JKR2311380/sadiconstruction-2.0/issues/2), sub-issues #3–#19
- Open item: issue #12 (residual `sitemark.css`, ~1300 lines of intentionally
  bespoke diagram/chart CSS)
- Product truth: `PRODUCT.md`, `docs/PRD.md`, `docs/Siteflow.md`, `docs/Userflow.md`
