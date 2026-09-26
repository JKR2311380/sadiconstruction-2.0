# Landing design system — Acoustic-Tech stepper

> Persuade surface only. Visitor landing: kinetic hero, then a full-viewport R3F canvas driven by `currentStep`, not scroll.
> Authenticated Operate screens stay on [`DESIGN.md`](DESIGN.md) until this world is adopted there.
> Product truth: [`PRODUCT.md`](PRODUCT.md). Domain terms: [`CONTEXT.md`](CONTEXT.md).
> Motion seed: `Inspo.md` (Acoustic-Tech). Massing: `src/features/landing/formwork/campusVolumes.ts`.

---

name: Sadiconstruction Landing
description: Acoustic-Tech visitor landing — espresso glass over Clearwater campus massing, step-driven assembly
colors:
  espresso: "#1A1514"
  espresso-deep: "#100D0C"
  amber: "#D4AF37"
  amber-hot: "#E8C547"
  latte: "#F5F5DC"
  foam: "#E8E0D0"
  frosted: "rgba(255, 255, 255, 0.03)"
  border-glass: "rgba(255, 255, 255, 0.08)"
  massing-white: "#F2F2F0"
  massing-oxide: "#E85A3C"
  massing-cyan: "#5EC4C6"
  massing-plinth: "#2A2A2C"
typography:
  display:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontWeight: 800
    letterSpacing: "-0.035em"
    lineHeight: 0.82
  ui:
    fontFamily: "Overpass, Segoe UI, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
  measure:
    fontFamily: "Azeret Mono, ui-monospace, monospace"
    fontWeight: 400
    letterSpacing: "0.08em"
rounded:
  glass: "1.15rem"
  control: "999px"
spacing:
  step: "1.25rem"
  overlay: "1.5rem"
motion:
  ease: [0.22, 1, 0.36, 1]
  type-stagger: 0.04
  card-stagger: 0.15
  camera-lerp: 0.05

---

## 1. Visual and motion philosophy

Acoustic-Tech replaces cold SaaS neon with a late-night acoustic room: deep espresso, amber as the only active metal, warm off-white type, heavy frost. The 3D campus stays a construction artefact (white modules, oxide spine, cyan glass). The chrome around it is café glass, not site-hut plywood.

Motion has weight. Easing is physical — snappy start, long glide — like a block set onto a pad. Nothing bounces. Nothing strobes.

| Token | Value | Role |
| --- | --- | --- |
| Global ease | `[0.22, 1, 0.36, 1]` | All Framer variants, CSS transitions |
| Type stagger | `0.04s` | Hero words, beat title letters |
| Card stagger | `0.15s` | Overlay children (index → name → lead → body → controls) |
| Camera lerp | `0.05` / frame | `THREE.MathUtils.lerp` / `Vector3.lerp` in `useFrame` |
| Step duration | `0.8s` | Panel enter; camera settle ≈ 1.2–1.6s at 0.05 lerp |

**Hard rules**

- One integer (`currentStep`) owns DOM copy, mesh visibility, and camera targets. No second clock.
- No GSAP `ScrollTrigger`. No scroll-driven parallax. No `progressRef` as a 0–1 scroll fraction.
- Glass sits *over* the canvas. Cards never paint a solid espresso slab that hides the model.
- Amber is active-only (step pip, Next, focus). Oxide `#E85A3C` lives on the mesh, not in UI chrome.
- `prefers-reduced-motion: reduce` → jump to targets, no blur/filter, no camera lerp (set pose once).

---

## 2. Tailwind v4 tokens

This repo is Tailwind v4 (`@tailwindcss/vite`, `@theme` in CSS). Do **not** add a `module.exports` config. Extend `src/index.css` *or* isolate tokens in `src/features/landing/acoustic.css` imported only by the landing tree so Operate tokens stay untouched.

