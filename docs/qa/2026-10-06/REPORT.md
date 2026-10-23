# Beta QA report — paused 2026-10-06

**Status: paused at the user's request. Testing is incomplete. No application fixes were made.**

Tested commit: `c9d8ab4ab18ffc4f043f73cf39487d61b9a20252`. Windows, Playwright Chromium, desktop 1440×1000, phone viewport 390×844, tablet viewport 768×1024. Phone/tablet checks used resized Chromium, not physical devices.

The session exercised the configured live Supabase backend with the Admin and Planner accounts shown at the sign-in gate, plus isolated browser-local demo data. Production previews were also tested. Live writes were confined to a named disposable QA project, apart from a temporary promotion/demotion of the dedicated Planner account; its original Planner role was restored and verified.

## Results so far

- **143 recorded check attempts**, including retests. Latest results cover **119 distinct check IDs: 92 PASS, 20 FAIL, 7 OBSERVED**. These are raw harness classifications, not 20 independent product bugs. Some FAIL results are blocked or inconclusive, as detailed below.
- **12 confirmed issue groups** are documented below. Multiple failing checks reproduce the same command-palette bug.
- **48 screenshots**, a schedule CSV export, and a browser-generated print PDF were saved in [evidence](evidence/).
- Existing unit tests: **26 passed across 3 files**. Production build and TypeScript check passed. Final lint run: **0 errors, 9 warnings**. Build warns about large bundles.
- Application source, configuration, dependencies, and migrations were not modified. Repository additions are confined to `docs/qa/`.

## Confirmed findings

Severity describes user impact, not an assigned development priority. High = core workflow unavailable, data loss, or materially misleading project information. Medium = broken validation, import compatibility, or workflow usability.

### QA-001 — High: opening the command palette crashes the application

**Reproduce:** Sign in. Click **Search workspace**, press **Ctrl+K**, or tap the mobile search icon.

**Expected:** Search/command dialog opens and supports navigation.

**Actual:** The application becomes blank. Browser error: `Cannot read properties of undefined (reading 'subscribe')`. Reload is needed to recover. Reproduced in demo, live production, and the mobile production viewport. Commands inside the palette cannot be beta-tested because opening it fails.

Checks: `SHELL-COMMAND-KEYBOARD`, `SHELL-COMMAND-CLICK`, `PRODUCTION-LIVE-COMMAND-CRASH`, `MOBILE-COMMAND-PALETTE`.

Evidence: [desktop crash](evidence/command-palette-crash.png), [production crash](evidence/production-command-crash.png), [mobile crash](evidence/mobile-command-crash.png), [browser errors](browser-errors.json).

### QA-002 — High: rapidly adding schedule children can silently lose activities

**Reproduce:** In a live project with BOQ roots, add a nested summary, then immediately add children under it. The tested sequence allowed approximately 800 ms between additions. Refresh the schedule.

**Expected:** Creation waits for persistence, or failed saves are reported and recoverable.

**Actual:** “Activity added” appears and the activity exists locally, but a child save receives HTTP 409 / PostgreSQL `23503`, violating `schedule_nodes_parent_id_fkey`. The child disappears after reload. Creating a dependency on the missing activity also fails with `dependencies_predecessor_id_fkey`.

Waiting for successful server responses before proceeding allowed the remaining scheduling tests to pass. The initial dependency/baseline failures were downstream effects of the missing activity, not separate confirmed engine defects.

Check: `LIVE-SCHEDULE-RAPID-ADD-DATALOSS`.

Evidence: [before reload](evidence/qa-activities-created.png), [after reload](evidence/qa-after-rapid-add-reload.png), [HTTP errors](browser-errors.json).

### QA-003 — High: failed duration saves have no visible warning

**Reproduce:** In the QA project, simulate HTTP 503 for a schedule-node save through Playwright routing. Change a persisted activity duration from 8 to 20 days and commit it. Reload.

**Expected:** The UI reports the failed save and clearly identifies an unsaved edit or restores the persisted value.

**Actual:** The UI recalculates using 20 days without a visible save error. Reload restores 8 days. A browser-level rejected promise is logged. This test used an explicitly injected failure; it does not claim that the backend was naturally unavailable.

