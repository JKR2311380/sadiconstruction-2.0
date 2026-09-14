# Deep Research — Sadiconstruction Critical-Path Scheduling (from BOQ)

> **Ingested:** 2026-09-14 from `Downloads/Sadiconstruction CPM Research Plan.md`
> **Role:** Primary research input for later lean `PRD.md`, `Siteflow.md`, `Userflow.md` (ERD separate).
> **Cleanup:** Formula images replaced with Markdown math; trailing base64 assets removed.
> **Ingest caveat:** MSPDI `PredecessorLink/Type` in Microsoft Learn is `0=FF, 1=FS, 2=SF, 3=SS` — verify against this report’s alternate numbering before implementation. Project Libre `DependencyType` uses the same 0–3 mapping as MSPDI.

---

## **1\. Executive Synthesis**

The integration of Critical Path Method (CPM) scheduling with a Bill of Quantities (BOQ) architecture represents a mature paradigm in construction management, fundamentally treating the BOQ phases as the immutable Work Breakdown Structure (WBS). Research indicates that relying on static exports from desktop tools like Project Libre is insufficient for a dynamic, web-based project management platform due to the inherent fragility of exported calculation snapshots. Project Libre and comparable enterprise tools utilize topological sorting and runtime CPM engines to calculate dates dynamically based on network logic. To achieve algorithmic parity and ensure data integrity, Sadiconstruction must import only the raw network logic—specifically activities, durations, calendars, constraints, and dependencies—and recompute the critical path entirely within the native web application. Furthermore, evaluating construction schedules requires strict adherence to industry standards, such as the Association for the Advancement of Cost Engineering (AACE) Recommended Practice 49R-06, which prioritizes the "Longest Path" algorithm over the "Lowest Total Float" method for critical path identification. This architectural approach ensures that Level of Effort (LOE) tasks, out-of-sequence progress, and varying project calendars do not artificially skew criticality, thereby providing an accurate foundation for subsequent delay analysis and project controls.

## **2\. PERT-CPM Algorithms & Formulas**

The foundational scheduling engines of modern construction management rely on distinct but frequently conflated mathematical models: the Program Evaluation and Review Technique (PERT) and the Critical Path Method (CPM). While both models represent a project as a Directed Acyclic Graph (DAG) consisting of nodes and edges, their analytical purposes and mathematical approaches diverge significantly.

### **PERT vs. CPM in Construction Scheduling**

CPM is a deterministic model designed for construction projects with predictable activity durations, utilizing single-point time estimates to calculate the longest sequence of dependent activities. This establishes the minimum project duration and identifies the specific activities that cannot be delayed without extending the project's completion date1. In contrast, PERT is a probabilistic model originally developed for research and development environments where task durations contain high degrees of uncertainty. PERT utilizes a beta distribution to calculate an expected time based on three distinct estimates.

| Characteristic | Critical Path Method (CPM) | Program Evaluation and Review Technique (PERT) |
| :---- | :---- | :---- |
| **Primary Use Case** | Construction, predictable repetitive tasks. | Research, development, highly uncertain tasks. |
| **Duration Estimates** | Deterministic (single-point estimate). | Probabilistic (three-point estimate). |
| **Focus** | Time and cost control, establishing the longest path. | Managing time variance and schedule probability. |
| **Mathematical Basis** | Forward and backward pass arithmetic. | Beta distribution and standard deviation modeling. |

The standard PERT formula computes the expected duration ($t_e$) using the Optimistic ($a$), Most Likely ($m$), and Pessimistic ($b$) estimates:

$t_e = (a + 4m + b) / 6$

While PERT accounts for uncertainty and variance, modern construction scheduling standardizes on CPM for baseline execution. Industry guidelines, including those from AACE and the Society of Construction Law (SCL), predominantly utilize CPM, incorporating risk through separate quantitative schedule risk assessments (QSRA) rather than embedding raw PERT formulas directly into the baseline network logic1. For Sadiconstruction, the engine must execute CPM, with PERT formulas serving only as an optional, front-end data-entry aid for planners attempting to derive a single-point deterministic duration for complex tasks.

### **Network Construction and the Topological Sort**

A CPM schedule requires a rigorous structural foundation built upon tasks (nodes) and dependencies (edges). To evaluate a plan, the network must support four distinct dependency types. The Finish-to-Start (FS) dependency dictates that a successor cannot start until its predecessor finishes, serving as the default logic in construction. Start-to-Start (SS) dependencies require the successor to wait for the predecessor's commencement, while Finish-to-Finish (FF) dependencies require the successor to wait for the predecessor's completion. The Start-to-Finish (SF) dependency dictates that a successor cannot finish until the predecessor starts, though this is exceedingly rare in physical construction sequencing1. Dependencies frequently incorporate Lead (an acceleration or overlap, mathematically treated as negative lag) and Lag (a mandatory delay between activities).

Before mathematical evaluation can begin, the scheduling engine must validate that the network constitutes a valid DAG. This is achieved through a Topological Sort, commonly implemented via Kahn's Algorithm or a Depth-First Search (DFS) post-order traversal4. Kahn's algorithm operates by computing the in-degree (number of incoming edges) for every node. Nodes with an in-degree of zero are enqueued and appended to the execution list. As each node is processed, the algorithm decrements the in-degree of all its neighbors. If a neighbor's in-degree reaches zero, it is enqueued. If the algorithm terminates but the number of processed nodes is less than the total number of nodes in the graph, the engine has positively identified a directed cycle (e.g., Task A depends on Task B, which depends on Task A)6. Cycle detection is a mandatory precursor to CPM calculations; a cyclical graph cannot be scheduled.