```css
/* src/features/landing/acoustic.css */
@theme {
  --color-espresso: #1A1514;
  --color-espresso-deep: #100D0C;
  --color-amber: #D4AF37;
  --color-amber-hot: #E8C547;
  --color-latte: #F5F5DC;
  --color-foam: #E8E0D0;
  --color-frosted: rgb(255 255 255 / 0.03);
  --color-border-glass: rgb(255 255 255 / 0.08);

  --font-display: "Big Shoulders Display", "Arial Narrow", sans-serif;
  --font-ui: "Overpass", "Segoe UI", sans-serif;
  --font-measure: "Azeret Mono", ui-monospace, monospace;

  --ease-acoustic: cubic-bezier(0.22, 1, 0.36, 1);

  --shadow-glass-inset: inset 0 1px 1px rgb(255 255 255 / 0.1);
  --shadow-glow-amber: 0 0 20px rgb(212 175 55 / 0.15);
  --shadow-glow-amber-hot: 0 0 32px rgb(212 175 55 / 0.28);

  --backdrop-blur-glass: 24px;
  --backdrop-blur-glass-heavy: 40px;
}

@utility bg-glass {
  background-image: linear-gradient(
    135deg,
    rgb(255 255 255 / 0.05) 0%,
    rgb(255 255 255 / 0.01) 100%
  );
  background-color: var(--color-frosted);
  backdrop-filter: blur(var(--backdrop-blur-glass-heavy)) saturate(0.85);
  -webkit-backdrop-filter: blur(var(--backdrop-blur-glass-heavy)) saturate(0.85);
  box-shadow: var(--shadow-glass-inset);
  border: 1px solid var(--color-border-glass);
}

@utility bg-glass-thin {
  background-image: linear-gradient(
    135deg,
    rgb(255 255 255 / 0.05) 0%,
    rgb(255 255 255 / 0.01) 100%
  );
  background-color: rgb(255 255 255 / 0.02);
  backdrop-filter: blur(var(--backdrop-blur-glass)) saturate(0.8);
  -webkit-backdrop-filter: blur(var(--backdrop-blur-glass)) saturate(0.8);
  border: 1px solid var(--color-border-glass);
}
```

### Utility recipes

| Class string | Use |
| --- | --- |
| `bg-espresso text-latte font-ui` | Hero ground |
| `bg-glass rounded-[1.15rem] shadow-glow-amber` | Step narrative card |
| `bg-glass-thin rounded-full` | Next / Back pills, step pips |
| `text-amber shadow-glow-amber` | Active pip, active word |
| `font-display tracking-[-0.035em] text-latte` | Hero headline, beat name |
| `font-measure text-[0.72rem] tracking-[0.08em] text-foam/70` | Week, BOQ code, step index |
| `text-amber underline-offset-4` | Focus-visible text links |

Hero ambient glow (DOM, not canvas):

```html
<div
  aria-hidden
  class="pointer-events-none absolute inset-0
         bg-[radial-gradient(ellipse_at_50%_40%,rgb(212_175_55/0.14),transparent_58%)]"
/>
```

---

## 3. Typography

Load via existing landing font links (Big Shoulders Display / Condensed, Overpass, Azeret Mono). Do not introduce DM Serif / Work Sans on this surface — those are Operate leftovers.

| Role | Face | Size | Notes |
| --- | --- | --- | --- |
| Hero headline | `--font-display` | `clamp(3.4rem, 9vw, 7rem)` | Word-by-word reveal; max 6–8 words |
| Hero lede | `--font-ui` 600 | `clamp(1.2rem, 2.2vw, 1.65rem)` | One sentence, ≤ 18ch |
| Beat name | `--font-display` 800 | `clamp(2.8rem, 6vw, 5rem)` | `BEATS[i].name` |
| Beat lead | `--font-ui` 600 | `clamp(1.35rem, 2.4vw, 2rem)` | `BEATS[i].lead` |
| Beat body | `--font-ui` 400 1.05rem | max 42ch | Inside glass card |
| Measure | `--font-measure` 0.72rem | `W08` / `A1100` / `00` | Tabular |
| Wordmark | `--font-display` 700 | `clamp(1.2rem, 2vw, 1.6rem)` | `SADICON`, letter-spacing `0.22em` |

---

## 4. Layout architecture

Two stacked full viewports. The canvas is **not** behind the hero.

```
┌─────────────────────────────┐  100svh  HERO (DOM only)
│  wordmark · Sign in/up      │
│  kinetic headline           │
│  lede · amber glow          │
│  “Begin the programme” ↓    │
└─────────────────────────────┘
┌─────────────────────────────┐  100svh  STAGE (sticky / snap)
│  <Canvas> full bleed        │
│  glass overlay: copy+stepper│
│  no page scroll on this pane│
└─────────────────────────────┘
```

### Hero (`LandingHero`)

- `min-h-svh bg-espresso` — **no** `<Canvas>`, **no** Three.js.
- Headline splits on whitespace. Each word is a `motion.span` using `textRevealVariant`, parent `staggerChildren: 0.04`.
- Primary CTA scrolls the stage into view with `scrollIntoView({ behavior })` — this is the only scroll. It does not drive 3D.
- Optional: `scroll-snap-type: y mandatory` on the landing root so hero and stage paginate.

### Stage (`LandingStage`)

