/** Demo seed — synthetic, labeled as such in the chrome. */

export const DEMO_PASSWORD = "demo"

export const PH_HOLIDAYS_2026 = [
  { date: "2026-01-01", type: "holiday", name: "New Year's Day" },
  { date: "2026-02-17", type: "holiday", name: "Chinese New Year" },
  { date: "2026-02-25", type: "holiday", name: "EDSA People Power" },
  { date: "2026-04-02", type: "holiday", name: "Maundy Thursday" },
  { date: "2026-04-03", type: "holiday", name: "Good Friday" },
  { date: "2026-04-04", type: "holiday", name: "Black Saturday" },
  { date: "2026-04-09", type: "holiday", name: "Araw ng Kagitingan" },
  { date: "2026-05-01", type: "holiday", name: "Labor Day" },
  { date: "2026-06-12", type: "holiday", name: "Independence Day" },
  { date: "2026-08-21", type: "holiday", name: "Ninoy Aquino Day" },
  { date: "2026-08-31", type: "holiday", name: "National Heroes Day" },
  { date: "2026-11-01", type: "holiday", name: "All Saints' Day" },
  { date: "2026-11-30", type: "holiday", name: "Bonifacio Day" },
  { date: "2026-12-08", type: "holiday", name: "Immaculate Conception" },
  { date: "2026-12-25", type: "holiday", name: "Christmas Day" },
  { date: "2026-12-30", type: "holiday", name: "Rizal Day" },
  { date: "2026-12-31", type: "holiday", name: "Last Day of the Year" },
]

export const DEFAULT_CALENDAR = {
  name: "Project",
  workingWeek: {
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    sun: false,
  },
  hoursPerDay: 8,
  exceptions: PH_HOLIDAYS_2026.map(({ date, type }) => ({ date, type })),
}

export const STAFF = [
  {
    id: "staff-admin",
    email: "admin@sadicon.local",
    password: DEMO_PASSWORD,
    fullName: "Amina Solis",
    role: "admin",
  },
  {
    id: "staff-planner",
    email: "planner@sadicon.local",
    password: DEMO_PASSWORD,
    fullName: "Priya Tan",
    role: "planner",
  },
  {
    id: "staff-pm",
    email: "pm@sadicon.local",
    password: DEMO_PASSWORD,
    fullName: "Emhil Joseph",
    role: "project_manager",
  },
  {
    id: "staff-viewer",
    email: "viewer@sadicon.local",
    password: DEMO_PASSWORD,
    fullName: "Rico Valdez",
    role: "viewer",
  },
]

const CLEARWATER_ID = "prj-clearwater"
const HARBOR_ID = "prj-harbor"
const NORTH_ID = "prj-northhub"
const RIVER_ID = "prj-riverfront"
const CITY_ID = "prj-cityhall"
const EAST_ID = "prj-eastside"

export const PROJECTS = [
  {
    id: CLEARWATER_ID,
    code: "PRJ-2024-008",
    name: "Clearwater Medical Center",
    client: "HealthFirst Systems – Plano, TX",
    site: "Plano, TX / PH delivery team",
    stage: "active",
    priority: 1,
    progressPct: 34,
    expenditureOverride: null,
    budget: 395105259,
    currency: "PHP",
    startDate: "2026-01-05",
    targetEndDate: "2026-12-18",
    updatedAt: "2026-08-28T00:00:00.000Z",
    deletedAt: null,
  },
  {
    id: HARBOR_ID,
    code: "PRJ-2024-011",
    name: "Harbor View Residences",
    client: "Vista Land – Cebu",
    site: "Cebu City",
    stage: "active",
    priority: 2,
    progressPct: 58,
    expenditureOverride: 89200000,
    budget: 210000000,
    currency: "PHP",
    startDate: "2025-08-01",
    targetEndDate: "2027-03-01",
    updatedAt: "2026-09-02T00:00:00.000Z",
    deletedAt: null,
  },
  {
    id: NORTH_ID,
    code: "PRJ-2023-044",
    name: "North Hub Warehouse",
    client: "LogiCorp",
    site: "Clark",
    stage: "delayed",
    priority: 1,
    progressPct: 71,
    expenditureOverride: 56000000,
    budget: 72500000,
    currency: "PHP",
    startDate: "2024-03-01",
    targetEndDate: "2026-06-30",
    updatedAt: "2026-09-08T00:00:00.000Z",
    deletedAt: null,
  },
  {
    id: RIVER_ID,
    code: "PRJ-2025-002",
    name: "Riverfront Clinic Fit-out",
    client: "MedGroup",
    site: "Pasig",
    stage: "planning",
    priority: 3,
    progressPct: 8,
    expenditureOverride: 2100000,
    budget: 48000000,
    currency: "PHP",
    startDate: "2026-10-01",
    targetEndDate: "2027-04-01",
    updatedAt: "2026-09-01T00:00:00.000Z",
    deletedAt: null,
  },
  {
    id: CITY_ID,
    code: "PRJ-2022-019",
    name: "City Hall Annex",
    client: "LGU Partner",
    site: "Quezon City",
    stage: "completed",
    priority: 2,
    progressPct: 100,
    expenditureOverride: 118000000,
    budget: 120000000,
    currency: "PHP",
    startDate: "2022-04-01",
    targetEndDate: "2026-03-14",
    updatedAt: "2026-03-14T00:00:00.000Z",
    deletedAt: null,
  },
  {
    id: EAST_ID,
    code: "PRJ-2024-021",
    name: "Eastside School Expansion",
    client: "DepEd Partner",
    site: "Davao",
    stage: "on_hold",
    priority: 2,
    progressPct: 22,
    expenditureOverride: 18400000,
    budget: 95000000,
    currency: "PHP",
    startDate: "2025-01-15",
    targetEndDate: "2027-01-15",
    updatedAt: "2026-07-20T00:00:00.000Z",
    deletedAt: null,
  },
]

