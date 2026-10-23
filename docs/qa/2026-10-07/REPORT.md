# QA and user-test report — 2026-10-07

Consolidated bug list for a batch fix. It continues the paused 2026-10-06 session ([previous report](../2026-10-06/REPORT.md)), keeps its issue IDs QA-001 to QA-012, and adds QA-013 to QA-047.

**No application code, configuration, or migrations were changed. Nothing was committed.** Everything added is under `docs/qa/2026-10-07/`.

## Summary

| Severity | Count | IDs |
|---|---|---|
| Critical / High | 17 | QA-001 – 007, 013 – 022 |
| Medium | 17 | QA-008, 009, 011, 012, 023 – 027, 030, 033, 035 – 037, 039, 040, 043 |
| Low | 13 | QA-010, 028, 029, 031, 032, 034, 038, 041, 042, 044 – 047 |

Severity is user impact: **High** = a core flow is unusable, data is lost or silently not saved, or the app shows materially wrong project information. **Medium** = wrong validation, misleading state, or a flow that works only with a workaround. **Low** = minor, demo-only, or needs confirmation.

Pure visual/UI polish is out of scope, per the brief. QA-012 and QA-039 are kept because they block a flow (phone scheduling, keyboard access).

### How this was tested

- Tested commit `c9d8ab4` (unchanged since the previous session). Windows 11, Playwright Chromium 1243, desktop 1440×1000 and phone 390×844.
- Production builds, not the dev server: one **mock** build (no Supabase, browser-local data) and one **live** build against the configured Supabase backend.
- 133 scripted checks in 8 scenarios: 30 pass, 48 fail, 50 observations, 7 harness errors (two are the QA-015 freeze itself, one is the page reload behind it, three were rerun in scenario 04, and the mock "Reset demo data" check hit a selector error and was only rerun on live). One raw FAIL, `MOBILE-NAV-DRAWER-SIGNOUT`, was a timing artefact and passes on retest. Raw rows: [results.json](results.json). Scripts: [scenarios/](scenarios/). Screenshots: [evidence/](evidence/).
- Full read of the application source (`src/`, `supabase/migrations/`) to find root causes. Each issue below names the file and line to change.
- Unit tests 26/26 pass, `tsc` clean, ESLint 0 errors / 9 warnings, both builds succeed.

Each issue is tagged with how it was confirmed:

- **[live]** reproduced against the Supabase backend
- **[mock]** reproduced in the mock build (same UI code path as live unless noted)
- **[injected]** live build, with the request intercepted in the browser and answered with HTTP 503, so nothing reached the backend
- **[static]** found by code review, not executed — verify before fixing

### What touched the live backend

- Sign-in with the seeded Planner account, and read-only browsing of Clearwater and the QA project.
- One sign-up attempt with the already-registered `planner@sadicon.local` address (created nothing; see QA-016).
- In the disposable project **QA Beta 2026-10-06 (PRJ-2026-006)** only: three BOQ replacements and a baseline set → replace → clear. The project was returned to its exact starting state (BOQ: phase A “QA Renamed Phase A”, one ₱200 line; four schedule rows; no baseline) and verified.
- No other project was edited. Opening a project's Scheduling tab calls `sync_phase_roots`, as it does for any user.

---

## High

### QA-001 — Command palette crashes the whole app  · [mock] reconfirmed

- **Repro:** sign in → click **Search workspace**, press **Ctrl+K**, or tap the phone search icon.
- **Actual:** blank page, `Cannot read properties of undefined (reading 'subscribe')`. Reload needed.
- **Cause:** `CommandDialog` in `src/components/ui/command.jsx:35-59` renders its children straight into `DialogContent`. The cmdk `Input`/`List`/`Item` parts need a surrounding `<Command>` (cmdk root) for their store.
- **Fix:** wrap `{children}` in `<Command>` inside `CommandDialog`. Then test the palette commands, which have never been reachable (see QA-047).
- **Evidence:** [s01-command-palette-crash.png](evidence/s01-command-palette-crash.png)

### QA-002 — Adding schedule activities quickly loses them  · [live, 10-06]

