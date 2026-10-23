# Fix plan for QA-001 to QA-047

Plan only. No application code, configuration, or migration was changed, and the live backend was not touched while writing this. Sources: [REPORT.md](REPORT.md) (source of truth), the [2026-10-06 report](../2026-10-06/REPORT.md), `results.json`, `scenarios/`, and ADRs 0003, 0004, 0007, 0008, 0009, 0011, 0012.

## 1. Summary

The 47 issues collapse into **34 fix tasks plus 6 preparation and verification steps, about 64 hours in total** (57.5 h of fixes, 6.25 h of preparation and verification), in six phases that can each ship on their own. Every issue is mapped: 43 go straight into a task, and QA-043, 044, 046 and 047 have a verification step that must run before their fix task is started. Three sub-items are deferred with a reason (section 6). **Recommended first three tasks:** T01 (QA-001, the palette crash, 0.5 h), T06 (QA-002/003, awaited schedule writes, which is the silent data loss), and T08 (QA-015/024, bounded durations, because one bad value is saved and then locks the Scheduling tab for everyone on that project). Start V1 (the `replace_boq` check) in parallel, because every later migration depends on its answer.

## 2. State of the code against the report

`HEAD` is `c9d8ab4`, the commit both reports tested, and the working tree has no changes outside `docs/qa/`. **The code has not moved.** I opened every cited file and line; all root causes match. Corrections and additions:

| Issue | What I found |
|---|---|
| QA-003 | Lines `:258` (archive project) and `:626` (delete node) are fire-and-forget as reported, but no component calls either today. They are latent and are fixed where they become reachable (T16, T12), not in T06. |
| QA-015 | The axis is not the only quadratic site. `GanttRow` (`GanttChart.jsx:49-51`), `ActivityCards` (`ActivityTree.jsx:374-381`) and the CSV export (`scheduleReport.js:66-69`) each walk from the project start per row, and `exceptionType` (`calendar.ts:22`) does a linear search per day. |
| QA-022 | The cited line is conditional (`parent.wbsCode ? … : ""`), with the same effect. New: the seeded Clearwater rows store their **own** code in the name (`'A.1 Mobilization & Demobilization'`, `seed_clearwater.sql:96`), which makes the suggested "one-off cleanup" dangerous. See T10. |
| QA-037 | The live Clearwater seed never had span data (`seed_clearwater.sql:113`); the mock seed spans A.1 → C.pkg (`seed.js:295`). |
| QA-045 | The `syncPhaseRoots` call at `workspace.js:287` is redundant: `replace_boq` already calls `sync_phase_roots` (`schedule.sql:318`). |
| QA-046, 047 | Both are confirmed by reading (`schedule.sql:61-76`, `seed.js:5-37`; the only `keydown` handlers are Ctrl+K and the sidebar toggle). They still get an executed check (V3, V4). |
| QA-044 | Code is as described. `@supabase/auth-js` 2.115.0 is installed and still queues calls made while the auth lock is held, so the risk is plausible; sign-in works live, so it is not proven. |
| Harness | `scenarios/lib.cjs` loads Playwright from a temp folder, hard-codes the output folder and the seeded password, and appends to this session's `results.json`. `s05` has no duration-save-failure check, and QA-002 has no 2026-10-07 script at all (it was reproduced on 10-06 only). |
| Tests | Vitest runs in Node with no DOM library, so unit tests cover pure logic and the store only. UI behaviour is checked by the scenario scripts. |
| Supabase | There is no `supabase/config.toml`, so the README's `supabase db reset` needs `supabase init` and Docker first. |

## 3. QA ID to task

| QA | Sev | Task | QA | Sev | Task |
|---|---|---|---|---|---|
| 001 | High | T01 | 025 | Med | T23 |
| 002 | High | T06 | 026 | Med | T19 |
| 003 | High | T06 (+ T12, T16 for the two latent lines) | 027 | Med | T20 |
| 004 | High | T09 | 028 | Low | T20 |
| 005 | High | T09, data in T10 | 029 | Low | T09 |
| 006 | High | T16 | 030 | Med | T24 |
| 007 | High | T18 (needs decision D3) | 031 | Low | T25 |
| 008 | Med | T21, DB check in T33 | 032 | Low | T25 |
| 009 | Med | T07 | 033 | Med | T03 |
| 010 | Low | T22 | 034 | Low | T14 |
| 011 | Med | T19 | 035 | Med | T15 |
| 012 | Med | T24 | 036 | Med | T17 |
| 013 | High | T16 | 037 | Med | T31 (needs decision D7) |
| 014 | High | T12 (move/reparent deferred) | 038 | Low | T22 (restore of archived documents deferred) |
| 015 | High | T08 | 039 | Med | T25 |
| 016 | High | Question D5, then T03 for the message text | 040 | Med | T03 (code), T34 (password rotation) |
| 017 | High | T04 | 041 | Low | T13 |
| 018 | High | T05 | 042 | Low | T26 (a); (b) and (c) deferred |
| 019 | High | T05 | 043 | Med | **Verify first: V1**, then T30 |
| 020 | High | T07 | 044 | Low | **Verify first: V2**, then T29 |
| 021 | High | T02 | 045 | Low | T27 |
| 022 | High | T09, data in T10 | 046 | Low | **Verify first: V3**, then T32 |
| 023 | Med | T11 (needs decision D2) | 047 | Low | **Verify first: V4**, then T28 |
| 024 | Med | T08 (needs decision D4) | | | |