- `relative h-svh overflow-hidden`.
- `FormworkCanvas` is `absolute inset-0 z-0`.
- Overlay is `absolute inset-0 z-10 pointer-events-none`; controls inside are `pointer-events-auto`.
- Remove `.formwork-scroll` (`620vh`) and the GSAP `ScrollTrigger` block in `LandingPage.tsx`.

```
src/LandingPage.tsx
  LandingHero
  LandingStage
    FormworkCanvas          // currentStep, reduced
    StepOverlay             // currentStep, setCurrentStep, beat
```

---

## 5. State machine

```ts
const STEP_COUNT = 7 // BEATS.length
const [currentStep, setCurrentStep] = useState(0)

const goNext = () => setCurrentStep((s) => Math.min(STEP_COUNT - 1, s + 1))
const goBack = () => setCurrentStep((s) => Math.max(0, s - 1))
const goTo = (i: number) => setCurrentStep(i)
```

| Input | Behaviour |
| --- | --- |
| Next | `goNext()` — label **Next phase** until last; last label **Sign up** → `/signup` |
| Back | `goBack()` — hidden or disabled at `0` |
| Pip `i` | `goTo(i)` |
| ArrowRight / `l` | Next (when overlay focused) |
| ArrowLeft / `h` | Back |
| Digit `1–7` | Jump to step (optional, document in aria) |

`BEATS` in `lifecycle.ts` stay the narrative source. Do not rewrite copy. `currentStep` **is** the beat index.

```ts
const beat = BEATS[currentStep]
```

Pass `currentStep` into the canvas as a prop. Do not read scroll. Do not keep `progressRef`.

---

## 6. Framer Motion variants

Put these in `src/features/landing/motion.ts`. Shared ease — do not inline other curves.

```ts
export const acousticEase = [0.22, 1, 0.36, 1] as const

export const textRevealVariant = {
  hidden: { y: 20, opacity: 0, filter: "blur(8px)" },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: acousticEase },
  },
}

export const heroContainerVariant = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.12 },
  },
}

export const glassPanelVariant = {
  hidden: { y: 40, opacity: 0, scale: 0.98 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: acousticEase, staggerChildren: 0.15 },
  },
  exit: {
    y: -20,
    opacity: 0,
    filter: "blur(4px)",
    transition: { duration: 0.4, ease: "easeIn" },
  },
}

export const glassChildVariant = {
  hidden: { y: 16, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: acousticEase },
  },
}

export const pipVariant = {
  idle: { scale: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  active: {
    scale: 1.15,
    backgroundColor: "#D4AF37",
    boxShadow: "0 0 20px rgba(212,175,55,0.15)",
    transition: { duration: 0.45, ease: acousticEase },
  },
}
```

### Overlay wiring

```tsx
<AnimatePresence mode="wait">
  <motion.article
    key={beat.id}
    variants={glassPanelVariant}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="bg-glass ..."
  >
    <motion.p variants={glassChildVariant} className="font-measure">{beat.index}</motion.p>
    <motion.h2 variants={glassChildVariant} className="font-display">{beat.name}</motion.h2>
    <motion.p variants={glassChildVariant}>{beat.lead}</motion.p>
    <motion.p variants={glassChildVariant}>{beat.body}</motion.p>
  </motion.article>
</AnimatePresence>
```

Reduced motion: `initial={false}` and skip `exit` filters. Use `useReducedMotion()` from Framer.

---

## 7. Overlay UI

Glass stack, bottom-right on desktop; stacked full-width on `&lt;860px`.

```
[ SADICON ]                          [ Sign in ] [ Sign up ]

                                      00
                                      EXCAVATE
                                      The ground is already spoken for.
                                      ┌ glass card ─────────────────┐
                                      │ body + synth disclaimer     │
                                      └─────────────────────────────┘
 [● ○ ○ ○ ○ ○ ○]                      [ Back ]  [ Next phase ]
```

- Pips: 7 dots. Active = amber + `shadow-glow-amber`. Visited = foam at 40%. Future = border-glass only.
- Buttons: `bg-glass-thin`, height `2.75rem`, uppercase `--font-display` 0.95rem tracking `0.08em`.
- Next (active): amber fill, espresso text, `shadow-glow-amber`.
- Back: frost only, latte text. `aria-disabled` at step 0.
- `aria-live="polite"` on the article. Step group: `role="group"` `aria-label="Programme phases"`.
- Keep the synthetic-data line: *PRJ-2024-008 Clearwater Medical Center is synthetic demonstration data.*
- Last step (`handover`): show Sign up (primary) + Sign in beside Next, same as today’s handover.

---

## 8. 3D scene contract