- **Actual:** “Activity added” shows, but a child whose parent insert has not finished gets HTTP 409 (`schedule_nodes_parent_id_fkey`) and disappears on reload.
- **Cause:** `addScheduleNode` updates local state then fires `void scheduleApi.saveNode(...)` (`src/store/workspace.js:551-555`). Nothing waits for the parent row to exist.
- **Fix:** make `addScheduleNode` async, await the insert before updating state (as `addDependency` already does), and disable the Add button while pending. Fix together with QA-003.

### QA-003 — Failed schedule saves are silent (wider than first reported)  · [injected]

- **Repro:** make the server reject the write, then: add an activity, change a progress %, change a duration, or click **Set baseline**.
- **Actual:** the UI keeps the new value and, for add and baseline, shows a **success** toast (“Activity added”, “Baseline saved”). Reload restores the old data. No error anywhere.
- **Cause:** every schedule write except dependencies is fire-and-forget: `src/store/workspace.js:258` (archive project), `:471` (duration), `:486` (progress), `:498` (baseline set/clear), `:554` (add node), `:626` (delete node). Dependency and personnel saves are awaited and do report errors (checked, pass).
- **Fix:** await these calls, toast on failure, and roll back or refetch the network. The success toast in `SchedulingPanel.jsx:471-478` and `:330-337` must move after the awaited save.
- **Evidence:** [s05-add-activity-save-failure.png](evidence/s05-add-activity-save-failure.png)

### QA-004 — Live schedule rows are out of hierarchy order  · [live] reconfirmed

