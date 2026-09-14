# ProjectLibre Critical Path / PERT–CPM Research Brief

**Audience:** Sadiconstruction Scheduling/Gantt (construction PM; BOQ phases → schedule).  
**Mock reference:** Clearwater Medical Center — BOQ parts A (General Requirements), B (Site Works), C (Concrete Works).  
**Date:** 2026-09-14  
**Scope:** How ProjectLibre stores and computes CPM data; MSPDI field map; import strategy for a web app.  
**Companion:** Clearwater BOQ extract + mock CPM numbers → [`docs/research/2026-09-14-pert-cpm-projectlibre.md`](research/2026-09-14-pert-cpm-projectlibre.md).

---

## Executive recommendation (Sadiconstruction)

**Prefer Option B:** import the **network** (tasks, durations, predecessors/lags, calendars/constraints) and **recompute CPM** in the app.

Do **not** treat stored `Critical` / slack / ES–LF fields as authoritative for ProjectLibre exports. ProjectLibre’s engine recomputes at runtime; sample ProjectLibre XML often emits `Critical` but **omits** `EarlyStart` / `LateStart` / `TotalSlack` / `FreeSlack`.

---

## 1. File formats

| Format | Role | Parseable without ProjectLibre desktop? |
|--------|------|----------------------------------------|
| **`.pod`** | Native ProjectLibre save | **Partially.** ≥1.5.5 embeds MSPDI XML after a marker; extract + parse XML. Pre-1.5.5 = Java serialization only → need JVM/`ObjectInputStream` (fragile). |
| **MSPDI `.xml`** | Microsoft Project XML Data Interchange; ProjectLibre Save As / import-export | **Yes.** Plain XML; best interchange for a web app. |
| **`.mpp` / `.mpx`** | MS Project binary / legacy; ProjectLibre can import via MPXJ stack | **Yes** via libraries (e.g. MPXJ), not as plain text. |

### Primary sources — `.pod` structure

MPXJ `ProjectLibreReader` (primary API docs + source):

> “The POD file contains serialized Java data, followed by an MSPDI file. This class simply locates the MSPDI file and reads it using the normal MSPDI reader class. … prior to 1.5.5 it won't contain the MSPDI file.”

- Docs: https://www.mpxj.org/apidocs/org/mpxj/projectlibre/ProjectLibreReader.html  
- How-to: https://www.mpxj.org/howto-read-projectlibre/  
- Source: https://github.com/joniles/mpxj/blob/master/src/main/java/org/mpxj/projectlibre/ProjectLibreReader.java  

**Separator string** (search for this byte sequence, then parse MSPDI from there):

```text
@@@@@@@@@@ProjectLibreSeparator_MSXML@@@@@@@@@@
```

(from `ProjectLibreReader.java` / `SearchableInputStream.java` in joniles/mpxj)

### ProjectLibre app formats (user-facing)

- Save → `.pod` (native).  
- Save As → Microsoft Project **`.xml`** (MSPDI).  
- Documented in ProjectLibre user materials (e.g. overview noting `.pod` vs `.xml` Save As). Product site: https://www.projectlibre.com/  
- Source mirrors (OpenProj lineage):  
  - https://github.com/erdincay/projectlibre  
  - https://github.com/smartqubit/projectlibre  
  - SourceForge project: https://sourceforge.net/projects/projectlibre/

### Export code path (XML)

`MSPDISerializer` builds an MPXJ `ProjectFile`, maps tasks/resources/calendars/dependencies, writes MSPDI:

- https://raw.githubusercontent.com/erdincay/projectlibre/master/openproj_exchange/src/com/projity/server/data/MSPDISerializer.java  

Dependencies are written as MPXJ predecessors:

```java
taskData.addPredecessor(predData,
  RelationType.getInstance(dependency.getDependencyType()),
  MPXConverter.toMPXDuration(dependency.getLag()));
```

---

## 2. How tasks, durations, dependencies, calendars are stored

### In-memory / Java model (runtime engine)

