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

## Provenance

- Mock HTML: `docs/mockups/scheduling-clearwater.html`
- Comp PNG: `docs/mockups/scheduling-hf-impeccable.png`
- Product truth: `PRODUCT.md`, `docs/PRD.md`, `docs/Siteflow.md`, `docs/Userflow.md`