Keep the Clearwater campus primitives. Do not swap in `FormworkTower`. Scene ground `#1A1514` (espresso), fog espresso at `28–56`. Lights stay warm: hemisphere `#F5F5DC` / `#3A2A1C`, key slightly amber-white.

### Volume tags

Add a `reveal` integer to each volume (step at which it appears). Depth groups `fg | mg | bg` remain for material/order, **not** for scroll offsets. Delete the scroll parallax `useFrame` that translates groups by `t * 0.55`.

```ts
export type Volume = {
  g: Layer
  m: Mat
  reveal: 0 | 1 | 2 | 3 | 4 | 5 | 6
  w: number; h: number; d: number
  x: number; y: number; z: number
}
```

| `reveal` | What appears | Volumes (by current list) |
| --- | --- | --- |
| 0 EXCAVATE | Plinth only | `m: "b"` pad |
| 1 FOUND | West L-terraces | All `fg` white boxes (`x < 0`) |
| 2 FORM | Courtyard cube village | `mg` white modules |
| 3 POUR | Orange Z-spine | All `m: "o"` except the tower |
| 4 STRIP | Cyan glass + pool | All `m: "c"` |
| 5 RISE | Rear bar + tower | `bg` whites + `fg` tower `x: 9.15` |
| 6 SET | Plant pads, complete campus | `m: "p"` |

Rule: `visible={currentStep >= vol.reveal}`. Prefer scale/opacity assemble over mount/unmount to keep GPU buffers warm:

```ts
const on = currentStep >= vol.reveal
// useFrame: scale.lerp(on ? 1 : 0.001, reduced ? 1 : 0.08)
// material.opacity lerp; visible = scale.x > 0.02
```

New volumes grow from soffit (`y`) upward — scale Y from 0.02 → 1, origin at box bottom. Duration feels like a pour, not a pop.

---

## 9. Camera choreography

Dedicated `StageRig` inside the canvas. `@react-three/drei` `<CameraControls>` is the control surface; `useFrame` lerps toward the step pose. User orbit is **off** during a step change (`controls.enabled = false` until distance &lt; 0.08), then optional gentle idle.

```ts
import * as THREE from "three"

export type Pose = {
  pos: THREE.Vector3
  target: THREE.Vector3
  fov: number
}

// Campus: +X right (Front), +Y up, +Z toward Front. 1 grid = 1 unit.
export const CAMERA_POSES: Pose[] = [
  { // 0 EXCAVATE — low, over the pad
    pos: new THREE.Vector3(8.4, 3.2, 11.2),
    target: new THREE.Vector3(0.6, 0.1, 0.1),
    fov: 32,
  },
  { // 1 FOUND — west terraces
    pos: new THREE.Vector3(-2.2, 6.8, 12.4),
    target: new THREE.Vector3(-6.0, 1.0, -1.2),
    fov: 30,
  },
  { // 2 FORM — courtyard cubes
    pos: new THREE.Vector3(4.8, 7.2, 11.6),
    target: new THREE.Vector3(0.2, 1.2, 1.0),
    fov: 30,
  },
  { // 3 POUR — along the oxide spine
    pos: new THREE.Vector3(10.4, 8.6, 9.8),
    target: new THREE.Vector3(1.4, 1.6, 1.4),
    fov: 28,
  },
  { // 4 STRIP — glass bays / pool
    pos: new THREE.Vector3(9.2, 5.4, 8.8),
    target: new THREE.Vector3(3.6, 1.1, 1.8),
    fov: 30,
  },
  { // 5 RISE — tower and rear bar
    pos: new THREE.Vector3(16.8, 9.4, 10.2),
    target: new THREE.Vector3(8.4, 2.4, 0.2),
    fov: 28,
  },
  { // 6 SET — established iso, handover
    pos: new THREE.Vector3(18.8, 13.6, 16.2),
    target: new THREE.Vector3(0.4, 1.5, 0.1),
    fov: 26,
  },
]
```

```ts
const LERP = 0.05

useFrame((_, delta) => {
  const pose = CAMERA_POSES[currentStep]
  const k = reduced ? 1 : 1 - Math.pow(1 - LERP, delta * 60)

  camera.position.lerp(pose.pos, k)
  look.current.lerp(pose.target, k)
  camera.fov = THREE.MathUtils.lerp(camera.fov, pose.fov, k)
  camera.updateProjectionMatrix()

  controls.current?.setLookAt(
    camera.position.x, camera.position.y, camera.position.z,
    look.current.x, look.current.y, look.current.z,
    false,
  )
})
```

