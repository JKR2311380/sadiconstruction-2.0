# Sadiconstruction

Internal construction project-management domain: cost WBS (BOQ) owns schedule phase roots; time risk is evaluated with a first-party CPM engine.

## Language

### Organization & access

**Staff Member**:
An authenticated person with a Sign-in session who can use the product shell.
_Avoid_: User (ambiguous), Client, Account, Guest

**Visitor**:
An unauthenticated person limited to Landing, Sign-up, and Sign-in.
_Avoid_: Guest, Anonymous user

**Sign-up**:
Public creation of a Staff Member with email and password; no email verification; new accounts are Planners.
_Avoid_: Access Request, Registration, Invite, Screening

**Sign-in**:
Email and password authentication that establishes a Staff Member session.
_Avoid_: Login as a domain noun when Sign-in is meant; SSO (not in v1)

**Role**:
The permission set attached to a Staff Member: Admin or Planner. Capabilities live in [`docs/OPEN-DECISIONS.md`](docs/OPEN-DECISIONS.md) D1 and [`docs/adr/0012-open-signup-two-roles.md`](docs/adr/0012-open-signup-two-roles.md).
_Avoid_: Permission string soup, Job title as auth, Project Manager as a Role, Viewer as a Role

### Project directory

**Project**:
A construction job tracked end-to-end (budget, people, documents, BOQ, schedule).
_Avoid_: Job, Engagement, Site (site may be a field on Project)

**Project Stage**:
Lifecycle label on a Project: Planning, Active, On Hold, Delayed, Completed.
_Avoid_: Status (overloaded with schedule validity), State

**Project Code**:
Human-facing identifier in the form `PRJ-YYYY-NNN` (e.g. PRJ-2024-008).
_Avoid_: Slug as primary key

### Cost WBS

**Bill of Quantities (BOQ)**:
The approved cost/scope breakdown for a Project; view-only in the product shell.
_Avoid_: Estimate (pre-approval), Budget line alone

**BOQ Phase**:
A top-level billable section of the BOQ (e.g. Part A General Requirements). Owns the corresponding Schedule Phase Root.
_Avoid_: WBS root invented in Scheduling, Section (prefer Phase when billable)

**BOQ Line**:
A quantified item under a BOQ Phase (description, unit, quantity, rate, amount).
_Avoid_: Activity (that is schedule), Task

### Schedule network

**Schedule Node**:
Any row in the Scheduling WBS: a Phase Root, Nested Summary, or Leaf Activity.
_Avoid_: Task (ambiguous with OS/project-management jargon), Row

**Phase Root**:
A Schedule Node locked 1:1 to a BOQ Phase; cannot be deleted or reparented from Scheduling.
_Avoid_: Summary invented as a new billable phase

**Nested Summary**:
A Schedule Node under a Phase Root that groups children; duration is derived from descendants, not authored as driving work.
_Avoid_: Phase, LOE (LOE is a marking, not the same as summary)

**Leaf Activity**:
A Schedule Node that carries an authored Duration and participates in dependency logic.
_Avoid_: Task, Work package (unless later promoted as a term)

**Duration**:
Working-day length of a Leaf Activity on the Project Calendar.
_Avoid_: Elapsed days, Calendar days (unless explicitly elapsed)

**Dependency**:
A directed link from predecessor to successor with type FS | SS | FF | SF and lag (lead = negative lag).
_Avoid_: Link without type, Constraint (constraints are separate if introduced later)

**Project Calendar**:
The single working-day calendar for a Project (weekends/holidays). One per Project in v1.
_Avoid_: Task calendar, Resource calendar

**Computed Metrics**:
ES, EF, LS, LF, Total Float, Free Float, and Longest-Path criticality produced by the CPM Engine. Not authored truth.
_Avoid_: Stored Critical flag as source of truth

**Longest Path**:
The driving logic chain that determines project completion (AACE 49R-06 style), excluding LOE when marked.
_Avoid_: TF ≤ 0 as sole criticality

**Level of Effort (LOE)**:
A support activity whose dates span other work and must not drive Longest Path.
_Avoid_: Hammock as a different product concept (treat as LOE synonym unless split later)

**Retained Logic**:
Out-of-sequence progress rule: remaining work of a successor still respects unfinished predecessors. Only mode in v1.
_Avoid_: Progress Override

**CPM Engine**:
First-party module that topo-sorts the network, runs forward/backward passes, computes float, and marks Longest Path.
_Avoid_: Project Libre embed, Imported Critical fields

### Schedule validity

**Valid Network**:
A DAG that passes topological sort; metrics and critical paint are shown.
_Avoid_: Saved = correct

**Cycle Error**:
A directed cycle in Dependencies; CPM is halted until the planner fixes links.
_Avoid_: Soft warning while still painting critical path

### Adjacent product surfaces (named, thin)

**Document**:
A project file (plans, permits) with storage object + metadata.
_Avoid_: Attachment without project scope

**Contractor**:
An external party with certifications and project history across the directory.
_Avoid_: Vendor (unless finance later needs the split)

**Report Message**:
An inbox item (incident, delivery notice, project mail) in the Reports surface.
_Avoid_: Email (transport ≠ domain object)

## Related governing docs

- [`PRODUCT.md`](PRODUCT.md) — purpose, constraints, brand
- [`IDEA.md`](IDEA.md) — Scheduling-from-BOQ thesis
- [`docs/PRD.md`](docs/PRD.md) · [`docs/Siteflow.md`](docs/Siteflow.md) · [`docs/Userflow.md`](docs/Userflow.md)
- [`docs/ERD.md`](docs/ERD.md) · [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — seams and pivot rules
- [`docs/STATE_MANAGEMENT.md`](docs/STATE_MANAGEMENT.md) — Zustand + adapter split
- [`docs/UI_UX_GUIDELINES.md`](docs/UI_UX_GUIDELINES.md) — how to apply DESIGN.md
- [`docs/OPEN-DECISIONS.md`](docs/OPEN-DECISIONS.md) — closed; reopen via ADR
- [`docs/REPO-STATUS.md`](docs/REPO-STATUS.md) — what the codebase has today