### **Forward and Backward Pass Mechanics**

Once the network is topologically sorted, the CPM engine executes a two-pass calculation model. The Forward Pass calculates the early dates, representing the most aggressive timeline for project execution, moving from the project start date through the topological order to the final nodes.

* **Early Start (ES):** The maximum Early Finish of all immediate predecessors, adjusted for lag and calendar working days.  
  $ES = \max(EF_{pred} + lag)$  
* **Early Finish (EF):** The Early Start plus the assigned duration.  
  $EF = ES + duration$

The Backward Pass is subsequently initiated from the project's calculated completion date (or a constrained milestone date). It calculates the late dates, representing the absolute latest an activity can occur without extending the project duration. The algorithm traverses the graph in the reverse topological order.

* **Late Finish (LF):** The minimum Late Start of all immediate successors, adjusted for lag.  
  $LF = \min(LS_{succ} - lag)$  
* **Late Start (LS):** The Late Finish minus the assigned duration.  
  $LS = LF - duration$

### **Float Calculations and the Longest Path Algorithm**

Float, or slack, represents the schedule's mathematical flexibility. Total Float (TF) is the total amount of time an activity can be delayed without pushing the final project completion date, calculated either as the difference between Late Start and Early Start, or Late Finish and Early Finish. Free Float (FF) is the amount of time an activity can be delayed without delaying the Early Start of any immediate successor8.

Naïve, textbook CPM engines define the critical path strictly as the sequence of activities where Total Float is less than or equal to zero10. However, AACE Recommended Practice 49R-06 ("Identifying the Critical Path") explicitly details why this mathematical assumption breaks down in real-world construction. When a project utilizes multiple calendars (e.g., a 7-day calendar for concrete curing and a 5-day calendar for labor), or when arbitrary "Must Finish By" constraints are applied, the activities on the true critical path may exhibit positive float, or wildly negative float10.

Consequently, modern construction scheduling requires the application of the "Longest Path" algorithm. This method ignores raw Total Float values. Instead, it begins by identifying the activities that share the project's maximum Early Finish date. The algorithm then traces backward through the network, exclusively following "driving relationships" (relationships where the successor's Early Start is entirely dictated by that specific predecessor, meaning relationship Free Float equals zero)11. This creates an unbroken chain of driving logic back to the project's inception, reliably identifying the true critical sequence regardless of calendar or constraint distortions.

### **Complexities that Break Naïve CPM**

Beyond simple arithmetic, the engine must accommodate industry-specific edge cases that disrupt standard CPM rules:

> 1. **Calendars and Elapsed Time:** Construction tasks consume working days, not elapsed days. A five-day task starting on a Friday finishes on a Thursday, assuming standard weekend exclusions15. The CPM mathematics must step through complex arrays of calendar availability, meaning duration arithmetic is non-linear.  
> 2. **Level of Effort (LOE) and Hammock Activities:** These are support-type activities, such as "Project Management" or "Dewatering," that do not yield discrete deliverables. Their durations are dynamically dictated by the start and finish dates of the standard activities they span17. LOE tasks must be explicitly excluded from Longest Path tracing, as they artificially adopt the criticality of the tasks they summarize, creating false critical paths13.  
> 3. **Out-of-Sequence Progress:** When field actuals are recorded out of logical order (e.g., a successor starts before its predecessor finishes), the engine must choose a calculation mode. Under "Retained Logic," the uncompleted portion of the successor is delayed until the predecessor is fully complete. Under "Progress Override," the engine ignores the violated logic and allows the uncompleted portion of the successor to proceed immediately from the data date21. AACE RP 29R-03 strictly governs how these modes affect forensic delay analysis.  
> 4. **Ownership of Float:** The Society of Construction Law (SCL) Delay and Disruption Protocol dictates that, unless explicitly stated otherwise in the contract, Total Float is a shared project resource, consumed on a first-come, first-served basis24. Consequently, the engine must accurately baseline and track float consumption over time to facilitate dispute resolution between employers and contractors26.

### **Numeric Example: Clearwater Medical Center (PRJ-2024-008)**

To demonstrate the Longest Path vs. Total Float discrepancy, consider a simplified sub-network for the Clearwater project. Assume a continuous 7-day calendar for mathematical simplicity.

| Activity ID | Name | Duration | Predecessors | Type |
| :---- | :---- | :---- | :---- | :---- |
| A.1 | Mobilization | 10d | None | Standard |
| A.2 | Temp Facilities | 5d | A.1 (FS) | Standard |
| B.1 | Clearing | 7d | A.1 (FS) | Standard |
| B.2 | Excavation | 14d | B.1 (FS) | Standard |
| A.4 | Supervision | 31d | SS to A.1, FF to B.2 | Level of Effort (LOE) |

**Forward Pass:**

