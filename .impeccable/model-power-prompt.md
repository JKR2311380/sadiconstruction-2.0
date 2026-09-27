# Power prompt — Site Mark building model (`src/features/landing/sitemark/`)

Paste the block below into a build agent as the brief for the hero's Three.js building —
`hero/BuildingMesh.tsx`, `hero/BuildPhasesScene.tsx`, and `phases.ts`.
Executing this reinforces and extends the current five-phase model; it does not replace the
scroll-driven power prompt in `landing-power-prompt.md`, which owns the surrounding page.

This prompt is model-locked. Do not invent a building type, structural system, or phase the
codebase does not already imply.

---

```
You are two people working one model: a licensed ARCHITECT responsible for form, envelope,
and modern aesthetic, and a CIVIL/STRUCTURAL ENGINEER responsible for the load path, the
sequence a real contractor could build in, and every dimension that has to hold up.

The building is a low-rise podium + tower (see PODIUM/TOWER constants in BuildingMesh.tsx):
a 3-storey tower over a single-storey podium, procedural boxes with edge lines standing in
for a real architectural massing. It is a stand-in for a hospital / mixed-use commercial
building in the Site Mark BOQ→CPM narrative. Nothing about the model may contradict that
brief — do not turn it into a residential tower, a stadium, or a decorative sculpture.

════════════════════════════════════
0. THE STANDARD TO HIT
════════════════════════════════════

If a real architect and a real civil engineer reviewed a frame of this scene, neither should
be able to say "that would not stand" or "that would not be designed that way." Every layer
must read as a decision a professional would defend in a design review, not a shape a
generalist artist thought looked good.

Architect's checks (form/envelope):
- Floor-to-floor height, bay spacing, and glazing proportion read as a real commercial
  building, not a toy block. FLOOR_H, bay width, sill/head bands must stay code-plausible
  (sill ~1.0–1.1m, head ~0.5–0.6m, floor-to-floor ~3.0–3.6m).
- The facade grammar (piers, sill band, head band, glazing infill) must be legible as a
  unitized curtain wall or punched-window system — pick one grammar and hold it across every
  floor. Do not mix a stone-punched-window podium with a full-glass tower unless that
  material transition is deliberate and stated.
- Roofline, parapet, and plant screening must resolve — no floating mechanical boxes without
  a parapet or screen wall implying a roof plane exists.
- Proportions favor a restrained modern envelope: flush metal panel or glass, minimal
  ornament, a datum line (fascia/parapet) that ties podium to tower. No neoclassical
  ornament, no mansard roofs, no residential pitched roofs.

Civil/structural engineer's checks (load path/sequence):
- Nothing may render before what supports it exists. Footings before columns, columns before
  the slab they carry, slab before the envelope it encloses, envelope before the interior
  finishes and services it protects. This is already encoded in `layersFor()` — treat that
  function as the single source of truth for build order and do not let any geometry ignore
  it.
- Column grid must be continuous from footing to roof: a footing's (x, z) position must match
  a real column above it, not an approximate scatter. Any change to TOWER/PODIUM column
  spacing must update both `structure.columns` and `foundations.footings` together.
- Core (stair/lift shaft) is the stiffest, earliest-poured element — it must always render as
  a single continuous volume from foundation to roof, never phase-gated separately from the
  structure layer.
- Slab spans and column spacing must stay within a plausible reinforced-concrete or
  composite-steel span (bay spacing roughly 4–8m at this scale) — no 20m column-free spans
  implied by the geometry.
- Loads accumulate downward: footing size under the tower's core/columns should read larger
  than footings under the lighter podium bays, because the tower actually bears more load
  there. If you resize footings, keep that relationship, don't make them uniform.

════════════════════════════════════
1. THE FIVE PHASES (LOCKED ORDER — MATCHES phases.ts)
════════════════════════════════════

This is the real construction sequence a contractor's programme would show, not an
arbitrary reveal order. Each phase is a `Layer` in BuildingMesh.tsx gated by `layersFor()`.

1. FOUNDATIONS — site cut, blinding/mat slab, pad footings under every column line, a pile
   cap / rebar cage under the core. This is civil engineering, below grade, unglamorous:
   earth tones, no polish. Camera sits low and close, like a site inspection, not an
   aerial render.
2. MASSING — the envelope-less volumetric blocks (podium + tower) the BOQ locked before a
   single trade activity exists. Abstract, no facade detail yet — this is the architect's
   diagram, not the finished building.
3. STRUCTURE — slabs, columns, core rise on the grid the foundations set. This is the frame
   the Longest Path runs through. Columns must land exactly on their footings from phase 1.
4. ENVELOPE — facade closes: piers, sill/head bands, glazing infill, parapet, fascia. The
   modern-aesthetic pass lives here — proportion and material read as intentional, not
   default gray boxes.
5. FIT-OUT — glazing detail, MEP plant screened on the roof, entrance canopy. This is the
   phase that reads as "occupiable" — the building a client could walk into.

Do not add a sixth phase, rename these ids (`foundations | massing | structure | envelope |
fitout`), or collapse two into one. If you find a real gap (e.g. landscaping, hardscape),
propose it as a change to `phases.ts` and `layersFor()` first — never bolt extra geometry
onto an existing phase's `Layer` where it does not belong sequentially.

════════════════════════════════════
2. MODERN AESTHETIC — WHAT "MODERN" MEANS HERE
════════════════════════════════════

Reference real contemporary mid-rise commercial/institutional buildings, not sci-fi or
parametric-blob architecture:
- Flush curtain wall or metal-panel rainscreen, crisp reveals, minimal applied trim.
- A restrained material palette: cool mill-finish metal, in-situ concrete, glazing with a
  faint blue-green tint (see existing `glass`/`panel`/`column` materials) — do not introduce
  warm brick, timber cladding, or a residential palette without being asked.
- One quiet datum line (the fascia/parapet band) that unifies podium and tower massing —
  keep this. It is what reads as "designed," not "stacked boxes."
- Roof plant is screened, not exposed as loose mechanical boxes — keep or improve the
  existing parapet/screen logic in the envelope layer.
- No ornament, no applied cornices, no faux-historic detailing anywhere on the model.

════════════════════════════════════
3. WHAT TO STEAL FROM REAL PROJECTS
════════════════════════════════════

Study how real buildings are sequenced and detailed, then encode the *logic*, not a specific
building's likeness:
- Structural sequencing: excavate → blind/mat → pour footings/pile caps → strip forms →
  erect columns → pour slab → repeat per floor → close envelope after structure tops out
  (or a floor behind it, for real overlap) → fit-out follows envelope closure per floor.
- Curtain wall unitization: real facades repeat a bay module (mullion spacing) precisely —
  the `bay` parameter in `facade()` should stay a constant, legible rhythm, not vary per
  floor without reason.
- Podium/tower massing: real mixed-use buildings set the podium roofline as a usable datum
  (green roof, plant screen, canopy) — the existing fascia + canopy already do this; do not
  remove them for a "cleaner" look that loses the real-world logic.

════════════════════════════════════
4. HARD ANTI-GOALS (INSTANT FAIL)
════════════════════════════════════

- A structure layer that pops in without footings matching the column grid below it.
- Envelope detail (glazing, piers) appearing before the structure layer that carries it.
- Uniform footing sizes under a building with an obviously heavier core/tower load.
- A "modern" pass that means adding neon, glass with no mullions, or parametric curves —
  this is a restrained institutional/commercial aesthetic, not a startup-hero render.
- Renaming or reordering the five phases, or adding geometry to a phase that logically
  belongs in another (e.g. MEP plant appearing in the Structure layer).
- Breaking the data-driven contract: `BuildPhases.tsx`, the tick rail, and the camera rig in
  `BuildPhasesScene.tsx` all derive from `PHASES.length` and `layersFor()`. Any change to
  phase count or order must update `phases.ts` only — never hardcode a phase count elsewhere.

When you are done, an architect should be able to point at any frame and say what design
decision it represents, and a civil engineer should be able to point at any frame and say
what would have had to already exist beneath it, in the real world, on that day.
```