## 4. Shared root causes

One fix per cause. The first five are the groups you named; the rest are the ones I found.

| # | Cause | Issues | Task |
|---|---|---|---|
| A | Fire-and-forget writes in `src/store/workspace.js` | 002, 003 | T06 |
| B | No project-details editor, so most `projects` columns are never written | 013, 006; unblocks 007, 036 | T16 |
| C | BOQ CSV parser splits on newlines and uses bare `Number()` | 011, 026 | T19 |
| D | Schedule node identity and ordering | 004, 005, 022, **029** | T09, T10 |
| E | Unbounded numeric input | 015, 024 | T08 |
| F | **"Not loaded" is rendered as "empty".** I split 017, 018 and 019 out of group A: they are failed reads, in different files, with a different fix (a status per load, not an awaited write). | 018, 019, and the Overview "No activities" flash | T05 |
| G | **Unhandled rejections in form submit handlers** (no `try/catch/finally`, no pending flag) | 017, 020 | T04, T07 |
| H | **Mock-only affordances shown in the live build**, and developer text shown to users. No single place decides "this is the demo". | 033, 040, the message text in 016 | T03 |
| I | **One sort helper.** A depth-first ordering fixes the live order (004) and the mock phase order (029); 029 is not a separate low-priority item. | 004, 029 | T09 |
| J | **UTC date used as "today"** at three call sites | 035 | T15 |
| K | **The project tab strip** (`ProjectDetail.jsx:69-85`) | 012, 030 | T24 |
| L | **The document upload handler** | 010, 038 | T22 |
| M | **Required text is not trimmed** | 008, 009, 038, and the new editor and rename inputs | T07, T16, T12, T21, T22 share one small `requiredText` helper introduced in T07 |
| N | **Repository migrations may not match the deployed database** | 043, and it gates 037, 046 and any DB constraint | V1, T30 |

## 5. Ordering and dependencies

Corrections to the report's "Suggested fix batches":

1. **QA-021 does not wait for QA-013; it must land before it.** Keeping a null budget as null is a two-line fix that removes the false "over budget" at once. The editor (T16) must be built on "blank means not set", so T02 comes first.
2. **Do not rotate the seeded passwords in batch 1.** Every live scenario logs in with `demo123` (`lib.cjs:47`). Hide the credentials in the UI first (T03); rotate last (T34), after the harness reads credentials from the environment (P1).
3. **QA-043 must be verified before any migration is written.** If the repository cannot rebuild the deployed schema, the migrations for QA-037, QA-046 and the DB checks cannot be tested locally. V1 is first; T30 leads Phase 6.
4. **QA-015/024 move up to Phase 1.** They have no dependencies, and the bad value is persisted, so the lock-out survives a reload and affects every user of that project.
5. **QA-022 code before the QA-022 data cleanup** (T09 before T10), or new rows keep arriving with the prefix.
6. **QA-005 and QA-002/003 before QA-014** (T09 and T06 before T12): deletes need max-plus-one codes and an awaited, reported write.
7. **QA-035 and QA-009 before QA-013** (T15 and T07 before T16): the editor reuses the local-date helper and the name validation.
8. **QA-046 after QA-013** (T32 after T16): once a start date can be changed to another year, the holiday seed for the creation year is wrong in a second way.
9. **QA-017, 018, 019 are not the same pattern as the write fixes.** They can be done in parallel with T06 by a second person; T06, T08 and T09 all edit `addScheduleNode`/`setDuration` and must be done one after another.
10. **QA-028 is a dialog-state bug, not a parser bug.** It sits with QA-027 because both change the same preview dialog.
11. **QA-047 after QA-001**, since the palette cannot open today.

Dependency chains:

```
V1 ──► T30 ──► T31, T32, T33
T01 ──► V4 ──► T28
T02 ──► T16 ◄── T07, T15            T16 ──► T17, T18, T32, T34
T06 ──► T08 ──► T09 ──► T10
T06, T09 ──► T12                    T06 ──► T13
P1 ──► every scenario rerun         T03 ──► T34 (rotation last)
V2 ──► T29        V3 ──► T32        V5 ──► T10, T33
```

---

## Phase 0 — Preparation and verification (6.25 h, no application code)

### P1 — Make the scenario scripts rerunnable · 1.5 h
- **Files:** `docs/qa/2026-10-07/scenarios/lib.cjs` and the eight scripts (test tooling only).
- **Approach:** read the Playwright path, the output folder, the two base URLs and the login credentials from environment variables, defaulting to today's values. Reruns write to a new dated folder so this session's `results.json` stays as the baseline. Document the two build commands (mock build on port 5181, live build on 5182).
- **Check:** `node s08-mock-landing-links.cjs` writes its rows to the new folder and leaves `2026-10-07/results.json` unchanged.