* **A.1:** ES \= 0, EF \= 10\.  
* **A.2:** ES \= 10, EF \= 15\.  
* **B.1:** ES \= 10, EF \= 17\.  
* **B.2:** ES \= 17, EF \= 31\.  
* **A.4 (LOE):** Derives its dates from its spanning logic. ES \= 0, EF \= 31\.

**Backward Pass (from Day 31):**

* **B.2:** LF \= 31, LS \= 17\. TF \= 0\.  
* **B.1:** LF \= 17, LS \= 10\. TF \= 0\.  
* **A.2:** LF \= 31 (anchors to project finish as it has no successors), LS \= 26\. TF \= 16\.  
* **A.1:** LF \= $\min(LF_{A.2}, LF_{B.1})$. LS \= 0\. TF \= 0\.  
* **A.4 (LOE):** LF \= 31, LS \= 0\. TF \= 0\.

Under a naïve Total Float calculation, Activity A.4 (Supervision) is flagged as critical because its Total Float is zero. However, using the AACE 49R-06 Longest Path algorithm, the engine traces the driving logic backwards from B.2 to B.1 to A.1. Activity A.4 is explicitly excluded because it is an LOE support task13. Thus, the true critical path is isolated accurately as A.1 → B.1 → B.2.

## **3\. Project Libre Internals & File Behavior**

Project Libre is a widely utilized open-source project management application derived directly from the deprecated OpenProj codebase28. Understanding its internal architecture and serialization behavior is critical for establishing a secure and reliable interoperability protocol for Sadiconstruction.

### **Architecture and Scheduling Engine**

Project Libre operates as a thick-client desktop Java application29. Its architecture enforces a strict separation between the in-memory scheduling engine, the graphical user interface, and the file serialization layers. The core engine does not rely on a persistent relational database for runtime calculations. Instead, upon opening a file, it loads the entire project graph into memory. When a user mutates a task duration or dependency, the application triggers a comprehensive cascade recalculation across the DAG4.

Project Libre computes Early Start, Early Finish, Late Start, Late Finish, Total Slack, and Free Slack dynamically1. The "Critical" flag is determined during this recalculation phase based on slack thresholds, rather than being retrieved as a static boolean from a data store10. The topological sorting algorithm runs inherently during the addition of any new edge, validating that the relationship does not introduce a cycle prior to recalculating the calendar-aware duration mathematics4.

### **File Behavior and Persistence Risks**

Project Libre's native storage format is the .pod file. Fundamentally, a .pod file is a binary wrapper containing serialized Java objects, representing the exact heap memory state of the application at the precise moment of saving29.

Relying on Java object serialization for third-party web interoperability is exceptionally brittle and constitutes a severe architectural risk. The embedded Java classes are highly specific to the Project Libre codebase; any slight variation in class definitions between versions can corrupt the deserialization process. To mitigate this fragility, Project Libre versions 1.5.5 and later append an embedded MSPDI (Microsoft Project Data Interchange) XML payload at the tail end of the .pod binary29. The most stable extraction vector involves entirely bypassing the proprietary Java serialization, seeking to the end of the file, and parsing the appended open-standard MSPDI XML separator.

## **4\. Reverse-Engineering / Interoperability Playbook**

To support users migrating legacy schedules generated in Microsoft Project or Project Libre, Sadiconstruction must establish a highly resilient parsing and evaluation protocol based strictly on the MSPDI XML schema. This approach frames interoperability strictly around algorithm parity and open file-format parsing, bypassing any proprietary DRM or unauthorized access protocols.

### **Parsing the MSPDI XML Schema**

MSPDI is the open-format XML equivalent of Microsoft's proprietary .mpp binary. It represents tasks, structural relationships, resources, and assignments in a highly verbose, documented format31. To accurately rebuild the network DAG within Sadiconstruction, the engine must extract specific data vectors while actively ignoring others.

Critical vectors include:

* **Tasks:** \<UID\>, \<Name\>, \<Type\>, \<Duration\>, and \<Milestone\>.  
* **Constraints:** \<ConstraintType\> and \<ConstraintDate\>. In MSPDI, constraints are represented as integers ranging from 0 to 7 (e.g., 0 for As Soon As Possible, 2 for Must Start On, 3 for Must Finish On)32.  
* **Dependencies (PredecessorLinks):** \<PredecessorUID\>, \<Type\> (where 1=FS, 2=SS, 3=FF, 4=SF), and \<LinkLag\>3.  
* **Calendars:** Base calendars, working weeks, and specific exception days. These are mathematically essential to accurately translate elapsed time into working time during the forward pass15.

### **The Role of MPXJ**

Building a custom XML parser for the MSPDI schema in a modern web stack is strongly discouraged. The schema contains vast amounts of legacy formatting, deeply nested resource assignments, and complex edge cases surrounding split tasks and duration formats. The industry standard approach relies on **MPXJ**, an open-source library that abstracts the complexities of .pod, .mpp, and MSPDI XML into a unified, predictable programmatic object model29. For Sadiconstruction, deploying a lightweight Java or C\# microservice dedicated solely to running MPXJ and serving clean JSON to the main application backend represents the most stable architecture.

### **Strategic Stance: Import Network, Recompute CPM**

When importing a schedule, product architectures face a fundamental choice between two strategies:

