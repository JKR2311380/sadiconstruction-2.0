# Design system — Sadiconstruction (authenticated / Scheduling)

> Documented from the high-fidelity Scheduling mockup (`docs/mockups/scheduling-clearwater.html`) and incumbent landing brand. Mode: **Operate**.

## World

Restrained construction PM shell: charcoal navigation, paper content canvas, single orange accent for selection and primary emphasis. Rectangular controls. Density for scanable schedule work — not marketing chrome.

## Palette

| Token | Value | Role |
|-------|-------|------|
| Orange | `#FF6E00` | Accent, active tab, selection rail, Active pill |
| Orange soft | `#FFF0E6` | Soft accent fill |
| Ink | `#111111` | Primary text |
| Shell | `#181C20` | Sidebar / primary button |
| Canvas | `#F3F2EF` | App ground behind panels |
| Panel | `#FFFFFF` | Content surfaces |
| Line | `#DCE0E5` | Hairlines |
| Muted | `#5A6570` | Secondary labels |
| Phase A | `#3A556C` | Preliminaries |
| Phase B | `#2A6B5A` | Site works |
| Phase C | `#9A6B22` | Concrete |
| Critical | `#B71C1C` / `#FDECEC` | Longest Path text / row wash |

## Typography

- **Brand / project title:** DM Serif Display
- **UI / data:** Work Sans (400–700), tabular nums on schedule metrics
- Scale: compact Operate (≈13px body, 10px column headers, 22px project title)

## Components

- Sidebar nav: 2px orange left rail on active; no pills
- Tabs: underline selection, not filled chips
- Buttons: `border-radius: 0`; primary = shell fill; secondary = white + hairline
- Phase roots: locked tag + muted row wash
- Critical rows: pale red wash + inset red Gantt bars
- LOE: hashed bar, excluded from critical column

## Motion

150ms ease on hover/focus only. No page-load choreography.

## Landing — Site Mark (`/`)

Mode: **Persuade**. Lives in `src/features/landing/sitemark/` (tokens in `sitemark.css`, scoped to `.sm-root`). Authenticated screens have not moved to this world yet.

| Token | Value | Role |
|-------|-------|------|
| `--sm-bg` | `#EEF1F0` | Page ground |
| `--sm-surface` | `#E2E7E5` | Hero plane, Proof band, figure panel |
| `--sm-ink` | `#0E1210` | Text, rules, controls, Close ground |
| `--sm-mark` | `#D4FF4A` | Critical spine only; cased in ink on light grounds |
| `--sm-mute` | `#4E5653` | Secondary text (≥4.5:1 on bg and surface) |
| `--sm-line` | `#C3CBC8` | Hairlines |

- **Type:** Syne 600–800 (wordmark, headings), Manrope 400–800 (body, UI), IBM Plex Mono (codes, day figures, ES/EF/LS/LF).
- **Controls:** 2px ink border, 2px radius; primary = ink fill. Hover adds an inset ring (weight, not glow). Segmented toggles, never pills.
- **Motion:** `--sm-ease-enter` `cubic-bezier(0.16,1,0.3,1)` for entrances; `--sm-ease-swap` `cubic-bezier(0.65,0,0.35,1)` for state swaps. Hero phases hold 3.6s with 0.8s expo camera cuts; Product demos are 1.2–2.0s GSAP timelines with 450ms crossfades; Engine plays once on scroll (Replay available); Roles morph 300ms then content 200ms. `prefers-reduced-motion` shows resting frames: Fit-out, final demo frame, labeled diagram, instant role swap.
- **Critical representation:** ink bar with a lime core; float = hollow ink outline plus dashed tail.

## Provenance

- Mock HTML: `docs/mockups/scheduling-clearwater.html`
- Comp PNG: `docs/mockups/scheduling-hf-impeccable.png`
- Product truth: `PRODUCT.md`, `docs/PRD.md`, `docs/Siteflow.md`, `docs/Userflow.md`