Check: `LIVE-SCHEDULE-SAVE-FAILURE-FEEDBACK`; accompanying observation: `LIVE-SCHEDULE-SAVE-FAILURE-ROLLBACK`.

Evidence: [silent failed save](evidence/qa-save-failure-no-feedback.png), [injected HTTP 503](browser-errors.json).

### QA-004 — High: live schedule rows lose their hierarchy order

**Reproduce:** Open Clearwater Scheduling, or create a summary and children in a QA project and refresh.

**Expected:** Phase roots appear before their summaries/children, with each subtree contiguous.

**Actual:** Existing Clearwater children precede their phase roots. In the QA project, Phase B appears between the Phase A summary and its children. Indentation remains, but row order makes children appear under an unrelated phase. Visible in both the initial live project and persisted QA schedule.

Evidence: [Clearwater hierarchy](evidence/live-scheduling.png), [QA hierarchy](evidence/qa-duplicate-wbs.png).

### QA-005 — High: distinct activities receive duplicate WBS codes after a failed save

**Reproduce:** Follow QA-002. After reload, add another child under the retained summary and refresh.

**Expected:** Each sibling has a unique WBS code and dependencies identify it unambiguously.

**Actual:** Both “QA Durable Foundation” and “QA Followup” display `A.1.2`. The Longest Path reads `A.1.2 / A.1.2`, and predecessor descriptions are ambiguous. These are distinct persisted activities, not duplicate display rows.

Check: `LIVE-SCHEDULE-UNIQUE-WBS`.

Evidence: [duplicate codes](evidence/qa-duplicate-wbs.png), [CSV export](evidence/qa-schedule.csv).

### QA-006 — High: new live projects cannot complete start-date setup

**Reproduce:** Create a live project. Open Overview. Click **Set the project start date in project details**.

**Expected:** A project-details editor lets the user set the start date.

**Actual:** The action returns to the project directory, which has no date/editor control. The new project has no start date, so the schedule shows relative weeks and exported dates remain blank. This prevents a user from completing the setup action offered by the application.

Check: `LIVE-PROJECT-START-DATE-CONTROL`.

Evidence: [new-project setup](evidence/qa-new-project.png), [setup dead end](evidence/qa-start-date-deadend.png).

### QA-007 — High: directory progress disagrees with persisted schedule progress

**Reproduce:** Set the QA Foundation activity to 50% complete, with durations of 8 and 3 days across the two driving leaves. Refresh, then return to Projects.

**Expected:** Project progress agrees with the schedule, or distinct progress definitions are explained.

**Actual:** Scheduling and Overview report duration-weighted completion of 36%; the directory reports 0%. Existing Clearwater also shows 34% in the directory while its schedule reports 0%. No explanation distinguishes these values.

Check: `LIVE-PROJECT-PROGRESS-CONSISTENCY`.

Evidence: [persisted 36% schedule](evidence/qa-progress-persisted.png), [directory 0%](evidence/qa-directory-stale-progress.png).

### QA-008 — Medium: personnel end dates can precede start dates

**Reproduce:** Add personnel with start `2026-10-30` and end `2026-10-01`.

**Expected:** Validation rejects the reversed date range.

**Actual:** The live backend accepts the record and the roster displays it. The QA record was subsequently removed.

Check: `LIVE-PERSONNEL-DATE-ORDER`.

Evidence: [invalid date range](evidence/qa-personnel-reversed-dates.png).

### QA-009 — Medium: whitespace-only project names are accepted

**Reproduce:** In the isolated demo workspace, create a project whose name is three spaces.

**Expected:** A meaningful project name is required.

**Actual:** Creation succeeds and opens a project with an empty-looking heading. The isolated demo was reset afterward. Live whitespace-name persistence was not tested.

Check: `MOCK-PROJECT-WHITESPACE-NAME`.

Evidence: [blank project heading](evidence/qa-whitespace-project.png).

### QA-010 — Medium: rejecting an oversized file retains the previous upload selection

**Reproduce:** Open Upload document. Choose a valid small file, then choose a file larger than 50 MB.

**Expected:** The rejected selection clears the pending file and disables Upload.

**Actual:** A size-error toast appears and the file input becomes empty, but Upload remains enabled with the old title/file state. A user can unintentionally submit the earlier file. This was reproduced in the live production UI; the stale selection itself was not uploaded. Selecting an oversized file without a previous valid selection correctly disables Upload.