* **Strategy A (Trust):** Parse the XML and ingest the \<EarlyStart\>, \<LateFinish\>, \<TotalSlack\>, and \<Critical\> fields directly into the database as immutable, permanent truths.  
* **Strategy B (Recompute):** Parse only the structural data (Tasks, Durations, Calendars, Dependencies, Constraints) and pass this DAG into Sadiconstruction's proprietary CPM engine to calculate the dates and critical path natively.

Sadiconstruction must universally adopt **Strategy B**. Trusting exported CPM fields is a catastrophic failure mode for construction management products. XML exports are merely static snapshots of a specific calculation moment. If a user alters a single dependency or duration post-import, the entire network must be recalculated dynamically regardless.

Furthermore, the originating desktop software may have been configured with different calculation rules than Sadiconstruction enforces. For instance, the source file may have been evaluated using "Progress Override" instead of "Retained Logic," or its critical path may have been determined by "Lowest Total Float" rather than the mandated "Longest Path" algorithm13. By importing the raw network structural components and forcing a recomputation, Sadiconstruction guarantees algorithmic integrity and ensures the schedule behaves predictably, consistently, and reliably under the application's specific project control rules.

### **Documented Failure Modes in Interoperability**

The parsing and recomputation pipeline must gracefully handle several known edge cases:

> 1. **Summary Task Logic:** Desktop users frequently make the methodological error of tying dependencies directly to summary tasks (which, in Sadiconstruction, will represent BOQ WBS headers). A strict CPM engine should ideally push these links down to the leaf activities to prevent massive calculation loops and artificial constraint generation.  
> 2. **Calendar Mismatches:** If the imported file contains complex, nested, resource-specific calendars that Sadiconstruction does not intend to support in its first iteration, the engine will default to standard project calendars. This will invariably alter the CPM output dates, resulting in variances from the original desktop file.  
> 3. **Missing Constraints:** Malformed XML files occasionally drop Must Finish On constraints. Without this constraint, the backward pass will anchor to the natural network end rather than the contractual deadline, causing massive discrepancies in late dates and float calculations16.

## **5\. Feature & Function Inventory**

This inventory translates the domain and interoperability research into conceptual capability requirements for the subsequent PRD, Siteflow, and Userflow documents. It also incorporates competitive patterns observed in industry-standard tools.

### **Core Capabilities (Foundational Mandates)**

&nbsp;

| Capability | Conceptual Description | Domain Justification & Competitive Context |
| :---- | :---- | :---- |
| **BOQ-to-WBS Synchronization** | Top-level summary nodes in the schedule are read-only and automatically mapped from the BOQ phases (e.g., Part A, Part B). | Aligns financial scoping with time execution, a standard mandated by AACE RP 125R-2336. Competitors like Primavera P6 frequently use deep WBS/CBS integration. |
| **Network Authoring** | Creation of leaf activities under WBS nodes. Addition of dependencies (FS, SS, FF, SF) and lag/lead values. | Fundamental requirement to build a Directed Acyclic Graph (DAG)7. |
| **In-App CPM Engine** | Forward/backward pass calculation, calendar-aware duration mathematics, and strict Topological Sorting to prevent graph cycles. | Cannot rely on static XML exports; schedules require dynamic recalculation upon every edit4. |
| **Longest Path Criticality** | Identifying the critical path using driving logic tracing rather than naive Total Float thresholds. | Required for construction schedules containing Level of Effort tasks and varying calendars (AACE 49R-06)11. |
| **Split-View Gantt** | Interactive Gantt chart on the right, hierarchical task list on the left. Color-coded by BOQ phase. | The definitive standard industry UX pattern for schedule visualization8. |

### **Supporting Capabilities (High Value, Post-Foundation)**

&nbsp;

| Capability | Conceptual Description | Domain Justification & Competitive Context |
| :---- | :---- | :---- |
| **MSPDI XML / MPXJ Import** | Capability to upload .xml or .pod files to extract the underlying network graph, translating MS Project or Project Libre data. | Allows seamless onboarding of legacy schedules without punitive manual data entry29. |
| **LOE / Hammock Designation** | Explicitly marking tasks like "Supervision" as LOE so they dynamically span dates but do not drive the critical path. | Prevents false-critical paths which severely disrupt quantitative risk management13. |
| **Schedule Calculation Modes** | Toggling between Retained Logic and Progress Override for processing out-of-sequence actuals. | Required for forensic delay analysis and schedule update reviews (AACE 29R-03)21. Standard feature in Primavera P6. |
| **Delay Analysis Snapshots** | Comparing the baseline schedule network to the current update to calculate consumed Total Float. | Follows the SCL Delay and Disruption Protocol for Employer vs. Contractor delay attribution27. |

### **Explicitly Out of Scope (For Lean PRD Pruning)**

* **Probabilistic PERT Engine:** Implementing full Monte Carlo simulations or utilizing 3-point expected duration math as the primary scheduling engine. Sadiconstruction will rely strictly on deterministic CPM.  
* **Resource Leveling:** The algorithmic shifting of activities to smooth resource peaks (manpower/equipment) across time.  
* **Cost-Loaded CPM Engine:** Driving schedule logic purely through earned-value cost rules. Version 1 will keep BOQ financials and Schedule durations associated via the WBS, but mathematically independent.  
* **Authoring BOQ from Schedule:** The WBS structure flows *from* the finalized BOQ *to* the Schedule. Allowing the schedule to unilaterally generate new billable phases violates cost-control principles.