export const ACCESS_REQUESTS = [
  {
    id: "ar-1",
    email: "guest.mendez@contractor.ph",
    fullName: "Liza Mendez",
    companyNote: "QS from Meridian Concrete — needs viewer access for Clearwater.",
    status: "pending",
    createdAt: "2026-09-12T08:10:00.000Z",
    reviewedBy: null,
    reviewedAt: null,
  },
]

const PHASE_A = "boq-phase-a"
const PHASE_B = "boq-phase-b"
const PHASE_C = "boq-phase-c"

export const BOQ_BY_PROJECT = {
  [CLEARWATER_ID]: {
    id: "boq-clearwater",
    projectId: CLEARWATER_ID,
    status: "approved",
    title: "Approved BOQ — Clearwater Medical Center",
    approvedAt: "2026-08-28T00:00:00.000Z",
    phases: [
      {
        id: PHASE_A,
        code: "A",
        name: "General Requirements & Preliminaries",
        colorToken: "a",
        sortOrder: 1,
        lines: [
          { id: "a1", itemCode: "A.1", description: "Mobilization & Demobilization", unit: "lot", quantity: 1, rate: 1835414, amount: 1835414 },
          { id: "a2", itemCode: "A.2", description: "Temporary Facilities & Site Office", unit: "lot", quantity: 1, rate: 834391, amount: 834391 },
          { id: "a3", itemCode: "A.3", description: "Project Signage & Safety Barricades", unit: "lot", quantity: 1, rate: 345159, amount: 345159 },
          { id: "a4", itemCode: "A.4", description: "Project Management & Supervision", unit: "mo", quantity: 18, rate: 601581, amount: 10828458 },
        ],
      },
      {
        id: PHASE_B,
        code: "B",
        name: "Site Works & Earthworks",
        colorToken: "b",
        sortOrder: 2,
        lines: [
          { id: "b1", itemCode: "B.1", description: "Site Clearing & Grubbing", unit: "m²", quantity: 9027, rate: 85, amount: 767295 },
          { id: "b2", itemCode: "B.2", description: "Excavation Works (Bulk)", unit: "m³", quantity: 15176, rate: 320, amount: 4856320 },
          { id: "b3", itemCode: "B.3", description: "Backfilling & Compaction", unit: "m³", quantity: 4298, rate: 298.61, amount: 1283440 },
          { id: "b4", itemCode: "B.4", description: "Gravel Fill Bedding (100mm)", unit: "m³", quantity: 1689, rate: 1450, amount: 2449050 },
          { id: "b5", itemCode: "B.5", description: "Dewatering Works", unit: "lot", quantity: 1, rate: 262930, amount: 262930 },
        ],
      },
      {
        id: PHASE_C,
        code: "C",
        name: "Concrete Works",
        colorToken: "c",
        sortOrder: 3,
        lines: [
          { id: "c1", itemCode: "C", description: "Concrete Works (package aggregate)", unit: "lot", quantity: 1, rate: 135527300, amount: 135527300 },
        ],
      },
    ],
  },
  [HARBOR_ID]: {
    id: "boq-harbor",
    projectId: HARBOR_ID,
    status: "approved",
    title: "Approved BOQ — Harbor View (partial)",
    approvedAt: "2026-06-01T00:00:00.000Z",
    phases: [
      {
        id: "harbor-a",
        code: "A",
        name: "Preliminaries",
        colorToken: "a",
        sortOrder: 1,
        lines: [
          { id: "ha1", itemCode: "A.1", description: "Mobilization", unit: "lot", quantity: 1, rate: 2400000, amount: 2400000 },
        ],
      },
      {
        id: "harbor-b",
        code: "B",
        name: "Structure",
        colorToken: "c",
        sortOrder: 2,
        lines: [
          { id: "hb1", itemCode: "B.1", description: "Structural package", unit: "lot", quantity: 1, rate: 88000000, amount: 88000000 },
        ],
      },
    ],
  },
}