| Concept | Where | Notes |
|---------|--------|------|
| Task | `com.projity.pm.task.Task` / `NormalTask` | Duration, WBS, constraints, early/late schedules |
| Duration | Task duration + calendar-aware work | Working vs elapsed; milestones = zero duration |
| Dependency | `com.projity.pm.dependency.Dependency` | `dependencyType`, `lag`; pred/succ lists |
| Link type | `DependencyType` | **FF=0, FS=1, SF=2, SS=3** (same integers as MSPDI `PredecessorLink/Type`) |
| Lag | `Dependency.lag` | Duration millis; can be **%** of predecessor duration (`getLeadValue()`) |
| Calendars | `WorkingCalendar` / `WorkCalendar` | Used in dependency date calc and slack compare |
| Constraints | `ConstraintType` | ASAP=0, ALAP=1, MSO=2, MFO=3, SNET=4, SNLT=5, FNET=6, FNLT=7 (comment: “id's are same as mpx”) |

**Sources:**

- `DependencyType.java`: https://raw.githubusercontent.com/erdincay/projectlibre/master/openproj_core/src/com/projity/pm/dependency/DependencyType.java  
- `Dependency.java`: https://raw.githubusercontent.com/erdincay/projectlibre/master/openproj_core/src/com/projity/pm/dependency/Dependency.java  
- `ConstraintType.java`: https://raw.githubusercontent.com/erdincay/projectlibre/master/openproj_core/src/com/projity/pm/scheduling/ConstraintType.java  

Dependency FS/SS/FF/SF math (forward):

```java
switch (dependencyType) {
  case FS: t = end; break;
  case SS: t = begin; break;
  case FF: t = successor.calcOffsetFrom(end, ...); break;
  case SF: t = successor.calcOffsetFrom(begin, ...); break;
}
earlyDate = calendar.add(t, getLeadValue(), ...);
```

(`Dependency.calcForwardDependencyDate` — same file.)

`earlyDate` / `lateDate` on `Dependency` are **`transient`** → not durable link CPM caches; recomputed during passes.

### In MSPDI XML (interchange)

Under `Project`:

- `Calendars` / `Calendar` — base calendars, exceptions, `WeekDays`  
- `Tasks` / `Task` — identity, schedule, duration, constraints  
- Per task: `Start`, `Finish`, `Duration` (XSD duration, e.g. `PT16H0M0S`), `DurationFormat`  
- `ConstraintType`, `ConstraintDate`, `CalendarUID`  
- `PredecessorLink`: `PredecessorUID`, `Type`, `LinkLag`, `LagFormat`, optional cross-project fields  

**Observed ProjectLibre sample** (SavioSal dataset `.pod` that is MSPDI XML body): tasks include `Start`/`Finish`/`Duration`/`Critical`/`PredecessorLink`/`ConstraintType`; **no** `EarlyStart`/`LateStart`/`TotalSlack`/`FreeSlack` in that file.

- Sample: https://github.com/SavioSal/datasets/blob/master/ProjectLibre%20Sample%20Activities%20and%20Resources.pod  

MSPDI link type enum (Microsoft Learn):

| Value | Meaning |
|------:|---------|
| 0 | FF |
| 1 | FS |
| 2 | SF |
| 3 | SS |

- https://learn.microsoft.com/en-us/office-project/xml-data-interchange/type-element-multiple-parents?view=project-client-2016  
- PredecessorLink: https://learn.microsoft.com/en-us/office-project/xml-data-interchange/predecessorlink-element?view=project-client-2016  
- LinkLag: tenths of a minute — https://learn.microsoft.com/en-us/office-project/xml-data-interchange/linklag-element?view=project-client-2016  

---

## 3. Precomputed vs runtime CPM

**ProjectLibre computes CPM at runtime** via `com.projity.pm.criticalpath.CriticalPath` (implements `SchedulingAlgorithm`).

### What the engine does

Source: https://raw.githubusercontent.com/erdincay/projectlibre/master/openproj_core/src/com/projity/pm/criticalpath/CriticalPath.java  

- Builds a predecessor-ordered task list with **start/finish sentinels**.  
- On `initialize` / changes: `calculate` → `fastCalc` → one or more **forward/backward** `doPass` calls.  
- Writes results into each task’s **early** and **late** `TaskSchedule` objects.  
- Recalculates on task/dependency/calendar/assignment change (`objectChanged`).  
- Official product note: constraints / Actual Start can override pure precedence (forum): https://www.projectlibre.com/reply/5879/

### Derived (not independently “authoritative stored”) fields

From `Task.java` / `NormalTask.java` / `ScheduleWindow`:

| Field | Behavior |
|-------|----------|
| Early Start/Finish | From `earlySchedule` after forward pass |
| Late Start/Finish | From `lateSchedule` after backward pass |
| Total Slack | **Computed:** `calendar.compare(LateFinish, EarlyFinish)` |
| Free Slack | **Computed:** min over successors of free-slack-to-link, capped by total slack |
| Critical | **Computed:** forward sched → `EarlyFinish >= LateFinish`; reverse → `LateStart <= EarlyStart` |

Total / free slack (Task.java):

```java
public final long getTotalSlack() {
  return getEffectiveWorkCalendar().compare(getLateFinish(), getEarlyFinish(), false);
}

public long getFreeSlack() {
  long least = getTotalSlack();
  for (/* each successor dependency */) {
    least = Math.min(least, calcFreeSlack(dependency));
  }
  return least;
}
```

Critical (NormalTask.java):

```java
public boolean isCritical() {
  if (currentSchedule.isForward())
    return getEarlyFinish() >= getLateFinish();
  else
    return getLateStart() <= getEarlyStart();
}
```

`ScheduleWindow` javadoc literally says getTotalSlack / getFreeSlack **“Calculates”** them:  
https://raw.githubusercontent.com/erdincay/projectlibre/master/openproj_core/src/com/projity/pm/criticalpath/ScheduleWindow.java  

### Persistence nuance

- **In-memory:** ES/EF/LS/LF live on schedule objects after calc.  
- **`.pod` Java blob:** may embed object graph state, but third parties should not rely on deserializing it (MPXJ only reads the trailing MSPDI).  
- **MSPDI from ProjectLibre:** often stores scheduled `Start`/`Finish` + `Critical`; full ES/LF/slack suite is **optional** and frequently **absent** (sample above).  
- Bundled MPXJ `MSPDIWriter` *can* emit Early*/Late*/TotalSlack/Critical when writing from an MPXJ model; **FreeSlack write is commented out** in the ProjectLibre-bundled writer snapshot examined via javatips/MSPDIWriter dump.

**Bottom line:** treat CPM metrics as **runtime results**. Files store the **network + scheduled dates**; critical-path analytics should be recomputed (or regenerated by opening in an engine).

---

## 4. MSPDI XML ↔ critical-path field map

Microsoft schema (Project 2007+ XML Data Interchange). Official Task element list:  
https://learn.microsoft.com/en-us/office-project/xml-data-interchange/task-element?view=project-client-2016  

GitHub docs mirror:  
https://github.com/MicrosoftDocs/office-developer-msproject-xml-docs/blob/main/project-xml-data-interchange/task-element.md  

### Project-level

| Element | Role |
|---------|------|
| `CriticalSlackLimit` | Days (or config) of slack ≤ limit → critical |
| `MultipleCriticalPaths` | Multi-network critical paths |
| `ScheduleFromStart` / `StartDate` / `FinishDate` | Forward vs backward framing |
| `CalendarUID`, `MinutesPerDay`, `MinutesPerWeek` | Calendar / duration basis |
| `HonorConstraints` | Constraint influence on schedule |

### Task-level CPM / schedule

| Element | Type | Meaning |
|---------|------|---------|
| `Critical` | boolean 0/1 | On critical path (per writer’s rules) |
| `EarlyStart` | dateTime | Earliest start |
| `EarlyFinish` | dateTime | Earliest finish |
| `LateStart` | dateTime | Latest start without delaying project |
| `LateFinish` | dateTime | Latest finish without delaying project |
| `TotalSlack` | integer | Total float; **tenths of a minute** |
| `FreeSlack` | integer | Free float; **tenths of a minute** |
| `Start` / `Finish` | dateTime | Current scheduled dates |
| `Duration` | duration | Task duration |
| `ConstraintType` / `ConstraintDate` | int / dateTime | Hard/soft date constraints |
| `CalendarUID` | int | Task calendar (−1 = project default in samples) |

Slack units docs:

- TotalSlack: https://learn.microsoft.com/en-us/office-project/xml-data-interchange/totalslack-element?view=project-client-2016  
- FreeSlack: https://learn.microsoft.com/en-us/office-project/xml-data-interchange/freeslack-element?view=project-client-2016  
- Critical: https://learn.microsoft.com/en-us/office-project/xml-data-interchange/critical-element?view=project-client-2016  

### PredecessorLink (network)

| Element | Meaning |
|---------|---------|
| `PredecessorUID` | Predecessor task UID |
| `Type` | 0=FF, 1=FS, 2=SF, 3=SS |
| `LinkLag` | Lag in tenths of a minute |
| `LagFormat` | Units for lag display/interpretation |
| `CrossProject` / `CrossProjectName` | External pred |

---

## 5. Practical reverse-engineering for Sadiconstruction

### Option A — Import XML and trust stored CPM fields

**Pros:** Fast if file came from MS Project with full ES/LF/slack populated.  
**Cons for ProjectLibre-centric workflows:**

1. ProjectLibre XML often **lacks** Early*/Late*/slack; may only have `Critical` + `Start`/`Finish`.  
2. `Critical` alone is a boolean snapshot; no float for Gantt “near-critical” UI.  
3. Engines disagree on calendars, constraints, Actual Start, summary rollups (ProjectLibre forum acknowledges constraint/actual overrides).  
4. Duration/XML round-trip bugs reported on SourceForge (#157 duration after XML Save As).

### Option B — Import network; recompute CPM (recommended)

**Import:**

- Tasks: UID, name, duration, outline/WBS, milestone, constraint  
- Links: PredecessorUID, Type, LinkLag (+ LagFormat)  
- Project calendar + optional task calendars  
- Optionally seed display bars from `Start`/`Finish`, then overwrite with engine dates  

**Why more reliable:**

- Matches ProjectLibre’s own architecture (network in → `CriticalPath.calculate` out).  
- Independent of whether exporter filled optional CPM elements.  
- Same engine serves BOQ-driven schedule edits in-app (Clearwater parts A/B/C → activities → Gantt).  
- Deterministic tests without desktop.

**Hybrid:** If `EarlyStart`/`TotalSlack` present (MS Project export), use as **checksum** against your engine; do not use as sole source of truth.

### Suggested Sadiconstruction pipeline

```text
BOQ phases (A/B/C)
  → schedule activities (phase-colored)
  → optional MSPDI/.pod(MSPDI-tail) import
  → normalize to {tasks, preds, durations, calendar}
  → CPM forward/backward pass
  → persist ES/EF/LS/LF, TF, FF, critical
  → Gantt render
```

**.pod handling:** scan for `@@@@@@@@@@ProjectLibreSeparator_MSXML@@@@@@@@@@`, parse trailing XML; or use MPXJ (Java/.NET/Python) server-side. Prefer asking PMs to **Save As XML**.

---

## 6. Minimal classic CPM (FS only)

Assumptions: Finish-to-Start, lag ≥ 0, single calendar day unit `d`, no resource leveling, DAG (no cycles), ASAP.

**Forward pass (Early):**

```text
topo = topological_order(tasks, FS edges)
for each task T in topo:
  ES[T] = max( project_start,
               max over pred P of (EF[P] + lag(P→T)) )
  EF[T] = ES[T] + duration[T]
project_finish = max(EF)
```

**Backward pass (Late):**

```text
for each task T in reverse(topo):
  LF[T] = min( project_finish,
               min over succ S of (LS[S] - lag(T→S)) )
  LS[T] = LF[T] - duration[T]
```

**Float / critical:**

```text
TF[T] = LS[T] - ES[T]   // == LF[T] - EF[T] for FS, constant duration
FF[T] = min over succ S of (ES[S] - lag(T→S) - EF[T])
        // if no successors: FF[T] = TF[T]
Critical[T] = (TF[T] == 0)   // or TF <= CriticalSlackLimit
```

**Extend later (parity with ProjectLibre / MSPDI):** SS/FF/SF, negative lag, working calendars, constraints (SNET/FNLT/…), ALAP, summary tasks, milestones.

ProjectLibre FS kernel is the same idea with calendar `add`/`compare` and sentinels (`CriticalPath` + `Dependency.calcForwardDependencyDate`).

---

## 7. Open-source JS/TS CPM libraries

| Library | Notes | URL |
|---------|--------|-----|
| **`@consology/cpm.js`** | Small TS/JS CPM; FS/SS/FF/SF + lag; browser/Node | https://github.com/HassanEmam/cpm.js · npm `@consology/cpm.js` |
| **`cpp-cpm-engine`** | Heavier AACE-oriented CPM; npm package; construction/forensics focus | https://github.com/danafitkowski/cpp-cpm-engine |
| **`gantt-rx`** | React/TS Gantt with built-in CPM / auto-schedule | https://github.com/lucassmaestri/ganttRx |
| **MPXJ** | Not a browser CPM engine; best for **reading** `.pod`/MSPDI server-side | https://github.com/joniles/mpxj |

For Sadiconstruction v1: implement a **thin FS+calendar CPM** (or adopt `cpm.js` and add calendars) rather than embedding ProjectLibre Java.

---

## Source index (primary)

| Topic | URL |
|-------|-----|
| CriticalPath engine | https://raw.githubusercontent.com/erdincay/projectlibre/master/openproj_core/src/com/projity/pm/criticalpath/CriticalPath.java |
| Dependency + lag/types | https://raw.githubusercontent.com/erdincay/projectlibre/master/openproj_core/src/com/projity/pm/dependency/Dependency.java |
| DependencyType enum | https://raw.githubusercontent.com/erdincay/projectlibre/master/openproj_core/src/com/projity/pm/dependency/DependencyType.java |
| Slack / ES-LF accessors | https://raw.githubusercontent.com/erdincay/projectlibre/master/openproj_core/src/com/projity/pm/task/Task.java |
| isCritical | https://raw.githubusercontent.com/erdincay/projectlibre/master/openproj_core/src/com/projity/pm/task/NormalTask.java |
| MSPDI export | https://raw.githubusercontent.com/erdincay/projectlibre/master/openproj_exchange/src/com/projity/server/data/MSPDISerializer.java |
| POD→MSPDI reader | https://github.com/joniles/mpxj/blob/master/src/main/java/org/mpxj/projectlibre/ProjectLibreReader.java |
| MSPDI Task schema | https://learn.microsoft.com/en-us/office-project/xml-data-interchange/task-element?view=project-client-2016 |
| PredecessorLink | https://learn.microsoft.com/en-us/office-project/xml-data-interchange/predecessorlink-element?view=project-client-2016 |
| Sample ProjectLibre XML-in-.pod | https://github.com/SavioSal/datasets/blob/master/ProjectLibre%20Sample%20Activities%20and%20Resources.pod |

---

## Clearwater Medical Center mapping (illustrative)

| BOQ part | Schedule use |
|----------|----------------|
| **A – General Requirements** | Mobilization, permits, temp facilities — often early FS chain; may sit on critical path if gates Site Works |
| **B – Site Works** | Earthwork, utilities — parallelizable → expect **float** unless linked FS to Concrete |
| **C – Concrete Works** | Foundations/slabs — often drives finish; FS from B → critical if no lag buffer |

Import/recompute ensures A/B/C phase colors on the Gantt reflect **engine** criticality, not a stale `Critical` flag from an incomplete XML export.
