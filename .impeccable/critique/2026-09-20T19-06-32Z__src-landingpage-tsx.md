---
target: landing page
total_score: 15
max_score: 32
na_heuristics: 7,10
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\Sanji\\Documents\\Projects\\sadiconstruction-2.0\\src\\LandingPage.tsx"
target_fingerprint: "sha256:3e201b5195ded6541caa4b6c7d81af8aba689250897b20b6081c8b2eaf193ee6"
target_path: "C:\\Users\\Sanji\\Documents\\Projects\\sadiconstruction-2.0\\src\\LandingPage.tsx"
timestamp: 2026-09-20T19-06-32Z
slug: src-landingpage-tsx
---
# Critique — src/LandingPage.tsx

Method: dual-agent (A: 6b6e1d90-fbfa-40e2-8848-502e4bbdfed3 · B: 0cf6dc7e-6281-4b78-839b-4b80aa3acd15)

Target: `src/LandingPage.tsx` (route `/`). Mode: Persuade. Browser inspection failed in both assessments (Cursor tabs did not persist); review is source-backed. Detector CLI: 0 findings.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Pips + live region exist; canvas `Suspense fallback={null}` and camera lerp have no status; no “phase 3 of 7” text. |
| 2 | Match System / Real World | 2 | Construction metaphor is fluent; the real tool (tree + Gantt + locked phases) never appears; SET still says Request Access. |
| 3 | User Control and Freedom | 3 | Header Sign in/up, skip links, Back/Next/pips; cannot skip the manifesto to product proof because there is none. |
| 4 | Consistency and Standards | 2 | SADICON vs Sadiconstruction; Sign up vs Request Access; brief says campus massing, code ships FormworkTower. |
| 5 | Error Prevention | 2 | Back disabled at 0; SET copy aims people at a removed flow; 10px pips invite mis-taps. |
| 6 | Recognition Rather Than Recall | 1 | Unlabeled pips; `W08`/`A1100` unexplained; no screens of Overview / BOQ / Scheduling. |
| 7 | Flexibility and Efficiency | n/a | Persuade landing; keyboard accelerators are extras, not the job. |
| 8 | Aesthetic and Minimalist Design | 2 | Acoustic chrome is disciplined; most pixels are a 3D pour that does not earn conversion. |
| 9 | Error Recovery | 1 | No WebGL failure UI; no recovery from stale Request Access copy. |
| 10 | Help and Documentation | n/a | Persuade; no in-product help expected on `/`. |
| **Total** | | **15/32** | **Poor (47%)** |

## Design Specificity Verdict

**Start here.** The copy is authored for Sadiconstruction. The surface is not. Swap the BEATS strings and this page still works as a studio reel.

**LLM assessment:** Kinetic hero + full-viewport R3F pour is architecture-visualization spectacle. Acoustic-Tech (espresso, amber-on-active, Big Shoulders, Azeret Mono) is a real identity dressing the wrong artefact. There is no project directory, Overview, view-only BOQ, activity tree, or phase-colored Gantt. `CampusMassing` (named proof: PRJ-2024-008) is unused; `FormworkCanvas` still mounts `FormworkTower`.

**Deterministic scan:** `impeccable detect --json` on `src/LandingPage.tsx` and `src/features/landing/` returned `[]`, exit 0, COUNT 0. No rule names, no file locations. The detector does not catch missing IA or missing product proof. No false positives. Detector and design review do not conflict; the detector simply cannot see the P0.

**Visual overlays:** No reliable user-visible overlay. Mutation preflight failed: Cursor IDE browser tabs vanished before navigate/inject. Live-server was never started. Fallback: source-only critique.

## Overall Impression

Your instinct is right. The landing is two full-viewport scenes — a type poster, then a WebGL pour — and it never shows the product. It persuades people to watch a building assemble. It does not persuade a planner to run BOQ-owned CPM. Missing, in order: the app (Scheduling/BOQ/directory), who it is for, who made it, and any feature that is not a metaphor.

## What's Working

1. **Acoustic-Tech is a world.** Espresso ground, amber only on Sign up / Next / active pip, Big Shoulders on phase names, Azeret Mono on measures. This is not charcoal-orange directory chrome and not generic SaaS indigo.

2. **The stepper clock is correct.** `currentStep` owns copy and camera. `Begin the programme` is a real CTA, not scroll-scrub theatre. BEATS copy is the most product-specific writing on the site.

3. **Conversion bones exist.** Sign in / Sign up on both panes, skip links, live region, named pips, reduced-motion variants. The failure is what those bones hold.

## Priority Issues