### V1 — Is `replace_boq` in the repository the function that is deployed? (QA-043) · 1.5 h
- **Step 1, read-only on live:** in the Supabase SQL editor run `select pg_get_functiondef('public.replace_boq(uuid, jsonb)'::regprocedure);` and `supabase migration list`. Compare with `supabase/migrations/20260919223000_schedule.sql:217-321`. This reads only; it still needs your go-ahead (D10).
- **Step 2, local:** `supabase init`, `supabase db reset` in Docker, sign in as the seeded Planner, import the two-line template BOQ. Expected if the report is right: `column reference "boq_id" is ambiguous`.
- **Outcome:** decides whether T30 is a rename, a re-sync, or nothing.

### V2 — Auth callback and deactivated profile (QA-044) · 1.5 h
- **(a)** On the live build, read-only: time sign-in from click to directory, and with two tabs open sign out in one and watch the other. A hang or a multi-second stall that disappears when the callback body is deferred confirms the deadlock. Also read `_notifyAllSubscribers` in the installed `auth-js` to see whether callbacks are awaited under the lock.
- **(b)** Write the failing Vitest first: `mapStaff({ role: "planner", isActive: false })` should return `null`. No live account is deactivated for this.

### V3 — Holidays beyond the seed year (QA-046) · 0.5 h
- Failing Vitest first: with `DEFAULT_CALENDAR`, `isWorkingDay("2027-01-01")` should be `false`. Read-only on live (part of V5): list the distinct years in each `project_calendars.exceptions`.

### V4 — Palette shortcuts (QA-047) · 0.25 h, after T01
- Extend `s08` `SHELL-CTRL-K`: with the palette closed, press `G` then `P` from Settings and expect `/projects`. Expected to fail.

### V5 — Read-only audit of live data · 1 h
One set of `select` statements, run once, results saved under `docs/qa/`. It sizes T10 and T33 before they are written:
- nodes whose name starts with their parent's code plus a dot; sibling groups with duplicate `wbs_code`
- `duration_days` or `lag_days` that are fractional or above the T08 limit
- personnel rows with `end_date < start_date` or blank name/title
- LOE rows; calendar exception years; projects with identical names

---

## Phase 1 — Unblock and stop silent loss (15.5 h)

### T01 — Palette crash (QA-001) · 0.5 h
- **Files:** `src/components/ui/command.jsx`.
- **Approach:** wrap `{children}` in `<Command>` inside `CommandDialog`, as suggested. Then walk every palette command once, since none has ever been reachable.
- **Check:** `s01` `SHELL-COMMAND-PALETTE` and `s08` `SHELL-CTRL-K` (both FAIL today).

### T02 — Null budget stays null (QA-021) · 0.5 h
- **Files:** `src/data/map.js:12`, `src/store/workspace.js:225`.
- **Approach:** `budget: row.budget == null ? null : Number(row.budget)`; mock `createProject` sets `budget: null`. The Overview checks already handle null.
- **Check:** new `src/data/map.test.js` (`mapProject({ budget: null }).budget === null`); `s05` `LIVE-OVERVIEW-BUDGET-FALSE-OVERRUN`.

### T03 — Demo affordances only in mock mode (QA-033, QA-040, text of QA-016) · 1.5 h · needs D1
- **Files:** `LoginPage.jsx:20-21, 98-124`, `SignupPage.jsx:58`, `DemoBanner.jsx`, `SettingsPage.jsx:36-38, 122-130`, `src/features/auth/session.js:105-113`.
- **Approach:** gate the prefill, the credentials panel, the reset card with its FAQ entry, and the banner on `!isSupabaseConfigured`. Replace the two developer-facing sign-up errors with user text. If D1 says the live workspace is still a demo, only the reset card and the error text change.
- **Check:** `s05` `LIVE-BANNER-WORDING`, `LIVE-SETTINGS-RESET-DEMO-NOOP`; `s07` `LIVE-SIGNUP-EXISTING-EMAIL-DETAIL`; `s01` `AUTH-LOGIN-PREFILLED` must still pass on the mock build.

### T04 — Sign-in and sign-up never hang (QA-017) · 1 h
- **Files:** `LoginPage.jsx:33-45`, `SignupPage.jsx:33-45`, `src/features/auth/session.js:67-74`.
- **Approach:** `try/catch/finally` around the submit, reset `pending`, show the error. When the password is right but the profile lookup fails, also sign out, so a half-open Supabase session is not left behind.
- **Check:** `s05` `LIVE-LOGIN-PROFILE-FAILURE`.

