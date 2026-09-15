# Power prompt — Sadiconstruction landing (`/`)

Paste the block below into a design/build agent as the brief for `src/LandingPage.jsx`.
Executing this **replaces** the current Diazo Hang first-viewport if that round is still the recorded direction.

This prompt is product-locked. Do not invent claims, customers, KPIs, or capabilities.

---

```
You are an award-winning creative director and creative technologist (GSAP Site of the Day calibre) building the public landing page for SADICONSTRUCTION — an internal construction CPM platform.

This is not a SaaS marketing page with motion sprinkled on. The page is a scroll-driven demonstration of the product's unique mechanism. If someone leaves after one viewport, they must remember a building that rose according to a live critical path — not a headline, not a crane photo, not three feature cards.

════════════════════════════════════
0. JOB
════════════════════════════════════

Surface: public landing at `/` (src/LandingPage.jsx).
Mode: PERSUADE.
Audience: screened internal staff — Project Planner / Scheduler and Project Manager — arriving at a gated tool.
Primary actions: Request Access (primary) and Sign in (secondary).
Belief to install: cost phases (BOQ) and time path (CPM / Longest Path) are the same object. The schedule does not invent billable work; the building cannot rise on a path the Bill of Quantities did not name.

Success: a Project Manager would put this page on a screen in a stakeholder meeting without embarrassment. A planner would recognize their actual job, not a brochure.

════════════════════════════════════
1. PRODUCT TRUTH (LOCKED — DO NOT INVENT)
════════════════════════════════════

Name: Sadiconstruction / SADICON MANAGEMENT.

What it is: internal construction project-management platform (projects, budgets, contractors, documents, view-only BOQ, scheduling). Not public multi-tenant SaaS. Access is requested; credentials are granted. No open signup.

Unique mechanism (the only thing the page may prove):
BOQ = immutable WBS. Scheduling = network + first-party CPM engine.
- Phase roots are locked from the approved Bill of Quantities. Schedule cannot invent billable phases.
- Engine: topological sort, one global project calendar, FS/SS/FF/SF + lag, ES/EF/LS/LF, total & free float, Retained Logic only.
- Criticality: Longest Path (AACE 49R-06 family), not naïve “TF ≤ 0”. LOE/hammocks excluded from the driving path.
- Recreated from Project Libre’s evaluation process (algorithms/equations) on Vite/React/Supabase. Not imported. Not embedded.

Proof object (synthetic, must be labeled as such wherever a visitor could mistake it for a live job):
Clearwater Medical Center — PRJ-2024-008. Use real-feeling programme language: Preliminaries / Site works / Concrete (or the project’s actual BOQ phase names if present in the repo). Durations in working days. A few named activities, floats, and one driving path. Do not fake org-wide KPIs, client logos, “trusted by”, or win rates.

Capabilities you may show: BOQ→WBS lock, network logic, live Longest Path, float, split list+Gantt as a later reveal of the same object — never as a generic product screenshot in a browser chrome.

Capabilities you must not claim: editable BOQ from Scheduling, Project Libre/MSPDI import as a product path, multi-calendar, Progress Override, resource leveling, cost-loaded CPM, public pricing, self-serve signup.

Stack to implement in: Vite + React 19 + Tailwind CSS v4 + React Router. Motion: GSAP 3 (ScrollTrigger, ScrollSmoother or Lenis, SplitText). 3D if used: React Three Fiber + drei, one scene, not a library of effects. No Barba (this is an SPA). No Howler/ambient soundtrack — this audience does not enter a brand with a sound gate.

════════════════════════════════════
2. INSPIRATION — STEAL THE ARCHITECTURE, NEVER THE CLOTHES
════════════════════════════════════

Study these as systems. Recreate neither palette nor subject.

A) https://sstr.tech/en/  (GSAP Site of the Day)
What to take:
- The page is an engineering argument, not a brand mood. Copy is specialist-to-specialist.
- A scripted preloader that IS the product thinking (status lines, percentages, schematic hardware) — not a spinner.
- Hero is a cinematic close-up of the actual object of work, filling the viewport. Not a stock industry photograph with a text panel.
- Proof is a chart with units (depth, tonnes, before/after), not logos.
- One pinned scroll sequence that shows the physical system in section (their drill-string in the wellbore). The diagram is the product.
- Motion timing feels mechanical — like hardware seating — not bouncy, not elastic, not “delightful”.
- Editorial type at huge scale; one signal color used as a rare instrument, not a theme.
- High contrast between a light reading band and a dark instrument band. The cut is a material change, not a background toggle.

What to refuse from SSTR: oil-and-gas subject, orange-on-charcoal if it simply restyles the incumbent Sadiconstruction mockup, rounded candy CTAs, “Site of the Day” energy, any hardware that is not this product’s.

B) https://www.daoism.systems  (GSAP Site of the Day — treat as the motion north star)
What to take:
- The site is ONE continuous scene. Scroll moves a single 3D structure through space; typography and UI orbit it. You do not stack independent “sections that fade up”.
- Philosophy is encoded in architecture (they used eight Bagua-echoing chapters). Encode CPM in the build sequence of the building. Do not describe CPM in a paragraph and then decorate.
- A ritualized entry (loader → threshold → first viewport) that stays in character.
- Scroll progress as a first-class instrument (a scrubbable timeline, not a decorative bar).
- Perspective / depth as the reveal language (cards, type, and the object share one camera).
- Hover that labels the thing under the cursor in the object’s own vocabulary.
- Reduce-motion is a designed path, not an afterthought.

What to refuse from Daoism: Web3 mysticism, particle void, chromatic-aberration-as-brand, neon, ambient audio gate (“enter with sound”), custom cursor theatre, 404 minigames, dark-cyber philosophy clothes. A Project Manager would not trust that world in a client meeting. Take the continuous-scene discipline; leave the cult.

The synthesis, in one sentence:
SSTR’s industrial trust + Daoism’s continuous scroll-scene, pointed at a 4D construction model whose erection is the CPM engine made visible.

════════════════════════════════════
3. THE ONE IDEA (NON-NEGOTIABLE)
════════════════════════════════════

THESIS: Scroll is time. The building is the programme. Longest Path is the load-bearing spine.

The landing is a 4D construction sequence of Clearwater Medical Center. As the visitor scrolls, calendar time advances and the structure is erected in the order the network allows — not as a cartoon “building going up”, and not as a crane skyline.

Rules of the model (this is the product, so get them right):
1. Nothing may appear before its BOQ phase exists. Phase roots lock first: a survey grid, then substructure, then superstructure. The schedule cannot grow a floor the BOQ did not name.
2. Members on the Longest Path erect first and stay marked (vermilion / issue-red — the only loud color). They are the spine. If the spine slips, the storey above waits.
3. Non-critical work has visible float: those members assemble later, slightly ghosted or delayed relative to the spine. Float is a spatial delay, not a tooltip.
4. Dependencies are physical joins (a beam cannot land before its columns). FS/SS/FF/SF should be readable as construction logic, not as Gantt jargon dumped on the model.
5. Mid-scroll, one activity on the driving path overruns. The spine stalls. A floor hangs incomplete. The path recomputes. A previously float-rich member is promoted to critical. This is the only “wow” — and it is the product.

The building is NOT decoration behind the copy. The copy is annotation on the building.

First viewport memory test: “It was a drawing that stood up into a hospital, and the red members were the jobs that could not slip.”

════════════════════════════════════
4. SCROLL ARCHITECTURE (ONE SCENE, SIX ACTS)
════════════════════════════════════

Build as a single GSAP timeline scrubbed by scroll (ScrollTrigger pin on a full-viewport stage ~600–900vh). Acts are camera + model states, not separate landing sections. Type, stamps, and controls are HTML overlay, synced to timeline labels. Do not implement six stacked websites.

ACT 0 — CALCULATION (preloader, 1.5–2.5s, skippable, branded)
The engine is running. Status lines in condensed industrial type:
  TOPOLOGICAL SORT — OK
  FORWARD PASS  ES/EF
  BACKWARD PASS LS/LF
  LONGEST PATH  TRACE
  CYCLE CHECK   NONE
A schematic of the WBS (phase roots A/B/C) draws itself. Percentage is a CPM progress, not a fake download. Content underneath is already in the DOM (visible if JS fails).

ACT 1 — ISSUE (first viewport, ~100vh pinned)
An issued programme on a sheet — landscape, two columns of activities, calendar graticule, kraft phase bands, vermilion issue stamp. This is the object of work, filling the reading area. No website header. Wordmark SADICONSTRUCTION lives as print on the sheet. Sign in is a small sheet notation. Request Access is the vermilion stamp (bottom right). The 3D model is latent: you can already see the plan’s lines wanting to leave the paper.

ACT 2 — LOCK THE PHASES (scroll 0–20%)
The sheet’s phase bands extrude. Survey grid burns into a site. Foundations occupy the BOQ phase that owns them. On-screen annotation: “Phase roots are the Bill of Quantities. Scheduling does not invent them.” Camera: high isometric → three-quarter construction view.

ACT 3 — THE NETWORK JOINS (20–45%)
Columns, cores, slabs appear only when predecessors complete. Thin relationship lines (the logic ties) flash then become structure. A legend of four relationship types is earned here as construction joins, not a feature list. Annotation names FS / lag in planner language.

ACT 4 — LONGEST PATH (45–65%) THE FOCAL MOMENT
The driving path ignites vermilion through the frame — a continuous load-bearing line from start milestone to handover. Non-critical members recede (lower opacity, cooler metal). A compact HUD (not a SaaS card) lists 3–5 driving activities with remaining float = 0 working days. This is the money shot. Hold. Do not rush.

ACT 5 — OVERRUN (65–85%)
One named driving activity overruns (label it, give working days). The storey above freezes mid-erection. Dust/incompleteness, not cartoon panic. The vermilion path re-traces: a former float activity is promoted. Annotation: “Criticality is computed here. We do not trust an export.” This is the proof that the engine is first-party and live.

ACT 6 — HANDOVER (85–100%)
The building completes, then cools. The model recedes to a measured axonometric. The issued sheet returns as a title block. Request Access stamp is unavoidable. Sign in remains quiet. Close on the platform’s real names, not a newsletter. No fake footer sitemap of products you do not have.

After the pinned scene, at most ONE quiet reading band is allowed: access ritual (what requesting access means) and a honest constraint line (internal tool, credentials granted). Then stop. Do not append Features / About / Contact / logo clouds.

════════════════════════════════════
5. VISUAL WORLD
════════════════════════════════════

Physical scene: a print room that has a 4D model on the table. Amber practical light. Diazo / ammonia-print memory without nostalgia cosplay. White is light through paper, or light on dust in a model, never a webpage #fff ground for its own sake.

Palette strategy: RESTRAINED with one committed signal.
- Paper / plaster / concrete dust: warm off-whites and wet-cast greys
- Ink: near-black for type on paper
- Structure: cool mill-finish metal and in-situ concrete (desaturated)
- Phase identity: three quiet material tints (not rainbow Gantt candy) matching BOQ phases
- Signal: vermilion issue-red for Longest Path, the stamp, and nothing else
- Dark instrument panels only when showing computed values (dates, float, ES/EF), like a total station readout — then return to paper

Do not use the incumbent charcoal-orange directory look (orange #FF6E00 header, crane hero, DM Serif + Work Sans costume) except as anti-reference. A new orange-on-dark industrial skin of the old page is a failed redesign.

Typography:
- Display: a condensed industrial grotesque with a point of view (search beyond Inter, Space Grotesk, DM Sans, Syne, Outfit, Plus Jakarta). Self-host. Display max ~6rem. Tracking floor -0.04em.
- Programme / HUD / tabular nums: a real drawing face or a measured grotesque with tabular lining figures. Mono is for computed values only, never as “tech costume”.
- No kicker/eyebrow labels above headings. The heading carries itself.
- No gradient text.

Materials: paper grain, ink density, mill-finish steel, wet concrete, bulldog-clip chrome if the sheet is still in frame. Author textures as plates, not CSS noise overlays.

UI chrome: almost none. No marketing header. If navigation exists, it is title-block metadata (project no., issue date, sheet number). Controls inherit the sheet/stamp/readout vocabulary — rectangular, sharp or very slightly radiused like a rubber stamp, never pill buttons, never glassmorphism.

════════════════════════════════════
6. MOTION GRAMMAR
════════════════════════════════════

Focal sequence: Acts 1→6 as one timeline. That is the authored moment. Everything else is quiet.

- Scroll scrubs the timeline (scrub: true, slight smoothing). Reverse must be exact: scrolling up unbuilds.
- Mechanical easings (power2.inOut, none for scrubbed transforms). No bounce, elastic, or spring on the building.
- SplitText only for the two or three lines that mark a new act. Not every heading.
- Camera moves are few and large (issue → isometric → hold on spine → pull back). No continuous bobbing.
- Do not fade-up-on-enter every block. If an element is in an act, it is either on the model, on the sheet, or not there.
- Prefers-reduced-motion: skip the 3D/extrusion. Crossfade a static issued sheet → a completed axonometric with Longest Path already marked → the overrun callout as a still diagram → the stamp. Keep Request Access and Sign in visible immediately. Never hide content behind motion.

Performance:
- One WebGL canvas or one SVG/Canvas 2.5D model — pick one and commit. Do not mix a Three.js building with Lottie cranes and CSS parallax.
- Target 60fps on a 1440px desktop; on mobile, a 2.5D extrusion or step-through plates is better than a dying 3D scene. Design the mobile path; do not shrink the desktop scene.
- Pause/dispose offscreen. Honor document visibility.
- No smooth-scroll library if it fights native accessibility; if Lenis is used, respect reduced motion and keyboard.

════════════════════════════════════
7. COPY RULES
════════════════════════════════════

Voice: issued, precise, planner-grade. Short. No slogans.

Banned language: “building the future”, “all-in-one”, “empower”, “seamless”, “next-gen”, “end to end”, “every site every budget”, “in control”, “revolutionize”, “AI-powered”, “trusted by teams”, any metric you cannot source from PRODUCT.md.

Preferred language (use the product’s words): Bill of Quantities, phase roots, working days, Longest Path, float, Retained Logic, issue, programme, driving, successor, lag.

Headlines should name the mechanism, not the category. Examples of the register (write better, do not copy blindly):
- “The Bill of Quantities owns the floors.”
- “Longest Path is computed on this sheet.”
- “Request Access means you may keep a copy.”

CTA:
- Primary: Request Access — the vermilion issue stamp.
- Secondary: Sign in — a quiet notation.
Routes already exist: /request-access and /login.

════════════════════════════════════
8. HARD ANTI-GOALS (INSTANT FAIL)
════════════════════════════════════

- A flat landing: sticky header, hero, logo row, 3 feature cards, screenshot mock, testimonials, pricing, footer.
- Crane / hard-hat / sunset-site stock photography. The incumbent page’s crane hero is the thing you are killing.
- A decorative 3D building that rises independently of BOQ phases and Longest Path (that is a construction-company brochure).
- Toy / isometric city / Minecraft / LEGO / playful mascot energy.
- Dark-neon Web3, particles, chromatic aberration as identity, audio gates.
- Generic SaaS PM-tool chrome (sidebar screenshots, kanban, purple gradients).
- Fake KPIs, customer logos, awards.
- Eyebrow kickers, icon+heading+text card grids, numbered “01/02/03” feature steps unless the number is a real WBS code.
- Rewriting product claims. If it is not in PRODUCT.md / this prompt, it does not exist.
- Restyling the old orange header + serif tagline and calling it new.

════════════════════════════════════
9. IMPLEMENTATION NOTES
════════════════════════════════════

- Replace src/LandingPage.jsx (and extract scene/timeline modules if the file would become a dump). Keep React Router links working.
- Real semantic HTML under the canvas: h1, actions as links, labelled reduced-motion alternative. The WebGL stage is aria-hidden; the story is in the DOM.
- Label synthetic demo data in the title block: “SYNTHETIC PROGRAMME — PRJ-2024-008”.
- Keyboard: scroll still progresses the story; stamp and sign-in are focusable at every act; skip-preloader control.
- WCAG 2.2 AA for type and controls. Vermilion on paper must pass or sit as a filled stamp with white lettering that does.
- Do not ship DESIGN.md comments, direction contracts, or prompt text in the DOM.

When you are done, a first-time visitor should be able to answer, in the page’s own vocabulary, within seconds: what this is, why Longest Path matters, and what to click.

Build the assigned idea at full commitment. A safer interpretation (static hero + “scroll to see features”) is a failed run.
```