Check: `LIVE-DOCS-OVERSIZE-AFTER-VALID`.

Evidence: [stale selection](evidence/qa-stale-file-selection.png).

### QA-011 — Medium: valid CSV with a quoted multiline description is rejected

**Reproduce:** Preview a BOQ CSV whose description is a quoted field containing a newline, for example `"First line\nSecond line"` with the newline inside the quotes.

**Expected:** The quoted description is imported as one field, or the UI explicitly states a restricted CSV format.

**Actual:** Preview rejects it with **Every row needs phase_code and phase_name.** No approved BOQ was changed by this check.

Check: `LIVE-BOQ-MULTILINE-CSV`.

Evidence: [multiline CSV rejection](evidence/qa-multiline-csv-rejected.png).

### QA-012 — High on phone screens: reaching Scheduling scrolls the entire project content sideways

**Reproduce:** At a 390 px viewport, open a project and navigate to the Scheduling tab at the right end of the tab strip.

**Expected:** The tab strip can scroll independently while the project content remains aligned with the screen.

**Actual:** The entire main region scrolls horizontally. Measured main width: 390 px; scroll width: 587 px; scroll offset: 197 px. The first activity card starts at x = −169 px, clipping names and controls. The page has no document-level overflow, so the earlier body-width checks passed while missing this inner-container usability issue. Scheduling cards and editing otherwise work when brought into view.

Check: `MOBILE-TAB-HORIZONTAL-CLIPPING`.

Evidence: [clipped schedule](evidence/mobile-schedule-clipped.png), [full mobile schedule](evidence/mobile-scheduling.png).

## Coverage completed

| Area | Exercised and passing | Failures / limits |
|---|---|---|
| Public landing | Desktop/phone rendering, sign-up CTA, role toggle with keyboard, duration proof stepper/max/reset | Product tabs were enumerated; stronger interaction retest remains in scenario 16. Hero play/pause, replay, reduced-motion retests not yet run. |
| Authentication | Live seeded Admin/Planner login, protected-route redirect, invalid credentials, malformed email, password visibility; mock registration/default Planner role and duplicate registration | Live new-account success blocked by reserved-domain email rejection. Mock whitespace-name/new-account re-login retests remain inconclusive. |
| Directory | Live search; all six demo stage filters; no-match state; required-name check; live project creation | Blank-name validation, progress mismatch; sort/archive UI reachability still needs formal documentation. |
| Project overview | Existing/new project overview, BOQ/budget totals, schedule-derived completion and finish after network load | Start-date action dead end; initial load briefly displayed “No activities” before the network arrived. |
| Personnel | Required fields, live addition/persistence, cancellation, removal/persistence, empty state | Reversed date range accepted. Initial harness waits were retested successfully. |
| Documents | Empty state, required file, standalone >50 MB rejection, live upload/persistence, opening actual stored bytes, archive cancellation and persistence | Prior file retained after oversized replacement. Seed placeholder-document opening was not exhaustively checked. |
| BOQ | Missing-column/negative-value rejection, preview totals, live import, phase-root seeding, preview cancellation | Multiline CSV fails. Retaining/removing/renaming phases during replacement is inconclusive after an interrupted run. |
| Scheduling | Summary/leaf creation; FS/SS/FF/SF links, positive/negative lag with expected ES/EF/duration; duplicate/self-link prevention; cycle detection, reload and recovery; collapse; critical toggle; zoom; duration/progress persistence; baseline capture/variance/clear; CSV export; print invocation/PDF | Data-loss race, hierarchy order, duplicate WBS, silent failed save. Re-baseline replacement retest interrupted. Root-lock check passed, but should be rechecked outside the failed BOQ modal state. |
| Settings/roles | Theme toggle/reload, help/FAQ, Planner role controls hidden, live Admin staff listing, last-Admin protection, live role promotion/demotion with reload and restoration; mock reset/cancel/session preservation | Command palette fails. No role changes were left on the dedicated accounts. |
| Responsive | Phone landing/directory/navigation drawer; all project tabs render; phone activity editing; tablet activity cards | Phone tab navigation clips content. No physical-device or alternate-browser coverage yet. |

## Inconclusive checks and harness notes

The raw results retain every attempt. Do not file every raw FAIL as a defect.