### T05 — Loading and failed loads are not "empty" (QA-018, QA-019) · 3 h
- **Files:** `src/store/workspace.js:117-170`, `ProtectedRoute.jsx`, `SchedulingPanel.jsx:96-106`, `OverviewPanel.jsx`.
- **Approach:** `hydrate` sets `hydrateStatus: "error"` instead of `"ready"`, and `ProtectedRoute` renders an error with Retry. `ensureNetwork` records `loading` or `error` per project; Scheduling shows a skeleton or an error with Retry, and Overview shows "Loading" in place of "No activities" and withholds the "Add activities" action until the network has loaded.
- **Check:** `s05` `LIVE-WORKSPACE-LOAD-FAILURE`, `LIVE-SCHEDULE-LOAD-FAILURE`, `LIVE-SCHEDULE-LOADING-STATE`.

### T06 — Awaited schedule writes (QA-002, QA-003) · 4 h
- **Files:** `src/store/workspace.js:455-556`, `src/data/schedule.js`, `SchedulingPanel.jsx:204-217, 325-349, 467-479`.
- **Approach:** `addScheduleNode` and `setBaseline` await the server before changing state, as `addDependency` already does; the success toasts move after the await and the Add button is disabled while pending. Duration and progress stay optimistic for inline editing but roll back on failure with an error toast.
- **Two changes from the suggested fix.** Roll back the one field on the one node, not a snapshot of the schedule, or a failed edit erases a later successful one. And send only the changed column (`update … set duration_days`) instead of upserting the whole row: two quick edits to one activity otherwise race, and the slower response overwrites the other field on the server with no error. That is the same class of silent loss this task exists to remove. It is consistent with ADR 0009 (last write wins per field).
- **Check:** new `src/store/workspace.test.js` with the schedule adapter mocked: a rejected insert leaves no node in state; a rejected duration save restores the old value; a rejected baseline save leaves the old baseline. `s05` `LIVE-ADD-ACTIVITY-SAVE-FAILURE`, `LIVE-PROGRESS-SAVE-FAILURE`, `LIVE-BASELINE-SAVE-FAILURE`. Two checks must be **written first**: a duration-failure case in `s05`, and a rapid parent-then-child add in `s06` (PRJ-2026-006), which is the only reproduction of QA-002.

### T07 — Create Project: pending, errors, name validation (QA-020, QA-009) · 2 h
- **Files:** `ProjectDirectory.jsx:80-88, 193-222`, `src/data/projects.js:15-50`, new `requiredText` helper in `src/lib/utils.js`.
- **Approach:** pending flag, disabled Create button, `try/catch` with a toast; trim the name, require it, cap its length (D12). In the adapter, retry once when the insert fails with a unique-code conflict (`23505`). No migration: making `next_project_code` atomic is a larger change than the issue needs.
- **Check:** Vitest for `requiredText`; `s01` `DIR-CREATE-DOUBLE-SUBMIT`, `DIR-CREATE-WHITESPACE-NAME`, `DIR-CREATE-LONG-NAME`; `s05` `LIVE-CREATE-PROJECT-FAILURE`, `LIVE-CREATE-PROJECT-NO-PENDING-STATE` (both use an injected 503, so no live project is created).

