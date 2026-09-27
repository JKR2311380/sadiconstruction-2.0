# Design direction — professional unification (landing + app)

> Supersedes the brutalist-industrial voice of `sitemark.css` and the undocumented
> neumorphic drift in `src/index.css`. This file is the standing brief for every
> visual change from here forward, on both surfaces. `DESIGN.md` and
> `docs/UI_UX_GUIDELINES.md` get rewritten to match once each surface below is
> shipped — until then, this file wins on conflict. `design-system.md` (root) is
> dead; it documents a landing that no longer exists and should be deleted once
> this lands.

## 0. How to work this plan (read this first if you're picking it up cold)

This plan is filed as GitHub issues in `JKR2311380/sadiconstruction-2.0`:
parent tracking issue **#2**, with 17 sub-issues (**#3–#19**) grouped into the
five batches below. If you are starting a session from this file — whether
pasted in or read from the repo — **do exactly one batch per session, then
stop**, unless the person explicitly asks you to keep going into the next
batch. Do not silently do all five batches in one pass; each is meant to be a
reviewable, shippable slice.

**Per-batch procedure:**

1. Run `gh issue view <parent-or-batch-number> --repo JKR2311380/sadiconstruction-2.0`
   (or `gh issue list --repo JKR2311380/sadiconstruction-2.0 --search "Batch" --state open`)
   to see which batch issues are still open — that tells you where the plan
   left off. Don't assume Batch 1 is unstarted just because this file starts there.
2. Work the issues in the next open batch, in the order they're listed in §9.
   Each issue's body has the exact scope, file paths, and estimate.
3. When an issue's work is done and verified (see §10's checklist), close it:
   `gh issue close <n> --repo JKR2311380/sadiconstruction-2.0 --comment "<what shipped>"`.
4. After closing every issue in a batch, stop and report back — don't roll
   into the next batch automatically. Batches 3.5 and 4.2–4.6 have hard
   dependencies noted in their issue bodies; respect those even within a batch.
5. Once Batch 5 (#19) is closed, this file is done: `DESIGN.md` and
   `docs/UI_UX_GUIDELINES.md` should already have been rewritten by that issue's
   work, and this file's job (§9's "source of truth until then") is over —
   don't keep treating it as authoritative after that.

| Batch | Issues | What it covers |
|---|---|---|
| 1 — Foundation tokens | #3, #4, #5 | Fonts + color/radius/shadow tokens. Blocks everything else. |
| 2 — Landing hero + Roles | #6, #7 | Hero copy, Roles/Mascot restyle. |
| 3 — Remaining landing sections | #8, #9, #10, #11, #12 | Product demos, Engine diagram, Proof graph, Close/footer, then delete `sitemark.css`. |
| 4 — App / Operate mode | #13, #14, #15, #16, #17, #18 | Shell nav first, then Scheduling, BOQ, Projects, Documents, Settings. |
| 5 — Docs cleanup | #19 | Delete stale `design-system.md`; rewrite `DESIGN.md` + `docs/UI_UX_GUIDELINES.md`. |

## 1. The problem this fixes

Three unrelated visual languages exist in the codebase today, and none of them
read as a professional PM product:

1. **Landing (`src/features/landing/sitemark/sitemark.css`, class `.sm-root`)** —
   deliberately brutalist: 2px hard ink borders, 2px corner radius, an SVG
   turbulence grain texture over the hero, a lime (`#D4FF4A`) "critical spine"
   accent, condensed/mono type (Syne, Manrope, IBM Plex Mono). This was an
   intentional industrial-construction-site aesthetic. It now reads as
   unfinished/raw rather than confident — sharp corners and thick ink strokes
   everywhere, no depth, no restraint in the mono/grain usage.
2. **App shell / authenticated product (`src/index.css`, shadcn tokens)** — a
   warm neumorphic system: soft clay background (`#e4dfd4`), terracotta primary
   (`#b85a32`), large radii (`1.15rem`+), inset/outset soft shadows
   (`--shadow-neu-*`). Friendly, but soft-UI shadows read as consumer/lifestyle,
   not as a scheduling instrument used by planners and PMs staring at Gantt
   charts and CPM math all day. It also does not match `DESIGN.md`'s own
   documented "Operate" palette (orange/charcoal/paper, radius 0), which was
   never actually implemented — the docs and the code have diverged.