- **Actual:** Clearwater renders `C.pkg, B.1, B.0, A.1, A, B.2, B, A.2, …` — the first phase root is row 5 of 14. The QA project showed phase B between phase A's children.
- **Cause:** `loadNetwork` orders by `sort_order` only (`src/data/schedule.js:12`), but `sort_order` is a per-sibling counter. The tree UI renders the array as given.
- **Fix:** after loading, sort nodes depth-first (roots by `sort_order`, then each node's children by `sort_order`, with a stable tiebreak such as `created_at`).
- **Evidence:** [s05-clearwater-schedule.png](evidence/s05-clearwater-schedule.png)

### QA-005 — Different activities get the same WBS code  · [live, 10-06]

- **Cause:** new code is `parent.wbsCode + "." + (sibling count + 1)` (`src/store/workspace.js:518`, same for `sortOrder` at `:521`). Any gap — a failed save today, a deleted activity once QA-014 is fixed — produces a duplicate.
- **Fix:** use max existing sibling index + 1, or derive display codes from tree position instead of storing them.

### QA-006 — “Set the project start date” leads nowhere  · [live] reconfirmed

- **Actual:** the Overview action links to `/projects` (`src/features/projects/OverviewPanel.jsx:86-87`). No start-date control exists, so live projects show week numbers, “Set start date”, and blank export dates forever.
- **Fix:** covered by QA-013.

### QA-007 — Directory progress disagrees with the schedule  · [live + mock] reconfirmed

- **Actual:** Clearwater: directory 34%, schedule and Overview 0%. QA project: directory 0%, schedule 36%.
- **Cause:** the directory prints the stored `projects.progress_pct` column (`ProjectDirectory.jsx:174`), which nothing ever updates. Overview computes from schedule leaves.
- **Fix:** pick one definition. Either compute directory progress from the schedule, or write `progress_pct` whenever progress changes.

### QA-013 — A project cannot be edited or archived after creation  · [mock + live]

- **Actual:** the project page has one button, “← All projects”. There is no way to change name, client, site, **stage**, priority, **budget**, **start date**, target end date, or to archive a project.
- **Impact:** every new project stays “Planning / Medium / ₱0 budget / no start date”. Typos and duplicates are permanent — the live workspace currently holds four identical “Clownfall” projects (PRJ-2026-002…005) that nobody can remove from the UI.
- **Cause:** not built. The store has `archiveProject`, `setProjectStage`, `setExpenditureOverride` (`src/store/workspace.js:249-280`) but nothing calls them, and the last two do not persist to Supabase. The `archiveProject` capability exists in `permissions.js`.
- **Fix:** add a project-details editor (and archive with confirmation) and persist every field. This resolves QA-006 and unblocks QA-021.
- **Evidence:** [s01-new-project-overview.png](evidence/s01-new-project-overview.png)

### QA-014 — Schedule activities cannot be deleted, renamed, or moved  · [mock]

- **Actual:** once added, an activity or summary is permanent. The only way to remove one is to drop its whole BOQ phase via CSV replacement.
- **Cause:** `deleteScheduleNode` exists (`src/store/workspace.js:596`) but no component calls it. There is no rename or reparent action at all.
- **Fix:** add delete (with confirmation, awaited — see QA-003) and rename. Fix QA-005 first, or deletes will create duplicate codes.

### QA-015 — A large duration freezes the Scheduling tab, permanently  · [mock]

- **Repro:** type a big number in an activity's duration cell and press Enter.
- **Actual:** 1,000 days: fine (0.3 s). **5,000 days: UI blocked 5.5 s. 20,000 and 200,000: the tab hangs** (no response after 60 s). The value is saved first, so reopening that project's Scheduling tab hangs again; Overview still loads. In live this would lock the schedule for every user of that project.
- **Cause:** no upper bound on duration (`ActivityTree.jsx:209-222`, `SchedulingPanel.jsx:513-519`). The Gantt axis renders one cell per week and calls `workingDateAtIndex` for each, which walks day by day from the project start (`GanttChart.jsx:19-20`, `engine/calendar.ts:32-60`) — quadratic in schedule length.
- **Fix:** cap duration and lag at a sane maximum in the inputs and in the store, and make the axis incremental (step from the previous week's date) or virtualised.

### QA-016 — Live sign-up cannot complete  · [live] — confirm in the Supabase dashboard

- **Repro:** submit the Sign-up form on the live build.
- **Actual:** the form shows **“No session after Sign-up. Turn off Auth → confirmations (working-app contract).”** The auth response carries `confirmation_sent_at`, which Supabase only returns when **email confirmation is enabled**. The README requires it to be off.
- **Limits:** tested with an already-registered address, because a brand-new address needs an approved disposable mailbox (still outstanding from 10-06). With confirmation on, a new address takes the same no-session branch.
- **Fix:** turn off “Confirm email” in the project, or support the confirmation flow. Either way replace the developer-facing messages in `src/features/auth/session.js:105-113` with user-facing text.
- **Evidence:** [s07-signup-existing-email.png](evidence/s07-signup-existing-email.png)

### QA-017 — Sign-in hangs on “Signing in…” if the profile lookup fails  · [injected]

- **Actual:** with a correct password and a failing `profiles` request, the button stays “Signing in…” forever, with no message.
- **Cause:** `signIn` can throw from `staffFromUser`/`getProfile`; `handleSubmit` has no `try/catch/finally` (`src/features/auth/LoginPage.jsx:33-45`). Same pattern in `SignupPage.jsx:33-45`.
- **Fix:** wrap in try/catch/finally, reset `pending`, show the error.
- **Evidence:** [s05-login-profile-failure.png](evidence/s05-login-profile-failure.png)

### QA-018 — A failed workspace load looks like an empty workspace  · [injected]

- **Actual:** if the project list request fails, the directory shows “₱0 expenditure across 0 jobs — No projects match”. No error, no retry. Deep links then redirect to that empty directory.
- **Cause:** `hydrate` catches the error, logs it, and sets `hydrateStatus: "ready"` (`src/store/workspace.js:139-142`).
- **Fix:** add an `error` status and render an error state with Retry in `ProtectedRoute` or the directory.
- **Evidence:** [s05-workspace-load-failure.png](evidence/s05-workspace-load-failure.png)

### QA-019 — Schedule shows “No schedule yet — load a BOQ” while loading and after a load failure  · [injected]

- **Actual:** during the network load (every visit) and permanently after a failed load, the tab says **“No schedule yet. Load an approved BOQ to establish project phases”** for a project that has a BOQ and activities. Overview then reports “No activities” and suggests adding them.
- **Cause:** `ensureNetwork` swallows errors (`src/store/workspace.js:167-169`); `SchedulingPanel.jsx:96-106` and `OverviewPanel.jsx` treat “not loaded” as “empty”.
- **Fix:** track loading/error per project; show a skeleton while loading and an error with Retry on failure.
- **Evidence:** [s05-schedule-loading.png](evidence/s05-schedule-loading.png), [s05-schedule-load-failure.png](evidence/s05-schedule-load-failure.png)

### QA-020 — Create Project: silent failure and duplicate submissions  · [injected]

- **Actual (a):** when the insert is rejected, the dialog just stays open — no message, unhandled promise rejection in the console.
- **Actual (b):** the Create button is never disabled; three quick clicks sent **three** insert requests. The four identical live “Clownfall” projects are consistent with this.
- **Cause:** `handleCreate` has no pending state and no error handling (`src/features/projects/ProjectDirectory.jsx:80-88`). A project-code collision between two users (`next_project_code` is not atomic) surfaces the same silent way.
- **Fix:** pending flag + disabled button + try/catch with a toast; retry once on a unique-code conflict.
- **Evidence:** [s05-create-project-failure.png](evidence/s05-create-project-failure.png)

### QA-021 — A project with no budget is reported as over budget  · [live]

- **Actual:** the QA project (budget never set) shows **Budget ₱0**, **“₱200 over budget”**, and the next action “Review the BOQ exceeding the project budget”. Every new project with a BOQ gets this.
- **Cause:** `mapProject` turns a null budget into 0 (`src/data/map.js:12`), so the `project.budget != null` checks in `OverviewPanel.jsx:60-61, 95, 108` are always true. Mock `createProject` also sets `budget: 0` (`workspace.js:225`).
- **Fix:** keep null as null; show “Not set”. Needs QA-013 so a budget can be entered.
- **Evidence:** [s05-qa-overview.png](evidence/s05-qa-overview.png)

### QA-022 — Activity names are rewritten with the parent's code  · [live + mock]

- **Actual:** a user types “QA Durable Foundation”; it is stored and exported as **“A.1.QA Durable Foundation”** (parent code + dot + name), then displayed as “A.1.2 A.1.QA Durable Foundation”. In mock mode, activities under a phase root also get a random id as their code (“A.cdsc Substructure”, “B.c5ol Framing”).
- **Cause:** `name: \`${parent.wbsCode}.${name}\`` at `src/store/workspace.js:510`; and `wbsCode` falls back to the generated id when the parent has no code (`:518`) — mock phase roots never get a `wbsCode` (`syncPhaseRootsInto`, `:93-107`).
- **Fix:** store the name as typed; set `wbsCode: phase.code` on mock phase roots. Existing live rows need a one-off cleanup.
- **Evidence:** [s03-new-activities.png](evidence/s03-new-activities.png), [10-06 CSV export](../2026-10-06/evidence/qa-schedule.csv)

---

## Medium

### QA-008 — Personnel validation: reversed dates and blank names  · [live 10-06, mock]

- End date before start date is accepted. **New:** a name and title of only spaces are accepted, creating a blank roster row.
- **Cause:** no validation in `PersonnelPanel.jsx:49-62`; no DB check constraint.
- **Fix:** trim and require name/title; require `end >= start`; add a DB check. Evidence: [s02-personnel-whitespace.png](evidence/s02-personnel-whitespace.png)

### QA-009 — Whitespace-only project name accepted  · [mock] reconfirmed

- **Cause:** `required` alone on `#proj-name` (`ProjectDirectory.jsx:197-202`); the name is not trimmed. Also no length limit (a 600-character name is accepted). Evidence: [s01-whitespace-project.png](evidence/s01-whitespace-project.png)

### QA-011 — BOQ CSV with a quoted multi-line field is rejected  · [mock] reconfirmed

- **Cause:** `parseBoqCsv` splits the text on newlines before handling quotes (`src/data/mock/csv.js:39-43`). Fix with QA-026 by parsing the whole text with a quote-aware reader.

### QA-012 — Phone: opening Scheduling scrolls the whole page sideways  · [mock] reconfirmed

- 390 px viewport: main region 390 px wide, 587 px scroll width, offset 197 px after tapping the Scheduling tab; activity cards are clipped.
- **Cause:** the tab strip overflows `main` (`ProjectDetail.jsx:74`), and focusing the last tab scrolls the container. Give the `TabsList` its own `overflow-x-auto`. Evidence: [s04-mobile-scheduling.png](evidence/s04-mobile-scheduling.png)

### QA-023 — The predecessor picker lets you create a dependency cycle  · [mock]

- **Repro:** A → B → C exist. Edit predecessors of A, pick C, Add link.
- **Actual:** the link is saved and the whole schedule drops into the “Dependency cycle” state (no dates, no export) until someone finds and removes it. In live this is saved for every user.
- **Fix:** exclude the target's successors from the picker, or reject the link when `recalculate` on the candidate network returns a cycle (`SchedulingPanel.jsx:595-601, 671-680`). Evidence: [s03-cycle.png](evidence/s03-cycle.png)

### QA-024 — Fractional durations and lags are accepted  · [mock]

- Inline duration accepts `2.5` (the add form blocks it). Lag accepts `1.5` — the project duration became **16.5 working days**. Lag `-9999` is also accepted.
- **Cause:** inline handler uses `Number(value)` with no rounding (`ActivityTree.jsx:216-219, 428`); lag check is only `Number.isFinite` (`SchedulingPanel.jsx:661-665`).
- **Fix:** round to whole days and bound the range in both the inputs and the store (with QA-015).

### QA-025 — Schedule CSV export allows formula injection  · [mock]

- An activity named `=HYPERLINK("http://x","click")` is exported as a live formula cell.
- **Cause:** `csvCell` only escapes quotes/commas (`src/features/scheduling/scheduleReport.js:61-64`).
- **Fix:** prefix cells starting with `=`, `+`, `-`, `@`, tab or CR with `'`. Evidence: [s03-schedule-export.csv](evidence/s03-schedule-export.csv)

### QA-026 — BOQ CSV rejects common number formats  · [mock]

- `"1,000,000"` (quoted, thousands separators) and `₱1000` fail with “Invalid quantity, rate or amount”. A semicolon-delimited file (Excel regional export) fails with “Missing columns: …” listing all eight.
- **Cause:** plain `Number()` on the cell (`csv.js:78-80`); comma-only delimiter.
- **Fix:** strip separators/currency before parsing; detect the delimiter or say so in the error.

### QA-027 — BOQ CSV accepts rows that should be questioned  · [mock]

- `quantity 2 × rate 100` with `amount 999999` imports with no warning.
- A row with only phase code/name (no item, description, unit, numbers) imports as a ₱0 line.
- Same `phase_code` with two different names: first name wins silently. Duplicate item codes accepted.
- **Fix:** validate in `parseBoqCsv` and list problems in the preview step, which already exists.

### QA-030 — Browser Back needs two presses per tab change  · [mock]

- Each tab click adds **two** history entries (history length 3 → 5 → 7), so the first Back appears to do nothing.
- **Cause (likely):** Radix Tabs fires `onValueChange` on both pointer-down and focus before the controlled value updates, and each call runs `navigate(...)` (`ProjectDetail.jsx:69-72`).
- **Fix:** skip navigation when the value equals the current tab, or set `activationMode="manual"`.

### QA-033 — Live build offers “Reset demo data” and reports success  · [live]

- Settings shows the demo reset card on the live backend; confirming toasts **“Demo data restored”** while `resetDemo` returns early (`workspace.js:188-191`, `SettingsPage.jsx:122-130, 198-201`).
- **Fix:** hide the card when Supabase is configured. Evidence: [s05-reset-demo-live.png](evidence/s05-reset-demo-live.png)

### QA-035 — Dates use UTC, so they are a day behind before 08:00 Philippine time  · [mock]

- At 04:45 Manila time on Oct 7, a new mock project got start date **2026-10-06**; the Gantt started on Oct 6.
- **Cause:** `new Date().toISOString().slice(0, 10)` at `workspace.js:227` and `:401`, and for the Today line at `GanttChart.jsx:165`.
- **Fix:** build the date from local year/month/day.

### QA-036 — Project “Updated” date never changes in live  · [live]

- After a BOQ replacement on Oct 7 the header still read “Updated Oct 6” after reload. The directory is ordered by this field.
- **Cause:** `touchProject` exists (`src/data/projects.js:60`) but is never called; `replaceBoqFromCsv` only bumps the local copy (`workspace.js:292-296`).
- **Fix:** update `projects.updated_at` from the write paths (or a DB trigger on child tables).

### QA-037 — Level-of-effort (hammock) activity loses its span in live  · [live vs mock]

- Clearwater “A.4 Supervision (LOE)”: mock shows ES/EF **0 / 232**; live shows **0 / 0**.
- **Cause:** `schedule_nodes` has no span-start/span-end columns, and `mapNode` hard-codes both to null (`src/data/map.js:82-83`); `nodeWritePayload` does not write them.
- **Fix:** add the columns (or a rule such as “span the phase”), map and write them.

### QA-039 — Project rows cannot be opened with the keyboard  · [mock]

- Directory rows are click-only `<tr>` elements with no link, button, or tabindex (`ProjectDirectory.jsx:160-164`). Fix: make the project name a link.

### QA-040 — Live sign-in page publishes working credentials  · [live]

- The live login form is pre-filled with `planner@sadicon.local` / `demo123` and lists the seeded Admin and Planner accounts with the password (`LoginPage.jsx:20-21, 98-124`). Those accounts do sign in to the live backend, which holds non-seed projects. The header banner also says “Synthetic demo data” on live (`DemoBanner.jsx:7`).
- **Fix:** show the prefill, the credentials panel and the demo banner only in mock mode; rotate or remove the seeded live accounts. Your call whether the live workspace is still a demo.

### QA-043 — `replace_boq` migration looks broken on a fresh database  · [static] — verify

- In `supabase/migrations/20260919223000_schedule.sql` the PL/pgSQL variables `boq_id` and `phase_id` share names with columns they are compared to (`where boq_id = boq_id`, `where public.boq_lines.phase_id = phase_id`, lines 258, 264, 275 and 295). PostgreSQL's default is to raise “column reference is ambiguous”.
- BOQ replacement **works** on the live backend (retested, QA project), so the deployed function probably differs from the repository. I could not run Postgres locally to prove the migration fails.
- **Fix:** run `supabase db reset` and import a BOQ. If it fails, rename the variables (`v_boq_id`, `v_phase_id`) and re-sync the repo with the deployed function.

---

## Low

### QA-010 — Oversized file leaves the Upload button enabled  · [mock] reconfirmed, downgraded

- After a valid file then a >50 MB file, the input is cleared but the old title stays and **Upload** stays enabled. In this run, clicking it was stopped by the browser's “required” check, so the old file was not uploaded.
- **Cause:** `handleFile` returns without `setFile(null)` (`DocumentsPanel.jsx:52-56`). Evidence: [s02-doc-stale-selection.png](evidence/s02-doc-stale-selection.png)

### QA-028 — BOQ dialog keeps the old error and text after Cancel  · [mock]

- Cancel does not clear `error` or the textarea (`BoqPanel.jsx:237-240`); reopening shows the previous error.

### QA-029 — Re-ordered BOQ phases keep their old order in Scheduling  · [mock]

- CSV order D, A, C → BOQ tab shows D, A, C; Scheduling shows A, C, D. `syncPhaseRootsInto` updates name/colour but not order (`workspace.js:86-92`). Mock-only path; in live, order is governed by QA-004.

### QA-031 — Login redirect drops the query string  · [mock]

- `/projects?new=1` → login → `/projects` (dialog does not open). `ProtectedRoute.jsx:25` stores only `location.pathname`.

### QA-032 — “Full FAQ in Settings” does nothing when already on Settings  · [mock]

- The scroll runs only on mount (`SettingsPage.jsx:51-55`). React to `location.hash` instead.

### QA-034 — Demo-only schedule buttons misbehave  · [mock]

- **Simulate cycle** does nothing on any project except Clearwater (hard-coded to B.2/B.3, `workspace.js:630-651`), with no feedback.
- **Fix network** replaces the whole Clearwater schedule with the seed, silently deleting activities the user added; on other projects it is shown but does nothing (`workspace.js:653-662`).

### QA-038 — Document upload accepts an empty file and a blank title  · [mock]

- A 0-byte file with a title of spaces and no type creates a row with no visible name (`DocumentsPanel.jsx:61-83`). Evidence: [s02-doc-blank-title.png](evidence/s02-doc-blank-title.png)
- Related gap: archived documents cannot be listed or restored anywhere.

### QA-041 — Re-baseline and Clear baseline act instantly  · [mock]

- Both overwrite or delete the only baseline with no confirmation and no undo (`SchedulingPanel.jsx:325-349`). Clear shows no toast.

### QA-042 — Role-change edge cases  · [mock + static]

- An Admin can demote themselves in one click, no confirmation (when a second Admin exists).
- Last-Admin protection is client-side only (`src/data/profiles.js:72-80`); the RLS policy lets any Admin update any profile, so two Admins demoting each other at once would leave none. [static]
- Mock: “Reset demo data” does not reset the mock staff list (separate `sadicon-mock-staff` storage key), so role changes and test sign-ups survive a reset. [static]

### QA-044 — Auth edge cases  · [static] — verify

- `onAuthStateChange` awaits Supabase queries inside its callback (`src/features/auth/session.js:129-133`), which Supabase documents as a deadlock risk.
- A deactivated profile (`is_active = false`) still signs in (`mapStaff` ignores `isActive`) and then sees an empty workspace because RLS blocks everything.

### QA-045 — BOQ replacement takes about 9 seconds in live  · [live]

- A 2-line BOQ took 9.1–9.3 s on three runs, with only a “Replacing...” label. Four sequential round-trips follow the RPC (`workspace.js:284-288`). Workspace load also fetches each project's BOQ with three queries (`src/data/boq.js:67-75`).

### QA-046 — Holidays exist for one year only  · [static]

- Live calendars are seeded with holidays for the creation/start year (`ensure_project_calendar` in the schedule migration); mock uses a fixed 2026 list. Dates in later years of a multi-year schedule ignore holidays. No calendar editor exists.

### QA-047 — Palette shortcut hints are not implemented  · [static]

- The palette lists “G P” and “G S” shortcuts (`CommandPalette.jsx:47, 52`) that no key handler implements. Test after fixing QA-001.

---

## Observations (not filed as bugs)

- No 404 page: unknown URLs go to the landing page; an unknown project id goes to the directory with no message; an unknown tab name renders Overview but keeps the bad URL.
- Directory has no sort controls. Personnel rows cannot be edited (remove and re-add only); identical people can be added twice.
- “+ Activity” always defaults to the first phase, ignoring the selected row. Adding a summary toasts “Activity added”. Duplicate activity names under one parent are allowed. A negative duration silently becomes 0.
- The BOQ replace dialog opens pre-filled with a 2-line sample, not the current BOQ, and the current BOQ cannot be exported.
- Landing page role toggle offers “Planner / Project Manager”; the app's roles are Admin and Planner. Landing has only three links (all valid) and no console errors.
- Mock mode: uploaded and seeded documents cannot be opened (stated in the toast).
- The 10-06 note that role changes are stale in other sessions still holds: a second tab keeps its old role until it signs in again.

## Checked and working

Deep-link return after login · sign-out then Back · wrong password · case-insensitive email · sign-up validation, success dialog, re-login (mock) · signed-in redirect away from login/signup · rail navigation · help widget and copy email · theme persistence · directory search + stage filter · last-Admin protection · personnel remove + persistence · document archive + persistence · BOQ file import · live BOQ retain / remove / rename (the three 10-06 inconclusive checks now pass) · live baseline set / replace / clear with reloads · FS link maths · progress clamping · dependency and personnel save failures show errors · missing session redirects to login · phone drawer navigation · tab refocus does not reload the workspace.

## Not covered

- Live sign-up with a brand-new address (needs a disposable mailbox; see QA-016).
- Two users editing at once, storage access isolation between accounts, token expiry mid-session.
- Firefox/Safari, physical phones, printed page layout.
- QA-043, 044, 046, 047 are code-review findings only.

## Suggested fix batches

1. **Unblock:** QA-001 (one-line wrapper), QA-016 (dashboard setting), QA-040.
2. **Stop losing data silently:** QA-002, 003, 020, 017, 018, 019 — one pattern: await the write, show pending, surface the error.
3. **Schedule integrity:** QA-004, 005, 022, 015, 024, 023, then QA-014.
4. **Project details editor:** QA-013 → closes QA-006, enables QA-021; then QA-007, 036.
5. **Input validation:** QA-008, 009, 038, and the CSV parser rewrite QA-011, 026, 027, 028.
6. **Smaller items:** QA-025, 030, 033, 035, 037, 039, 012, then the Low list.

## Leftovers to clean up

- Live: the disposable project **PRJ-2026-006** still exists (as left by the 10-06 session; unchanged by this one). It cannot be archived from the UI (QA-013).
- Nothing else was left behind: mock data lived in throwaway browser contexts, and the two local preview servers were stopped.