- Instantiate `CAMERA_POSES` once (`useMemo`) so `new Vector3` is not per-render.
- `CameraControls` `smoothTime={0}` while we own the lerp; do not double-ease.
- Canvas camera default = pose 0. `near: 0.1`, `far: 120`.
- Shadows: `castShadow` on the key light; avoid `shadows="percentage"` if Three r186 rejects it — use `"soft"` or boolean `true`.

---

## 10. Step cycle (single loop)

1. Visitor clicks **Next phase** → `setCurrentStep(n + 1)`.
2. Framer `AnimatePresence` exits the glass article (`exit` up + blur) and enters the next (`hidden` → `visible`, children stagger `0.15s`).
3. The same integer arrives as a canvas prop. Volumes with `reveal === n` assemble (scale Y). Already-visible volumes stay.
4. `StageRig` lerps camera + target + fov to `CAMERA_POSES[n]`.
5. Pips update; measure (`week`, `code`) updates with the beat.
6. At step 6, handover links appear. Next becomes **Sign up**.

Back reverses visibility (`currentStep >= reveal` handles it) and lerps camera to the previous pose. Exit animation still runs.

---

## 11. Kill list (incumbent landing)

| Remove | Why |
| --- | --- |
| GSAP `ScrollTrigger` + `useGSAP` on `LandingPage` | Scroll is no longer the clock |
| `.formwork-scroll` `620vh` | No long-page scrub |
| `progressRef` | Replaced by `currentStep` |
| `CampusMassing` group translate by scroll `t` | Parallax retired |
| “Scroll to pour” hint | CTA is **Begin the programme** / **Next phase** |
| `beatAt(progress)` / `beatIndexAt` in the landing | Landing uses the integer; keep helpers only if another surface still scrubs |
| `FormworkTower` on this route | Campus massing is the model |

Keep `BEATS` copy, `CampusMassing` meshes, `FormworkCanvas` (rewire props), Sign-in / Sign-up routes, synthetic disclaimer.

---

## 12. File map

```
src/features/landing/
  acoustic.css              # @theme tokens + glass utilities
  motion.ts                 # Framer variants + acousticEase
  LandingHero.tsx           # DOM kinetic hero
  LandingStage.tsx          # 100svh stage + stepper state
  StepOverlay.tsx           # glass narrative + Next/Back/pips
  formwork/
    FormworkCanvas.tsx      # Canvas; props: currentStep, reduced
    CampusMassing.tsx       # reveal-driven assemble; no scroll lerp
    campusVolumes.ts        # + reveal field
    StageRig.tsx            # CameraControls + pose lerp
    lifecycle.ts            # BEATS unchanged
```

`src/LandingPage.tsx` becomes a thin compose of Hero + Stage. `LandingGate.jsx` still gates on session.

---

## 13. Accessibility

- Contrast: latte on espresso; amber on espresso for controls (check `#D4AF37` on `#1A1514` — AA for large type; if body text fails, use `#E8C547` / `#F5F5DC` on buttons).
- Skip link: “Skip to programme” → stage; “Skip to sign up” remains.
- Step changes announced via `aria-live="polite"` (beat name + lead).
- Focus ring: `2px solid #D4AF37`, offset `3px`. Never remove outlines.
- Keyboard: Left/Right as above; Tab order = Sign in → Sign up → Back → Next → pips.
- `prefers-reduced-motion`: instant camera, no blur, no scale assemble (snap `visible`).

---

## 14. Do / don’t

**Do**

- Drive everything from `currentStep`.
- Let frost and blur keep the campus readable behind type.
- Assemble storeys from the soffit. Ease like mass, not like UI fade.
- Use domain words: Sign-in, Sign-up, BOQ, Longest Path, Phase, Staff Member.

**Don’t**

- Scrub the camera with scroll or wheel on the stage.
- Paint neon, kraft, hanging prints, or the old oxide HUD as the UI metal.
- Put Operate clay/neu tokens on this surface.
- Mount/unmount the whole campus per step.
- Invent new beat copy. The programme is already written.

---

## 15. Execution order

1. Add `acoustic.css` + `motion.ts`.
2. Split `LandingPage` into Hero + Stage; delete ScrollTrigger and the 620vh spacer.
3. Build `StepOverlay` (glass, Next/Back, pips) on `BEATS`.
4. Tag `reveal` on `CAMPUS_VOLUMES`; assemble in `CampusMassing`.
5. Add `StageRig` with `CAMERA_POSES` + `CameraControls`.
6. Reduced-motion and keyboard pass.
7. Verify hero (no canvas) then each of the 7 poses in the browser — desktop and `&lt;860px`.