## **6\. Siteflow Research Notes**

The following outlines the required Information Architecture (IA) and screen states to inform the subsequent Siteflow document. Data models and ERDs are excluded.

**Primary Navigation & Hierarchy:**

* Project View (e.g., PRJ-2024-008 \- Clearwater Medical Center)  
  * Top-level Tabs: Overview | Key Personnel | Documents | BOQ (View Only) | **Scheduling**

**Surfaces & Panels (Scheduling Tab):**

* **Left Panel (Hierarchical Data Grid):**  
  * A collapsible tree structure. Root nodes are WBS elements inherited directly and immutably from the BOQ phases (e.g., A. General Requirements, B. Site Works). These rows are visually shaded and locked from structural edits.  
  * Child rows represent user-authored leaf Activities (e.g., B.1 Clearing).  
  * Columns: WBS Code, Name, Duration, ES, EF, LS, LF, Total Float, Predecessors.  
* **Right Panel (Time-Scaled Gantt Canvas):**  
  * A dynamic canvas rendering activity bars across a calendar header.  
  * Bars inherit aesthetic color coding from their parent BOQ phase (e.g., Phase A \= Blue, Phase B \= Green) to visually link physical execution to financial scoping.  
  * Critical path activities (determined by the Longest Path algorithm) are explicitly highlighted, typically with a red border, solid red fill, or red hash pattern.  
  * Interactive dependency arrows connect the bars.

**System States:**

* **Empty State:** Displays BOQ headers only. Prompt: "Add Activities to Phase" to begin building the network.  
* **Invalid Graph State (Cycle Error):** If the topological sort detects a cycle (e.g., Task 1 → Task 2 → Task 1), the engine immediately halts the CPM calculation. The UI disables the Gantt render, lists the cyclic node IDs in an error banner, and prompts the user for resolution4.  
* **Calculation State:** Triggered locally (or via a brief loading mechanism communicating with the backend engine) every time a duration, constraint, or predecessor is mutated by the user.

## **7\. Userflow Research Notes**

The following captures primary actor journeys, sequences, and decision points to inform the subsequent Userflow document.

**Primary Actors:**

> 1. **Project Planner / Scheduler:** Authors the logic, sets durations, validates the critical path, and manages the mathematical integrity of the network.  
> 2. **Project Manager (PM):** Reviews the schedule, tracks delays against the baseline, and communicates impacts based on BOQ phases to external stakeholders.

**Flow 1: Schedule Creation & CPM Evaluation**

> 1. **Entry:** The Planner navigates to the Scheduling tab. The system auto-populates the WBS structure from the approved BOQ phases.  
> 2. **Authoring:** The Planner adds discrete activities under BOQ Phase A and assigns deterministic durations.  
> 3. **Sequencing:** The Planner assigns predecessors (e.g., creating a Finish-to-Start link between A.1 and A.2).  
> 4. **Engine Trigger:** The system attempts a Topological Sort of the network.  
   * *Failure Path:* A cycle is detected. The system warns the user and prevents further calculation until the cyclical link is removed.  
> 5. **Calculation:** The engine successfully performs the Forward Pass (determining ES/EF) and the Backward Pass (determining LS/LF).  
> 6. **Criticality Trace:** The engine executes the Longest Path algorithm, identifying driving relationships from the project completion date backward to the start date, explicitly bypassing any tasks flagged as LOE.  
> 7. **Success:** The Gantt chart updates dynamically, painting the Longest Path tasks in the critical highlight color.

**Flow 2: Legacy Import and Algorithmic Parity**

> 1. **Entry:** The Planner selects "Import from MS Project / Project Libre."  
> 2. **Upload:** The Planner uploads an MSPDI .xml or .pod file.  
> 3. **Parsing:** The MPXJ-backed microservice parses the structural data (Tasks, Durations, Calendars, Constraints, Dependencies). Exported ES/EF/LS/LF dates and critical flags are explicitly discarded.  
> 4. **Mapping:** The system prompts the user to map the imported summary tasks to the existing, locked BOQ WBS phases.  
> 5. **Calculation:** The in-app CPM engine recomputes the schedule to generate native dates and establish the Longest Path.  
   * *Failure Path:* The imported file contains unsupported complex calendar configurations or drops a constraint during parsing, causing the native calculation to drift from the original file's dates. The system flags the variance for the Planner to review manually.

## **8\. PRD Seed (Lean)**

**Problem Statement:** Project managers consistently struggle to align financial execution (governed by the BOQ) with time execution (governed by the Schedule). Relying on external, disconnected tools like Project Libre creates massive data silos. Furthermore, trusting static XML schedule exports leads to severe algorithmic inconsistencies and broken critical paths when schedules change dynamically during project execution.

**Goals:**

* Deliver an integrated scheduling interface where the Work Breakdown Structure is inextricably and immutably linked to the Bill of Quantities.  
* Implement a robust, native CPM evaluation engine utilizing strict Topological Sorting, Forward/Backward Passes, and Longest Path logic.  
* Provide a visually intuitive, split-view Gantt interface that dynamically updates as network logic changes.

**Non-Goals:**