- `LIVE-SIGNUP-SUCCESS`: **blocked**, not a confirmed application defect. Supabase returned `email_address_invalid` for the reserved `example.com` QA address; no live QA account was created. An approved disposable address was requested, then the user paused the session.
- `MOCK-SIGNUP-WHITESPACE-NAME` and `MOCK-NEW-ACCOUNT-LOGIN`: need stable production retests. Demo development servers shared Vite's dependency cache and occasionally reloaded during interactions. Scenario 16 was written but **never executed**.
- `LIVE-BOQ-RETENTION-REMOVAL`, `LIVE-BOQ-RENAME-SYNC`, `LIVE-BASELINE-REPLACE`: inconclusive. Replacement did not finish within the timed check; later assertions ran while a modal was still open. A dangling response wait terminated the QA driver. The underlying cause and final backend state were not established. Do not count these as three confirmed defects.
- Earlier SS/FF/SF metric failures and cancellation failures came from reading accessibility locators before closing modal animations completed. Retests passed after waiting for modal closure.
- The first >50 MB upload attempt hit Playwright's buffer-size limit. Retesting with a real temporary file confirmed the app's size cap works.
- One initial check labeled `AUTH-DEMO-PLANNER` actually used a live-backed server because blank environment overrides did not disable Vite's `.env` values. The correctly isolated demo was subsequently verified by its banner and absence of Supabase session storage. Treat that initial check as harness setup, not separate demo coverage.
- Print verification checks that the UI invokes `window.print` and captures a Playwright PDF. The OS print dialog and printed-page layout were not fully reviewed.
- Raw Playwright traces were not retained because they can contain authentication request/session data. Screenshots and sanitized HTTP/error summaries are retained.

## Observations to review next time

- The live Clearwater LOE supervision row shows ES/EF 0/0 despite a populated schedule. Its mapped span references are absent; confirm expected LOE behavior before filing.
- The shipped user-flow/site-flow documents still describe Access Requests and four roles. ADR 0012 supersedes these with open signup and Admin/Planner. The older role flows were not treated as current requirements.
- Sort, project archiving, project-details editing, activity rename/delete/reparent, calendar exception editing, and visible LS/LF metrics need a final requirement-versus-UI reachability audit. Some have data/store support or documentation but no obvious current UI. They have not been claimed as completed E2E tests.
- Workspace-load and auth-profile failure simulations in scenario 15 were **not reached** before the driver interruption. Do not cite them as tested failures.
- Multi-user concurrency, storage access isolation, expired-session handling, cross-browser coverage, final seeded-project checks, and accessibility beyond the targeted keyboard checks remain outstanding.

## Test data and pause handoff

Live QA project: **QA Beta 2026-10-06 - disposable**, code **PRJ-2026-006**, ID `9de4aee3-2efc-4805-929b-c462b12b04fd`.

The QA project remains in the backend for resumption. QA personnel were removed; QA documents were archived. Archiving retains their stored bytes by design. BOQ/schedule inputs and possibly a baseline remain in the QA project. The last replacement attempt's final state needs read-only verification before continuing. No existing project's business data was edited. The dedicated Planner account was promoted/demoted for the role test and restored to Planner.

Mock QA accounts/projects were confined to browser-local isolated contexts. The live signup attempt failed, so there is no new live account to clean up.

Start next time with [pause-state.json](pause-state.json), this report, [results.json](results.json), and [browser-errors.json](browser-errors.json). The `.scenario.txt` files preserve the executed interaction snippets and prepared continuations; they are session transcripts, not a polished independent regression suite. Scripts 15 and 16 must not be represented as fully executed. The browser driver was stopped at pause.

Resume order:

1. Verify the QA project's current BOQ/schedule state and restore browser sessions using the sign-in gate's dedicated accounts.
2. Retest BOQ phase retention/removal/rename and baseline replacement independently with correct modal/response waits.
3. Run the prepared production mock auth/public checks and the not-yet-run loading/auth failure simulations.
4. Finish live signup only when an approved disposable email is available.
5. Complete the outstanding UI reachability, seeded-data, browser/accessibility checks; consolidate final findings and decide how to remove/archive remaining QA artifacts.

No fixes, commits, GitHub issues, deployments, or external messages were made.