export const PERSONNEL_BY_PROJECT = {
  [CLEARWATER_ID]: [
    { id: "per-1", staffId: "staff-pm", name: "Emhil Joseph", title: "Project Manager", startDate: "2025-11-01" },
    { id: "per-2", staffId: null, name: "Lara Cruz", title: "Site Engineer", startDate: "2026-01-15" },
    { id: "per-3", staffId: null, name: "Marco Dela Peña", title: "Safety Officer", startDate: "2026-01-15" },
    { id: "per-4", staffId: null, name: "Nina Santos", title: "Quantity Surveyor", startDate: "2025-12-01" },
    { id: "per-5", staffId: null, name: "Owen Reyes", title: "Document Controller", startDate: "2026-02-01" },
    { id: "per-6", staffId: "staff-planner", name: "Priya Tan", title: "Scheduler", startDate: "2026-03-01" },
    { id: "per-7", staffId: null, name: "Quinn Lim", title: "QA/QC", startDate: "2026-04-01" },
  ],
}

export const DOCUMENTS_BY_PROJECT = {
  [CLEARWATER_ID]: [
    { id: "doc-1", title: "Structural plans – Rev C", contentType: "Engineering", byteSize: 4_200_000, updatedAt: "2026-08-12", deletedAt: null },
    { id: "doc-2", title: "Building permit BP-8821", contentType: "Permit", byteSize: 890_000, updatedAt: "2026-07-02", deletedAt: null },
    { id: "doc-3", title: "Safety plan SP-04", contentType: "HSE", byteSize: 1_100_000, updatedAt: "2026-08-20", deletedAt: null },
    { id: "doc-4", title: "Approved BOQ PDF", contentType: "Commercial", byteSize: 2_400_000, updatedAt: "2026-08-28", deletedAt: null },
  ],
}

export const CONTRACTORS = [
  { id: "co-1", name: "Northpeak Earthworks", specialty: "Site / excavation", certifications: "ISO 45001", currentProject: "Clearwater" },
  { id: "co-2", name: "Meridian Concrete Co.", specialty: "Structural concrete", certifications: "ACI, PCAB", currentProject: "Clearwater" },
  { id: "co-3", name: "Halo Temporary Works", specialty: "Facilities / safety", certifications: "DOLE", currentProject: "—" },
]

export const REPORTS = [
  { id: "rep-1", from: "Site Safety", subject: "Incident report – trench edge barrier", type: "Incident", received: "2026-09-12" },
  { id: "rep-2", from: "Logistics", subject: "Material delivery – rebar lot R-204", type: "Delivery", received: "2026-09-11" },
  { id: "rep-3", from: "QA/QC", subject: "Concrete pour checklist – Level 1", type: "Project", received: "2026-09-10" },
]

function node(partial) {
  return {
    parentId: null,
    durationDays: 0,
    isLoe: false,
    spanStartId: null,
    spanEndId: null,
    sortOrder: 0,
    open: true,
    ...partial,
  }
}