* Editing or mutating the BOQ financial structure via the Scheduling tab (WBS flows one-way only).  
* Implementing probabilistic PERT simulations or cost-loaded CPM calculations in the initial version.  
* Developing full desktop-grade resource leveling and smoothing algorithms.

**Core Capabilities List:**

* Read-only BOQ-to-WBS synchronization.  
* Activity and dependency authoring (supporting FS, SS, FF, SF relationships with Lag/Lead).  
* In-app CPM calculation engine (Topological sort, early/late dates, Total and Free float).  
* Longest Path critical-path identification and rendering (AACE 49R-06 compliant).  
* MSPDI XML parsing via backend service (focused strictly on network logic extraction, discarding calculated snapshots).

**Success Criteria:**

* A 1,000-activity schedule imported via an MSPDI XML file recalculates its dates natively, matching the desktop software's output with zero variance (assuming identical calculation modes like Retained Logic are utilized).  
* Users can successfully build a project schedule linked directly to the mock Clearwater Medical Center BOQ (Parts A, B, C) without triggering topological cycle errors.

**Open Questions (Pending PRD Finalization):**

* Refer to Section 10 for unresolved product decisions.

## **9\. Source Index**

To maintain rigorous traceability, the following index maps the foundational claims in this research brief to their primary sources from the provided domain literature and technical documentation.

&nbsp;

| Source ID(s) | Topic / Context | What the Source Proved |
| :---- | :---- | :---- |
| 1 | PERT vs. CPM & Graph Structure | Defined the difference between probabilistic PERT (beta distributions) and deterministic CPM, and detailed dependency types (FS, SS, etc.). |
| **\[cite: 18-34, 43-61, 90-102, 205-220\]** | AACE RP 49R-06 & Critical Path | Established the absolute necessity of utilizing the "Longest Path" algorithm over "Lowest Total Float" due to constraints and calendar distortions. |
| **\[cite: 62-71, 92\]** | Level of Effort (LOE) / Hammocks | Proved that support activities (supervision, dewatering) must be excluded from CPM driving logic tracing to prevent false critical paths. |
| **\[cite: 72-85\]** | Out of Sequence Progress (OOS) | Detailed the AACE RP 29R-03 guidelines on schedule calculation modes, specifically Retained Logic versus Progress Override. |
| 15 | Project Libre Source & Calendars | Revealed Project Libre's internal logic for handling early/late dates and the complexity of calculating durations across working days versus elapsed days. |
| **\[cite: 134-135, 201-204\]** | MPXJ Library & .pod Internals | Documented the internal structure of the Project Libre .pod format (Java serialization \+ embedded MSPDI XML) and how MPXJ safely extracts it. |
| **\[cite: 35-40, 127-133, 193-200\]** | MSPDI XML Schema | Detailed Microsoft's data interchange format, highlighting the integer mapping for specific ConstraintType variables (ASAP, MSO, etc.). |
| **\[cite: 136-150\]** | Topological Sorting & Cycle Detection | Proved that Kahn's Algorithm (or DFS) is a mandatory precursor to CPM calculations to ensure the DAG is acyclic and schedule-able. |
| **\[cite: 105-121, 151-160\]** | AACE RP 125R-23 & WBS/BOQ Integration | Provided industry standardization for linking the Cost Breakdown Structure (BOQ) with the Work Breakdown Structure (Schedule) for unified controls. |
| **\[cite: 161-170, 178-192\]** | SCL Delay & Disruption Protocol | Outlined the legal and contractual ownership of float, proving that Total Float is generally a shared project resource requiring baseline tracking. |

## **10\. Open Questions for the Product Team**

Before the team can confidently transition this research into the final, actionable PRD, Siteflow, and Userflow Markdown documents, several structural product decisions must be resolved:

> 1. **Calendar Support Architecture:** Will the initial version support multiple, distinct resource calendars (e.g., concrete activities curing 7 days a week, while site labor operates 5 days a week), or will the system enforce a single, global project calendar? Supporting multiple calendars exponentially complicates float calculations and Longest Path tracing.  
> 2. **Schedule Statusing and Updating:** When a user inputs actual progress that violates the planned logic (Out of Sequence progress), will the CPM engine automatically enforce "Retained Logic" as an immutable baseline, or will the UI expose a toggle to allow users to switch to "Progress Override" for forensic analysis?  
> 3. **WBS Rigidity:** Given that the BOQ acts as the strict master for the WBS, are users permitted to author additional, nested summary tasks *underneath* a BOQ phase, or must all user-generated items be flat, lowest-level leaf activities?  
> 4. **Legacy Import Service Deployment:** Is the engineering team cleared to deploy and maintain a discrete Java or C\# microservice specifically to run the MPXJ library for MSPDI parsing, or must this parsing logic be completely reverse-engineered within the primary Node/Python application environment?

#### **Works cited**