### T08 — Bounded, whole-day durations and lags (QA-015, QA-024) · 3 h · needs D4, D6
- **Files:** `ActivityTree.jsx:207-224, 421-431`, `SchedulingPanel.jsx:513-520, 624-631, 660-680`, `src/store/workspace.js:455-473, 558-563`, `GanttChart.jsx:13-33`, `ganttHelpers.js`.
- **Approach:** one pure `clampDays(value, min, max)` used by the inputs and again in the store, rounding to whole days. Compute the axis dates in one forward pass (each week steps from the previous week's date) instead of walking from the project start for every cell. Virtualising the axis, as the report offers, is not needed once the walk is linear and the value is capped.
- **Stored data:** editing an existing out-of-range value now saves the clamped value. Existing rows are not rewritten; V5 says whether any exist.
- **Check:** new `ganttHelpers.test.js` (`clampDays(2.5) === 3`, `clampDays(200000)` returns the cap, the week-date helper for 20,000 days finishes within a time budget). `s03` `SCHED-HUGE-DURATION-PERF`, `SCHED-INLINE-DECIMAL-DURATION`, `SCHED-LINK-DECIMAL-LAG`, `SCHED-LINK-HUGE-LAG`; `s04` `SCHED-DURATION-200000-FREEZE`.

---

## Phase 2 — Schedule integrity (11.25 h)

### T09 — Node identity and order (QA-004, QA-005, QA-022, QA-029) · 3 h
- **Files:** `src/store/workspace.js:56-109, 502-556`, `src/data/schedule.js:31`, new pure helpers next to `mapNode`.
- **Approach:** `orderNodes(nodes)` sorts depth-first (roots by `sortOrder`, children by `sortOrder`, then `created_at`) and is applied in `loadNetwork` and after `syncPhaseRootsInto`, which also updates `sortOrder` and sets `wbsCode: phase.code` on mock roots. `nextWbsCode(parent, siblings)` uses the highest existing sibling index plus one, and the same for `sortOrder`. The name is stored as typed.
- **Not taking the report's alternative** of deriving codes from tree position: codes appear in exports and predecessor labels (`A.1.2FS+2`), so renumbering on every delete would change what an already exported file refers to. `DATA-MODEL.md` already describes `wbs_code` as a stored display code.
- **Stored data:** mock roots gain a `wbsCode`. Bump the persisted store version from 4 to 5; the existing `migrate` resets browser-local demo data to the seed. Nothing on the server changes.
- **Check:** new Vitest for both helpers (interleaved input comes out depth-first; siblings `.1` and `.3` produce `.4`). `s03` `SCHED-ADD-AND-LABELS`, `BOQ-REPLACE-PHASE-ORDER`; `s05` `LIVE-CLEARWATER-SCHEDULE-ORDER-LOE`.

### T10 — Clean up existing live rows (QA-022, QA-005) · 1.5 h · **changes live data**
- **Approach:** a reviewed SQL script, not a migration. Strip the parent-code prefix from names written by the old code and renumber duplicate sibling codes, taking the scope from V5.
- **Why the suggested cleanup is unsafe as written:** "remove the parent code and dot from the start of the name" also matches the seeded Clearwater rows, turning `A.1 Mobilization & Demobilization` into `1 Mobilization & Demobilization`. The predicate must exclude names that begin with the row's own code followed by a space, and the script must print a before/after list for approval before any `update`.
- **Rollback:** copy `id, name, wbs_code, sort_order` of the affected rows into a dated backup table (or CSV) in the same transaction; restoring is one `update … from backup`.
- **Check:** `s06` (PRJ-2026-006 has known prefixed rows and the duplicate `A.1.2`): names and codes before, then after.

### T11 — Refuse a link that creates a cycle (QA-023) · 1.5 h · needs D2
- **Files:** `src/store/workspace.js:558-569`, `SchedulingPanel.jsx:595-601, 660-680`.
- **Approach:** before saving, run `recalculate` on the network plus the candidate link; on a cycle, reject and show the message in the existing `predError` slot. Keep the cycle alert and recovery UI: under ADR 0009 two planners can each add a valid link that together form a cycle.
- **Check:** new engine test for the candidate check; `s03` `SCHED-CYCLE-CREATE-AND-RECOVER`.

### T12 — Delete and rename activities (QA-014, and `:626` from QA-003) · 4 h
- **Files:** `ActivityTree.jsx`, `SchedulingPanel.jsx`, `src/store/workspace.js:596-628`, `src/data/schedule.js`.
- **Approach:** a row action with Rename (a single-field update) and Delete behind `ConfirmDialog`. `deleteScheduleNode` becomes awaited and removes from state only after the server confirms. ADR 0011 makes this a hard delete with cascade and no undo, so the confirmation states how many child activities and links go with it.
- **Deferred:** move/reparent. It is a feature, and delete plus re-add covers it.
- **Check:** store test (rejected delete leaves the node in place); `s03` `SCHED-NO-DELETE-RENAME`; a live delete and rename in PRJ-2026-006 via `s06`.

### T13 — Confirm re-baseline and clear (QA-041) · 0.75 h
- **Files:** `SchedulingPanel.jsx:325-349`. `ConfirmDialog` on both; toast on clear.
- **Check:** extend `s03` `SCHED-BASELINE-FLOW` with a cancel path.

### T14 — Demo-only schedule buttons (QA-034) · 0.5 h
- **Files:** `SchedulingPanel.jsx:316-324, 391-399`. Show both buttons only when the project has a seed network; confirm before "Fix network".
- **Check:** `s03` `SCHED-SIMULATE-CYCLE-DEAD-BUTTON`, `SCHED-FIX-NETWORK-WIPES-EDITS`.

---

## Phase 3 — Project details (9.75 h)

### T15 — Local "today" (QA-035) · 0.75 h
- **Files:** new `todayIso()` in `src/lib/utils.js`; `workspace.js:227, 401`; `GanttChart.jsx:165`.
- **Check:** Vitest (`todayIso(new Date(2026, 9, 7, 4, 45)) === "2026-10-07"`); `s04` `PROJ-NEW-START-DATE-TZ`, `SCHED-TODAY-LINE-AND-START`. The unit test only fails before the fix where the machine is ahead of UTC, so the scenario is the real proof.

### T16 — Project details editor and archive (QA-013, QA-006, and `:258` from QA-003) · 6 h
- **Files:** new `src/features/projects/ProjectDetailsDialog.jsx`; `ProjectDetail.jsx:53-68`; `OverviewPanel.jsx:86-87`; `src/data/projects.js` (`updateProject`); `src/store/workspace.js:249-260`; `src/lib/permissions.js` (one `editProject` row).
- **Approach:** an "Edit details" button opens a dialog for name, client, site, stage, priority, budget, start date and target end date; the save is awaited and reports errors. Blank budget saves null (T02); target end may not precede start. Archive sits in the dialog behind a confirmation, is awaited, and returns to the directory. The Overview "Set the project start date" action opens the dialog.
- **ADR 0011:** archive is a soft delete, but no restore screen exists, so from the UI it is permanent. The confirmation must say so. Restore stays a dashboard action.
- **Stored data:** writes `projects` rows through the normal update policy. No migration.
- **Check:** `s01` `DIR-NO-EDIT-ARCHIVE-STAGE-UI`, `DIR-NEW-PROJECT-DEFAULTS`; `s05` `LIVE-OVERVIEW-START-DATE-DEADEND`. Live edit test on PRJ-2026-006 only, values restored afterwards; archive is tested on the mock build.

### T17 — "Updated" reflects changes (QA-036) · 1 h · needs D8
- **Files:** `src/store/workspace.js` write paths, `src/data/projects.js:60`.
- **Approach:** call the existing `touchProject` after a successful BOQ replace, schedule, personnel or document write, in parallel with the reload and without blocking it, and bump the local copy. A database trigger on the child tables would cover every client, but it is a live migration for a cosmetic stamp; I recommend the client call.
- **Check:** `s06` `LIVE-BOQ-PROJECT-UPDATED-STAMP`.

### T18 — One definition of project progress (QA-007) · 2 h · needs D3
- **Approach if "schedule-derived" (recommended, and what ADR 0004 implies):** load the leaf rows for all projects once during `hydrate` and compute directory progress with the existing `overallProgress`. Requests are capped at 1,000 rows by default, so this needs paging or a small read-only view.
- **Approach if "stored":** write `progress_pct` on every progress change. This contradicts the note in the schedule migration that cached metrics are not written in v1.
- **Check:** `s05` `LIVE-CLEARWATER-PROGRESS-MISMATCH`; a Vitest for the per-project grouping.

---

## Phase 4 — BOQ CSV (5.5 h)

### T19 — Quote-aware parser and number formats (QA-011, QA-026) · 3 h · needs D9
- **Files:** `src/data/mock/csv.js`, `src/data/mock/csv.test.js`.
- **Approach:** replace split-then-parse with one reader over the whole text that tracks quotes across newlines. Normalise numbers by removing currency symbols, spaces and thousands separators. Detect a semicolon delimiter from the header row.
- **Caution on the suggested fix:** semicolon files usually come from locales that write `1.000,50`. Guessing turns ₱1,000 into ₱1. Under ADR 0007 bad files fail closed, so an ambiguous number is rejected with a message that names the row and the expected format. ADR 0007 also asks for the CSV contract to be documented next to the parser; add that comment here.
- **Check:** new failing cases in `csv.test.js` for a quoted multi-line field, `"1,000,000"`, `₱1000`, a semicolon file, and an ambiguous decimal comma. `s02` `BOQ-MULTILINE-QUOTED`, `BOQ-THOUSANDS-SEPARATOR`, `BOQ-CURRENCY-SYMBOL`, `BOQ-SEMICOLON-DELIMITER`.

### T20 — Preview warnings and dialog reset (QA-027, QA-028) · 2.5 h · needs D9
- **Files:** `src/data/mock/csv.js`, `BoqPanel.jsx:134-143, 190-242`.
- **Approach:** `parseBoqCsv` returns a `warnings` list (amount differs from quantity × rate, row with no item or numbers, one phase code with two names, duplicate item codes) and the preview step shows it above the table. Cancel and close both clear the error, the preview and the textarea.
- **Check:** Vitest for each warning; `s02` `BOQ-AMOUNT-MISMATCH`, `BOQ-BLANK-ITEM-AND-DESCRIPTION`, `BOQ-INCONSISTENT-PHASE-NAME`, `BOQ-DUPLICATE-ITEM-CODES`, `BOQ-ERROR-STICKS-AFTER-CANCEL`.

---

## Phase 5 — Validation and small items (7 h)

| Task | Closes | Files | Approach | Check | h |
|---|---|---|---|---|---|
| T21 | QA-008 | `PersonnelPanel.jsx:49-62` | Trim and require name and title; reject end before start with a field message. | `s02` `PERSONNEL-REVERSED-DATES`, `PERSONNEL-WHITESPACE` | 0.75 |
| T22 | QA-010, 038 | `DocumentsPanel.jsx:49-83` | `setFile(null)` on an oversized pick; reject a 0-byte file; trim and require the title. | `s02` `DOCS-OVERSIZE-AFTER-VALID`, `DOCS-EMPTY-FILE-AND-BLANK-TITLE` | 0.75 |
| T23 | QA-025 | `scheduleReport.js:61-64` | Prefix `'` to **string** cells that start with `=`, `+`, `-`, `@`, tab or CR. Numbers are left alone: applying the suggested rule to every cell would turn a finish variance of `-3` into text. | new case in `scheduleReport.test.js`; `s03` `SCHED-CSV-EXPORT-CONTENT` | 0.5 |
| T24 | QA-012, 030 | `ProjectDetail.jsx:69-85` | `overflow-x-auto` on the `TabsList`; `activationMode="manual"` on `Tabs`. The suggested "skip when equal to the current tab" guard reads the tab from a stale render, so the second call would still navigate. | `s04` `MOBILE-TAB-STRIP-OVERFLOW`; `s01` `PROJ-TAB-BACK-BUTTON`; `s02` `PROJ-TAB-BACK-BUTTON-RETEST` | 1 |
| T25 | QA-031, 032, 039 | `ProtectedRoute.jsx:25`, `SettingsPage.jsx:51-55`, `ProjectDirectory.jsx:160-168` | Keep `search` and `hash` in the login redirect; scroll to the FAQ on each navigation, not only on mount; make the project name a link. | `s01` `ROUTE-DEEPLINK-QUERY-LOST`, `SHELL-HELP-FAQ-LINK-FROM-SETTINGS`, `DIR-ROW-KEYBOARD-ACCESS` | 1.25 |
| T26 | QA-042 (a) | `SettingsPage.jsx:75-90, 160-170` | Confirm before an Admin demotes themselves. | `s01` `SETTINGS-SELF-DEMOTE-WITH-TWO-ADMINS` | 0.5 |
| T27 | QA-045 | `workspace.js:284-288` | Measure first. Then drop the redundant `syncPhaseRoots` call and run the BOQ and network reloads in parallel. | timing recorded in `s06` `LIVE-BOQ-RETENTION-REMOVAL-RENAME` before and after | 1 |
| T28 | QA-047 | `CommandPalette.jsx:47, 52` | After V4: remove the two hints. Implementing the shortcuts is a new feature (D11). | V4 check, inverted to "no hint shown" | 0.25 |
| T29 | QA-044 | `src/features/auth/session.js:10-19, 67-74, 125-135` | After V2. (a) If confirmed: make the callback synchronous and defer its work, as Supabase documents. (b) `mapStaff` returns null for an inactive profile; sign-in signs out and says the account is inactive. | V2 timing check; `mapStaff` Vitest | 1 |

---

## Phase 6 — Database migrations (8.5 h) — all of these touch live

### T30 — Make `replace_boq` in the repository match what runs (QA-043) · 1.5 h · after V1
- **Approach:** a new migration that redefines the function with unambiguous variable names (`v_boq_id`, `v_phase_id`), using the deployed body as the base if V1 shows it differs. Never edit the applied migration file.
- **Risk and rollback:** this replaces the function behind every BOQ import. Keep the definition dumped in V1; rollback is re-running that statement. Apply on the local database first and pass the BOQ scenario there.
- **Check:** V1 step 2 goes green on a fresh local database; `s06` `LIVE-BOQ-RETENTION-REMOVAL-RENAME` still passes on PRJ-2026-006.

### T31 — Persist level-of-effort spans (QA-037) · 2.5 h · needs D7
- **Files:** new migration; `src/data/map.js:82-83, 126-140`; `supabase/seed_clearwater.sql`.
- **Approach:** two nullable columns on `schedule_nodes`, `span_start_id` and `span_end_id`, referencing `schedule_nodes(id)` with `on delete set null`; map and write them. The engine already reads these and has a test. Under ADR 0004 span references are network inputs, so they belong in the table; a rule such as "span the phase" would give Clearwater different numbers from the mock.
- **Backfill:** one row. Set Clearwater A.4 to span A.1 → C.pkg, matching the mock seed.
- **Risk and rollback:** additive and nullable. Rollback is dropping the two columns; the old client ignores them.
- **Check:** `map.test.js` round trip; `s05` `LIVE-CLEARWATER-SCHEDULE-ORDER-LOE` (expects ES/EF 0 / 232); `s04` `SCHED-LOE-ROW` unchanged on mock.

### T32 — Holidays for every year a schedule covers (QA-046) · 2.5 h · after V3 and T16 · needs D13
- **Approach:** ADR 0008 says holidays are calendar data, not engine rules, so the fix is in the data: seed the start year plus the following years in `ensure_project_calendar`, extend the mock list the same way, and add missing years to existing calendars without removing existing entries.
- **Risk and rollback:** this rewrites `project_calendars.exceptions` for every live project, and **computed finish dates of multi-year schedules will move later**. That is the correction, but it is visible. Back up `project_id, exceptions` first; rollback restores that column.
- **Check:** V3 unit test; a calendar read on PRJ-2026-006 showing more than one year.

### T33 — Database guards (DB half of QA-008; server side of QA-015/024) · 1.5 h · optional, needs D14
- **Approach:** check constraints for personnel (`end_date >= start_date`, non-blank name and title) and for whole-day, bounded `duration_days` and `lag_days`. Add as `not valid`, fix any rows V5 found, then validate.
- **Risk and rollback:** a constraint that existing rows violate fails on `validate`, not on `add`. Rollback is `drop constraint`.
- **Check:** `s06` insert of a reversed date range through the API is rejected.

### T34 — Operational clean-up · 0.5 h · your actions, needs D1 and D10
- Rotate or remove the seeded live passwords (after P1), archive the duplicate "Clownfall" projects and PRJ-2026-006 through the new editor, and, if you approve the QA-016 retest, delete the test sign-up account.

---

## 6. Deferred, with reasons

| Item | Reason |
|---|---|
| QA-014, move/reparent | A new feature. Delete and rename close the reported harm; delete plus re-add is the workaround. |
| QA-038, list and restore archived documents | The report calls it a related gap. It is a new screen, not a fix. |
| QA-042 (b), last-Admin protection in the database | Found by code review only, needs two Admins acting at the same moment, and the recovery path is documented. Needs a live trigger on `profiles`. Your call (D11). |
| QA-042 (c), mock reset leaves the mock staff list | Mock-only, and clearing it conflicts with the stated promise that "the signed-in Staff Member is unchanged". Needs a rule from you (D11). |
| QA-045, batching the per-project BOQ queries at workspace load | Not measured as a problem. T27 fixes the reported 9 seconds. |

Report observations that a fix happens to resolve: "a negative duration silently becomes 0" is now one documented clamp (T08); the developer-facing text on the sign-in page goes with T03. No other observation is touched.

## 7. Risk register

| Task | Touches | Rollback |
|---|---|---|
| V1, V5 | Live database, **read-only** | Nothing to roll back. |
| T09 | Browser-local mock data (store version bump resets it) | None needed; demo data only. |
| T10 | **Live rows** in `schedule_nodes` | Backup table written in the same transaction; restore by `update … from backup`. |
| T16 | Live `projects` rows through normal app writes | Edit back. Archive is reversed with `update projects set deleted_at = null`. |
| T08, T12 | Live schedule rows through normal app writes | T08: none needed. T12: deletes are permanent by ADR 0011; test only in PRJ-2026-006. |
| T30 | **Live function** `replace_boq` | Re-run the definition saved in V1. |
| T31 | **Live schema** (two nullable columns) and one Clearwater row | Drop the columns. |
| T32 | **Live function and every calendar row**; finish dates move | Restore `exceptions` from backup; re-create the old function. |
| T33 | **Live constraints** | `drop constraint`. |
| T34 | Live auth users and project rows | Passwords: set again. Archive: as T16. |

Rules for all live work: migrations go to a local database first; test writes go only to PRJ-2026-006; failure checks use an intercepted request, so nothing reaches the backend; every scenario that writes restores the starting state and verifies it, as `s06` and `s07` do today.

## 8. Decisions for you

The first five are the ones you listed, with my recommendation.

1. **D1 — Is the live workspace still a demo?** (QA-040, T03, T34) It holds non-seed projects, so I would treat it as not a demo: hide credentials and the banner on the live build, then rotate the seeded passwords. ADR 0012 says to seed known credentials "so demos have known credentials", so the opposite answer is also consistent.
2. **D2 — Refuse a cycle-creating link, or save and flag it?** (QA-023) Recommend refuse. The flag-and-recover screen stays either way, because concurrent edits can still produce a cycle.
3. **D3 — Which project progress is correct?** (QA-007) Recommend schedule-derived. ADR 0004 treats stored metrics as a disposable cache, and nothing has ever written the stored column.
4. **D4 — Fractional working days anywhere?** (QA-024) Recommend no. `DATA-MODEL.md` already says durations are whole days in v1.
5. **D5 — Email confirmation: turn off, or support the flow?** (QA-016) **Question: is "Confirm email" enabled under Authentication → Providers → Email?** The response suggests yes. Recommend turning it off, which matches the README and ADR 0012; supporting confirmation would need a new ADR.

Others I found:

6. **D6 — Maximum duration and lag.** (QA-015) I propose 0 to 3,650 working days per activity and −3,650 to +3,650 for lag.
7. **D7 — Level-of-effort span: stored columns, or a rule?** (QA-037) Recommend columns (T31).
8. **D8 — What should bump "Updated"?** (QA-036) BOQ replace only, or any schedule, personnel and document change? And client call (recommended) or database trigger?
9. **D9 — CSV strictness.** (QA-026, 027) Accept semicolon files but reject ambiguous decimal commas? Should any of the four QA-027 cases block the import, or all warn? I recommend all warn.
10. **D10 — Live access during the work.** May I run the read-only queries in V1 and V5, or will you run them? Do you approve the T10 data cleanup after reviewing its before/after list? Retesting sign-up with a new address creates a real auth user and profile outside PRJ-2026-006; do you want that test, and with which mailbox?
11. **D11 — Small scope calls.** Remove the "G P / G S" hints (recommended) or implement the shortcuts? Is deferring QA-042 (b) and (c) acceptable, and for (c), should a demo reset also reset roles and sign-ups?
12. **D12 — Project name length limit.** I propose 120 characters.
13. **D13 — Holidays.** (QA-046) Fix now despite Low severity, given finish dates will shift? How many years ahead (I propose five)? The mock list and the SQL list also disagree on which holidays exist; which is right?
14. **D14 — Database constraints.** (T33) Wanted, or are the client-side checks enough for now?
15. **D15 — Editor scope.** (QA-013) Is the field list in T16 right, and should the unused manual expenditure override be editable? Is "archive is permanent from the UI" acceptable until a restore screen exists?