export const SCHEDULE_BY_PROJECT = {
  [CLEARWATER_ID]: {
    calendar: DEFAULT_CALENDAR,
    nodes: [
      node({ id: "A", name: "A – General Requirements", kind: "phase_root", boqPhaseId: PHASE_A, phase: "a", locked: true, sortOrder: 1 }),
      node({ id: "A.1", name: "A.1 Mobilization & Demobilization", kind: "leaf", parentId: "A", phase: "a", durationDays: 10, sortOrder: 1 }),
      node({ id: "A.2", name: "A.2 Temporary Facilities", kind: "leaf", parentId: "A", phase: "a", durationDays: 15, sortOrder: 2 }),
      node({ id: "A.3", name: "A.3 Signage & Barricades", kind: "leaf", parentId: "A", phase: "a", durationDays: 5, sortOrder: 3 }),
      node({ id: "A.4", name: "A.4 Supervision (LOE)", kind: "leaf", parentId: "A", phase: "a", isLoe: true, spanStartId: "A.1", spanEndId: "C.pkg", sortOrder: 4 }),
      node({ id: "B", name: "B – Site Works & Earthworks", kind: "phase_root", boqPhaseId: PHASE_B, phase: "b", locked: true, sortOrder: 2 }),
      node({ id: "B.0", name: "B.0 Earthworks package", kind: "summary", parentId: "B", phase: "b", sortOrder: 1 }),
      node({ id: "B.1", name: "B.1 Site Clearing & Grubbing", kind: "leaf", parentId: "B.0", phase: "b", durationDays: 12, sortOrder: 1 }),
      node({ id: "B.2", name: "B.2 Excavation Works (Bulk)", kind: "leaf", parentId: "B.0", phase: "b", durationDays: 45, sortOrder: 2 }),
      node({ id: "B.3", name: "B.3 Backfilling & Compaction", kind: "leaf", parentId: "B.0", phase: "b", durationDays: 20, sortOrder: 3 }),
      node({ id: "B.4", name: "B.4 Gravel Fill Bedding", kind: "leaf", parentId: "B.0", phase: "b", durationDays: 10, sortOrder: 4 }),
      node({ id: "B.5", name: "B.5 Dewatering Works", kind: "leaf", parentId: "B.0", phase: "b", durationDays: 20, sortOrder: 5 }),
      node({ id: "C", name: "C – Concrete Works", kind: "phase_root", boqPhaseId: PHASE_C, phase: "c", locked: true, sortOrder: 3 }),
      node({ id: "C.pkg", name: "C Concrete package (aggregate)", kind: "leaf", parentId: "C", phase: "c", durationDays: 120, sortOrder: 1 }),
    ],
    dependencies: [
      { id: "d1", predecessorId: "A.1", successorId: "A.2", type: "FS", lagDays: 0 },
      { id: "d2", predecessorId: "A.1", successorId: "A.3", type: "FS", lagDays: 0 },
      { id: "d3", predecessorId: "A.2", successorId: "B.1", type: "FS", lagDays: 0 },
      { id: "d4", predecessorId: "A.3", successorId: "B.1", type: "FS", lagDays: 0 },
      { id: "d5", predecessorId: "B.1", successorId: "B.2", type: "FS", lagDays: 0 },
      { id: "d6", predecessorId: "B.2", successorId: "B.3", type: "FS", lagDays: 0 },
      { id: "d7", predecessorId: "B.3", successorId: "B.4", type: "FS", lagDays: 0 },
      { id: "d8", predecessorId: "B.1", successorId: "B.5", type: "FS", lagDays: 0 },
      { id: "d9", predecessorId: "B.4", successorId: "C.pkg", type: "FS", lagDays: 0 },
      { id: "d10", predecessorId: "B.5", successorId: "C.pkg", type: "FS", lagDays: 0 },
    ],
    selectedId: "A.1",
  },
  [HARBOR_ID]: {
    calendar: DEFAULT_CALENDAR,
    nodes: [
      node({ id: "H-A", name: "A – Preliminaries", kind: "phase_root", boqPhaseId: "harbor-a", phase: "a", locked: true, sortOrder: 1 }),
      node({ id: "H-B", name: "B – Structure", kind: "phase_root", boqPhaseId: "harbor-b", phase: "c", locked: true, sortOrder: 2 }),
    ],
    dependencies: [],
    selectedId: "H-A",
  },
}

export const PROJECT_IDS = {
  CLEARWATER_ID,
  HARBOR_ID,
  NORTH_ID,
  RIVER_ID,
  CITY_ID,
  EAST_ID,
}

export function createSeedState() {
  return {
    accessRequests: structuredClone(ACCESS_REQUESTS),
    projects: structuredClone(PROJECTS),
    boqByProject: structuredClone(BOQ_BY_PROJECT),
    personnelByProject: structuredClone(PERSONNEL_BY_PROJECT),
    documentsByProject: structuredClone(DOCUMENTS_BY_PROJECT),
    scheduleByProject: structuredClone(SCHEDULE_BY_PROJECT),
    contractors: structuredClone(CONTRACTORS),
    reports: structuredClone(REPORTS),
    settings: { darkMode: false },
  }
}