3. **`design-system.md`** — documents a third, older "Acoustic-Tech" landing
   (espresso/amber/glassmorphism) that was already replaced by Site Mark. It is
   stale and should not be consulted.

None of these three is wrong to delete. The fix is one language, applied to
both surfaces, built on primitives the repo already ships
(shadcn, Framer Motion, GSAP) plus ReactBits for the polish layer, instead of
hand-rolled CSS custom-property systems per surface.

## 2. Non-negotiables

- **One type system, one color system, one radius scale, one shadow scale.**
  Landing and app read as the same product at different volumes (Persuade is
  louder, Operate is quieter), never as two brands.
- **Professional over decorative.** No grain textures, no neon/lime accents,
  no novelty condensed display faces. Depth comes from real elevation
  (subtle shadow + 1px border), not from soft-UI double-shadow "pillowing" or
  brutalist hard ink strokes.
- **Corners are one restrained scale**, not "0 in one system, 2px in another,
  1.15rem in the third." See §4.
- **Motion has a job per library** (§6) — not "whatever was fastest to reach
  for when that section was built."
- **Every new/changed piece of UI is built from shadcn primitives first.**
  Custom one-off CSS classes (the `sm-*` BEM system) are the thing being
  retired, not extended.
- Accessibility floor is unchanged: WCAG AA contrast, visible focus rings,
  `prefers-reduced-motion` honored everywhere motion is added.

## 3. Typography system

Retire: Syne, IBM Plex Mono, Big Shoulders Condensed, DM Serif Display
(display faces currently spread across landing/app/legacy docs — four display
identities is the core symptom of "no unified typography").

Adopt a two-family system, professional SaaS/fintech register (think Linear,
Vercel, Ramp — not a marketing brochure, not a construction-site sign):

| Role | Family | Weights | Usage |
|---|---|---|---|
| Display / heading | **"Geist"** (or "General Sans" if Geist licensing is a blocker) | 500–700 | H1–H3, hero mark, section heads, nav brand |
| Body / UI | **"Inter"** | 400–600 | paragraphs, buttons, form controls, nav, table cells |
| Numeric / data readout | **"Geist Mono"** (or keep "Azeret Mono" — already loaded, reads fine as the one surviving mono) | 400–500, tabular-nums | schedule dates, ES/EF/LS/LF, durations, floats, currency |