### [P0] The landing never shows the product
- **Why it matters:** The Persuade job is “understand that BOQ phases own time and Longest Path is computed here, then Sign in / Sign up.” Visitors cannot understand a scheduler they never see. Features, creator/org, and app chrome are absent because the page has no third section — only `LandingHero` + `LandingStage`.
- **Fix:** Keep Acoustic-Tech and the stepper. Hero lede must name the product in one sentence. Dedicate at least POUR or SET to a real Scheduling/BOQ frame (Clearwater, labeled synthetic). Add a short proof strip: Gantt with Longest Path, locked phase row, project directory. Creator/org is one named line, not a novel.
- **Suggested command:** `/impeccable shape`

### [P1] 3D ate the pitch
- **Why it matters:** `#programme` is `h-svh` WebGL (`FormworkTower`, always-on frameloop, 2k shadows). Overlay copy is a caption. Next phase advances a pour, not a feature. A PM cannot take “put the programme on the meeting screen” seriously.
- **Fix:** Shrink the canvas to artefact. Glass panel as the primary reading surface. Wire `CampusMassing` + `reveal` if the model stays, or replace later beats with product stills. No more camera heroics.
- **Suggested command:** `/impeccable distill`

### [P1] No org, no people, no “who this is for”
- **Why it matters:** Wordmark is `SADICON` only. No Sadiconstruction, no SADICON MANAGEMENT, no planner/PM audience line until beat 06, and that beat still says Request Access (removed). Internal staff cannot tell if this is their tool or a 3D experiment.
- **Fix:** Hero: who + what in the lede. SET: org line + role line + Sign up (not Request Access). If a creator story matters, one named sentence.
- **Suggested command:** `/impeccable clarify`

### [P2] Stage is an options pile, especially on a phone
- **Why it matters:** Duplicate header CTAs, seven unlabeled `size-2.5` pips, Back/Next, week/code, 5rem titles, last-beat duplicate Sign in/Sign up. Decision count blows past 4. Thumb users miss 10px dots.
- **Fix:** One primary (Next / Sign up). Label phases or `3 / 7 EXCAVATE`. 44px pip hit areas. On small viewports, stack copy; don’t fight the canvas.
- **Suggested command:** `/impeccable adapt`

### [P2] Jargon without a picture
- **Why it matters:** `The bill owns the clock`, `A1100`, `W08`, Retained Logic, total float — accurate, never shown as UI. POUR describes Longest Path and shows a slab.
- **Fix:** Each beat needs one recognizable product object (locked phase row, FS link, red Longest Path bar, float column). Keep BEATS voice; stop using it as the only proof.
- **Suggested command:** `/impeccable layout`

## Cognitive load

7/8 checklist failures (high): single focus, chunking, hierarchy, one-thing-at-a-time, minimal choices, working memory, progressive disclosure. Only grouping passes.

## Emotional journey

Peak is the hero word-reveal (mood, not meaning). Valley is beat 00: metaphor over a pit, no screenshot, no person. End is SET with stale Request Access. Peak-end: a pretty 3D and a confused door.

## Persona Red Flags

**Jordan (first-timer):** `The programme is poured` is not a first action. `Begin the programme` sounds like a film. EXCAVATE does not mean BOQ. Pips unlabeled. Sign up available with no “what you join.” Abandon: hero or beat 00.

**Riley (stress tester):** SET copy vs Sign up button. Brief/campus vs FormworkTower. Keyboard dead until 55% intersection. Refresh loses step. Canvas fallback null. They will log “pretty, internally inconsistent.”

**Casey (mobile):** Header CTAs top-right. 10px pips. Overlay titles eat the svh. Full-bleed WebGL on a phone. Step state is RAM-only.

**Morgan (Planner / PM):** Never sees locked phase roots, Gantt, or critical highlight. “Meeting screen” is a caption over a pour. They will not advocate this to stakeholders.

## Minor Observations

- SADICON tracking looks like a fashion label, not Sadiconstruction / SADICON MANAGEMENT.
- Glass is on the inner body card, not the article — 5rem titles sit raw over WebGL.
- `CAMERA_POSES` are tower-centric, not campus poses in design-system.md.
- Disclaimer repeats on every beat; once at SET is enough.
- `scroll-snap-type: y mandatory` fights a peek at the stage.
- LandingGate flash `#141614` vs espresso.

## Questions to Consider

- If you muted the canvas, would anyone still understand what Sadiconstruction does?
- Would a project manager paste this URL into a delay meeting, or the Scheduling tab?
- What is the one still — Gantt with Longest Path, locked BOQ row, or directory — that makes Sign up inevitable?
- Is Acoustic-Tech in service of the programme, or is the programme an excuse to keep the R3F scene?
- Who is “the creator” on an internal tool, and why does none of them appear before beat 06?