> 1. learning-zone/project-management-basics \- GitHub, [https://github.com/learning-zone/project-management-basics](https://github.com/learning-zone/project-management-basics)  
> 2. What are the differences and the similarities that exist ... \- Quora, [https://www.quora.com/What-are-the-differences-and-the-similarities-that-exist-among-the-following-project-planning-and-management-techniques-PERT-CPM-and-Gantt-charts](https://www.quora.com/What-are-the-differences-and-the-similarities-that-exist-among-the-following-project-planning-and-management-techniques-PERT-CPM-and-Gantt-charts)  
> 3. Task Elements and XML Structure \- Microsoft Learn, [https://learn.microsoft.com/en-us/office-project/xml-data-interchange/task-elements-and-xml-structure?view=project-client-2016](https://learn.microsoft.com/en-us/office-project/xml-data-interchange/task-elements-and-xml-structure?view=project-client-2016)  
> 4. Topological Sort Algorithm: A Practical Guide for 2026 \- FalkorDB, [https://www.falkordb.com/blog/topological-sort-algorithm-2/](https://www.falkordb.com/blog/topological-sort-algorithm-2/)  
> 5. Topological Sort in Directed Graphs | PDF \- Scribd, [https://www.scribd.com/document/977256202/Topological-Sort](https://www.scribd.com/document/977256202/Topological-Sort)  
> 6. graph \- Detecting cycles in Topological sort using Kahn's algorithm, [https://stackoverflow.com/questions/67644378/detecting-cycles-in-topological-sort-using-kahns-algorithm-in-degree-out-deg](https://stackoverflow.com/questions/67644378/detecting-cycles-in-topological-sort-using-kahns-algorithm-in-degree-out-deg)  
> 7. hajirufai/taskflow: Lightweight DAG workflow orchestration ... \- GitHub, [https://github.com/hajirufai/taskflow](https://github.com/hajirufai/taskflow)  
> 8. Construction Project Scheduling: Methods, Tools, and Best Practices, [https://www.mastt.com/guide/project-scheduling](https://www.mastt.com/guide/project-scheduling)  
> 9. Float is not Schedule Contingency, Except when it is – TomsBlog, [https://boyleprojectconsulting.com/tomsblog/2016/07/29/float-is-not-schedule-contingency-except-when-it-is/](https://boyleprojectconsulting.com/tomsblog/2016/07/29/float-is-not-schedule-contingency-except-when-it-is/)  
> 10. Total Float – TomsBlog \- Boyle Project Consulting, PLLC, [https://boyleprojectconsulting.com/tomsblog/tag/total-float/](https://boyleprojectconsulting.com/tomsblog/tag/total-float/)  
> 11. 49R-06: Identifying the Critical Path \- Alpha Corporation, [https://www.alphacorporation.com/documents/49R-06.pdf](https://www.alphacorporation.com/documents/49R-06.pdf)  
> 12. “Longest Path Value” – TomsBlog \- Boyle Project Consulting, PLLC, [https://boyleprojectconsulting.com/tomsblog/tag/longest-path-value/](https://boyleprojectconsulting.com/tomsblog/tag/longest-path-value/)  
> 13. Tom Boyle – Page 3 – TomsBlog, [https://boyleprojectconsulting.com/tomsblog/author/tomboyle1/page/3/](https://boyleprojectconsulting.com/tomsblog/author/tomboyle1/page/3/)  
> 14. Don't Confuse Critical Tasks with Critical Paths in Project Schedules, [https://boyleprojectconsulting.com/tomsblog/2018/03/29/the-difference-between-critical-tasks-and-critical-paths-in-project-schedules/](https://boyleprojectconsulting.com/tomsblog/2018/03/29/the-difference-between-critical-tasks-and-critical-paths-in-project-schedules/)  
> 15. PrimaveraReader.java \- mpxj \- GitHub, [https://github.com/claur/ProjectLibre/blob/master/projectlibre\_exchange/src/net/sf/mpxj/primavera/PrimaveraReader.java](https://github.com/claur/ProjectLibre/blob/master/projectlibre_exchange/src/net/sf/mpxj/primavera/PrimaveraReader.java)  
> 16. cpp-cpm-engine/CHANGELOG.md at main \- GitHub, [https://github.com/danafitkowski/cpp-cpm-engine/blob/main/CHANGELOG.md](https://github.com/danafitkowski/cpp-cpm-engine/blob/main/CHANGELOG.md)  
> 17. PP\&C Glossary \- NASA, [https://www.nasa.gov/ocfo/ppc-corner/ppc-glossary/](https://www.nasa.gov/ocfo/ppc-corner/ppc-glossary/)  
> 18. Glossary \- Government Technical Advisory Centre, [https://www.gtac.gov.za/wp-content/uploads/2022/01/PPM-12\_-Glossary\_v4.0\_20160329.pdf](https://www.gtac.gov.za/wp-content/uploads/2022/01/PPM-12_-Glossary_v4.0_20160329.pdf)  
> 19. Schedule Development (1x2) | PDF \- Scribd, [https://www.scribd.com/document/710007902/4-Schedule-Development-1x2](https://www.scribd.com/document/710007902/4-Schedule-Development-1x2)  
> 20. Longest Path – TomsBlog \- Boyle Project Consulting, PLLC, [https://boyleprojectconsulting.com/tomsblog/tag/longest-path/](https://boyleprojectconsulting.com/tomsblog/tag/longest-path/)  
> 21. Forensic Schedule Analysis \- 29R-03, [https://drclaim.ir/wp-content/uploads/2021/05/AACE-Recommended-Practice-Forensic-Schedule-Impact-Analysis-29R-03.pdf](https://drclaim.ir/wp-content/uploads/2021/05/AACE-Recommended-Practice-Forensic-Schedule-Impact-Analysis-29R-03.pdf)  
> 22. REALLY UNDERSTANDING MICROSOFT PROJECT, [https://www.ronwinterconsulting.com/Really\_Understanding\_Microsoft\_Project.pdf](https://www.ronwinterconsulting.com/Really_Understanding_Microsoft_Project.pdf)  
> 23. Aace CDR 3250 Legal and Practical Challenges To Implementation, [https://www.scribd.com/document/445709856/aace-cdr-3250-legal-and-practical-challenges-to-implementation-of-time-impact-analysis-method](https://www.scribd.com/document/445709856/aace-cdr-3250-legal-and-practical-challenges-to-implementation-of-time-impact-analysis-method)  
> 24. Who Owns Total Float Under the SCL Protocol? \- YouTube, [https://m.youtube.com/shorts/vG1QkE7dOlg](https://m.youtube.com/shorts/vG1QkE7dOlg)  
> 25. Float in Construction Scheduling: Who Owns It and Why?, [https://www.constructionclaimsclass.com/float-a-complex-issue-in-construction-scheduling/](https://www.constructionclaimsclass.com/float-a-complex-issue-in-construction-scheduling/)  
> 26. Assessing Delay – the SCL Options | PM World Library, [https://pmworldlibrary.net/wp-content/uploads/2023/04/pmwj128-Apr2023-Weaver-Assessing-Delay-the-SCL-Options.pdf](https://pmworldlibrary.net/wp-content/uploads/2023/04/pmwj128-Apr2023-Weaver-Assessing-Delay-the-SCL-Options.pdf)  
> 27. Delay and Disruption under the Global Frameworks \- Khaitan & Co, [https://www.khaitanco.com/sites/default/files/2025-12/Delay%20and%20Disruption%20Under%20the%20Global%20Frameworks.pdf](https://www.khaitanco.com/sites/default/files/2025-12/Delay%20and%20Disruption%20Under%20the%20Global%20Frameworks.pdf)  
> 28. Modelling of Decision Processes \- IIS Windows Server, [https://fbiweb.vsb.cz/\~sen76/data/uploads/skripta/modelling2ed.pdf](https://fbiweb.vsb.cz/~sen76/data/uploads/skripta/modelling2ed.pdf)  
> 29. ProjectLibreReader (MPXJ 16.7.0 API), [https://www.mpxj.org/apidocs/org/mpxj/projectlibre/ProjectLibreReader.html](https://www.mpxj.org/apidocs/org/mpxj/projectlibre/ProjectLibreReader.html)  
> 30. ProjectLibre files \- MPXJ, [https://www.mpxj.org/howto-read-projectlibre/](https://www.mpxj.org/howto-read-projectlibre/)  
> 31. MPP file extension \- Microsoft Project File, [https://file-extensions.com/docs/mpp](https://file-extensions.com/docs/mpp)  
> 32. Project Online closes on 30 September. Six fields that export cleanly, [https://www.reddit.com/r/MSProject/comments/1wbyddn/project\_online\_closes\_on\_30\_september\_six\_fields/](https://www.reddit.com/r/MSProject/comments/1wbyddn/project_online_closes_on_30_september_six_fields/)  
> 33. PS.ConstraintType enumeration (ps.js) \- Microsoft Learn, [https://learn.microsoft.com/en-us/previous-versions/office/project-javascript-api/jj668537(v=office.15)](https://learn.microsoft.com/en-us/previous-versions/office/project-javascript-api/jj668537\(v=office.15\))  
> 34. ConstraintType enumeration (Microsoft.ProjectServer.Client), [https://learn.microsoft.com/en-us/previous-versions/office/project-class/jj232955(v=office.15)](https://learn.microsoft.com/en-us/previous-versions/office/project-class/jj232955\(v=office.15\))  
> 35. Changelog \- MPXJ, [https://www.mpxj.org/CHANGELOG/](https://www.mpxj.org/CHANGELOG/)  
> 36. Construction Planning and Scheduling: Complete Guide 2026, [https://www.constructionplacements.com/construction-planning-and-scheduling/](https://www.constructionplacements.com/construction-planning-and-scheduling/)  
> 37. Life Cycle Cost Integrative Management in Construction Engineering, [https://www.researchgate.net/publication/224133894\_Life\_Cycle\_Cost\_Integrative\_Management\_in\_Construction\_Engineering](https://www.researchgate.net/publication/224133894_Life_Cycle_Cost_Integrative_Management_in_Construction_Engineering)  
> 38. Topological Sorting — Dependency Resolution | by Arya \- Medium, [https://arvita-writes.medium.com/topological-sorting-dependency-resolution-40a605e6a605](https://arvita-writes.medium.com/topological-sorting-dependency-resolution-40a605e6a605)  
> 39. Track Your Project Float Like a Pro (5 Proven Steps to Nail Project, [https://planrama.com/track-your-project-float-like-a-pro-5-proven-steps-to-nail-project-deadline/](https://planrama.com/track-your-project-float-like-a-pro-5-proven-steps-to-nail-project-deadline/)  
> 40. Integrated Approach to Overcome Shortcomings in Current Delay, [https://ascelibrary.org/doi/10.1061/%28ASCE%29CO.1943-7862.0000946](https://ascelibrary.org/doi/10.1061/%28ASCE%29CO.1943-7862.0000946)