Rationale: Geist + Geist Mono are a matched family (Vercel's), free, self-hostable,
and immediately read as "modern product," which directly answers "lean away
from brutalist." Inter is the safest, most legible body face for dense
scheduling tables. Keeping one mono (Geist Mono or Azeret Mono — pick one, not
both) removes the IBM Plex Mono vs. Azeret Mono duplication that exists today.

**Type scale** (apply via Tailwind `theme.extend.fontSize`, not ad hoc
`clamp()` per component):

| Token | Size / line-height | Weight | Where |
|---|---|---|---|
| `display-xl` | 56–72px fluid / 1.05 | 600 | landing hero H1 only |
| `display-lg` | 40px / 1.1 | 600 | section heads |
| `display-md` | 28px / 1.2 | 600 | card/panel titles, project title in app |
| `body-lg` | 18px / 1.6 | 400 | hero lede, empty-state copy |
| `body` | 15px / 1.6 | 400 | default paragraph, nav |
| `body-sm` | 13px / 1.5 | 500 | table headers, badges, meta |
| `mono` | 13px / 1.5 | 400–500, tabular-nums | all schedule/BOQ numerics |

Letter-spacing stays at or near 0 (`-0.01em` on display sizes at most). No
condensed faces anywhere — condensed type is the single biggest "industrial
signage" tell in the current hero.

## 4. Color, surface, radius, shadow

One semantic token set, one light/dark pair, used by both surfaces — extend
the existing shadcn tokens in `src/index.css` rather than inventing a second
`--sm-*` set:

- **Neutral ground**: near-white/near-black, not the current warm clay
  (`#e4dfd4`) or concrete-grey (`#eef1f0`). A cool, slightly desaturated
  neutral (e.g. `oklch` scale from `#FAFAFA` → `#0A0A0B`) reads as instrument-
  grade, not lifestyle or industrial.
- **One accent**, used sparingly for the primary action and the "critical
  path" signal in scheduling views. Pick one and retire the other three
  competing accents currently in the codebase (`--primary: #b85a32` terracotta,
  `--sm-mark: #D4FF4A` lime, `Orange #FF6E00` from the unshipped `DESIGN.md`
  Operate spec). A controlled blue or amber in the 500–600 range reads as
  professional PM tooling (think status/priority chips in Linear/Height/
  Monday) without construction-site novelty.
- **Radius**: one scale, `4px / 8px / 12px / 16px`, mapped to shadcn's
  `--radius-sm/md/lg/xl`. Delete the neumorphic `1.15rem`+ radii and the
  brutalist `2px` radii both.
- **Shadow**: one small elevation ramp (`shadow-sm/md/lg` — a single soft
  drop shadow + 1px border, à la shadcn defaults), not the six-token
  `--shadow-neu-*` double-shadow system. Delete `--shadow-neu-*` entirely once
  every consumer (`neu-out`, `neu-in`, `neu-press`, `neu-flat` classes) is
  migrated to a shadcn `Card`/`Button` variant.
- Status colors (`--status-planning/active/delayed/on-hold/completed`) and
  phase colors (`--phase-a/b/c`) stay conceptually — retune their exact hex to
  sit inside the new neutral+accent palette instead of the current
  terracotta-tinted set.

## 5. Component foundation

- **shadcn is the base layer for every control.** `src/components/ui/*` is the
  only place buttons, inputs, dialogs, tabs, cards, tables live. The landing's
  `.sm-btn`, `.sm-actions`, segmented-toggle CSS get replaced by shadcn
  `Button`/`Tabs` variants themed with the new tokens, not parallel markup.
- **ReactBits supplies the polish layer shadcn doesn't cover**: animated text
  (hero headline reveal), animated backgrounds/gradients (hero backdrop,
  in place of the SVG grain texture), spotlight/hover-card effects for the
  product-demo tiles, and marquee/ticker components if a logo/stat strip is
  ever added. Install per-component via the ReactBits registry through the
  shadcn CLI that's already in this repo (`npx shadcn@latest add
  https://reactbits.dev/r/<ComponentName>`), landing in `src/components/ui/`
  or a new `src/components/reactbits/` folder — never as a blanket npm
  dependency, since ReactBits ships as copy-in source, not a package.
- Keep `@react-three/fiber` / `three` only where 3-D genuinely earns its seat
  (the CPM building-phases hero scene). Do not reach for R3F for anything a
  2-D ReactBits/CSS treatment can do — that was the original overreach that
  produced the now-removed Kenney worker model for the Planner/PM toggle.

## 6. Motion — one job per library

- **Framer Motion**: React-state-driven UI motion — route/section enter
  transitions, tab/panel swaps (`AnimatePresence`), hover/tap micro-feedback
  on cards and buttons, list reordering. Anything that animates *because
  React state changed*.
- **GSAP (+ `@gsap/react`'s `useGSAP`)**: timeline/scroll-driven sequences —
  the hero build-phases choreography, scroll-triggered reveals, the
  Planner/PM `Mascot` SVG pose tweening. Anything that's a *timeline*, not a
  state transition.
- **ReactBits motion components**: pre-built micro-interactions (text
  scramble/reveal, magnetic buttons, animated borders, gradient meshes) used
  as-is or lightly themed — not reimplemented by hand in GSAP/Framer when a
  ReactBits component already does the job.
- Global rule carried over unchanged: everything above resolves to the
  resting frame under `prefers-reduced-motion`, and the app shell keeps the
  existing ~150ms hover/focus-only ceiling — Operate mode stays quiet even
  after this pass; only the landing gets expressive motion.

## 7. Section-by-section plan — landing (`src/features/landing/sitemark/`)

Work through `LandingPage.tsx`'s sections top to bottom; each becomes a
shadcn+Framer Motion(+GSAP for sequences)+ReactBits rebuild, replacing the
matching block of `sitemark.css`:

1. **Hero** (`sm-hero`) — keep the GSAP-driven `BuildPhases` 3-D sequence;
   rebuild the copy column with the new type scale, drop the `clip-path`
   ink-reveal mark animation in favor of a ReactBits text-reveal component,
   drop the grain background.
2. **Product demos** (`ProductDemos.tsx`) — shadcn `Card` + `Tabs`, Framer
   Motion for the crossfade between demo states, keep GSAP only for any
   in-canvas timeline the demo itself drives.
3. **Engine diagram** (`EngineDiagram.tsx`) — keep the CPM-pass diagram logic;
   restyle the SVG/markup with the new tokens, GSAP for the once-on-scroll
   reveal (per existing `DESIGN.md` motion note).
4. **Roles toggle** (`RolesToggle.tsx`, already de-3-D'd this session) —
   restyle `Mascot.tsx`'s SVG with the new palette; this is the reference
   example of "HTML/CSS + GSAP, no 3-D" the rest of the page should match.
5. **Proof graph** (`ProofGraph.tsx`) — shadcn-themed chart surface, Framer
   Motion for the "push a date, watch the spine move" recalculation.
6. **Close/footer** — shadcn `Button` actions, no more `.sm-actions--close`
   custom CSS.

Net effect: `sitemark.css` shrinks toward zero over the migration; nothing new
is added to it.

## 8. Section-by-section plan — app (Operate mode)

`src/index.css` shadcn tokens get retuned to §4, then every feature folder
(`src/features/{boq,scheduling,projects,documents,settings,shell}`) is audited
for direct `--shadow-neu-*` / hardcoded hex usage and migrated to the token
set + shadcn components. Priority order: `shell` (nav/sidebar — sets the tone
for everything else), then `scheduling` (the highest-traffic, most
data-dense screen — this is where "professional instrument" has to land
hardest), then `boq`, `projects`, `documents`, `settings`.

## 9. Rollout

Ship in this order, one PR-sized slice at a time, so each is reviewable and
the two surfaces never look "half-migrated" for long:

1. **Batch 1** (issues #3, #4, #5) — token + font swap in `src/index.css` /
   `tailwind.config.ts` / `index.html` (new fonts loaded, radius/shadow/color
   tokens replaced) — nothing visually final yet, but the whole app now
   inherits the new base.
2. **Batch 2** (issues #6, #7) — landing hero + Roles (already closest to done).
3. **Batch 3** (issues #8, #9, #10, #11, #12) — remaining landing sections
   (§7.2–7.6), `sitemark.css` deleted once empty.
4. **Batch 4** (issues #13–#18) — app shell nav (§8), then Scheduling, then
   the rest.
5. **Batch 5** (issue #19) — delete `design-system.md`; rewrite `DESIGN.md`
   and `docs/UI_UX_GUIDELINES.md` to document what actually shipped, replacing
   this file as the source of truth.

Tracking issue: **#2**. See §0 for how a session should pick this up and work
it batch by batch, and for the issue → batch map.

## 10. Acceptance checklist (per slice)

- [ ] No new hex literals outside the token set in `src/index.css`.
- [ ] No new `.sm-*` custom CSS class added.
- [ ] Every new interactive control is a shadcn component or variant of one.
- [ ] Motion library used matches §6's job description.
- [ ] Contrast checked at AA, focus ring visible, `prefers-reduced-motion`
      honored.
- [ ] Reviewed in an actual browser at desktop + ~960px breakpoint, not just
      typechecked.
- [ ] Corresponding GitHub issue (#3–#19) closed with a comment on what shipped.
