import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabaseClient", () => ({ isSupabaseConfigured: true, supabase: null }))
vi.mock("@/data/schedule", () => ({
  saveNode: vi.fn(),
  updateNode: vi.fn(),
  saveBaseline: vi.fn(),
  clearBaseline: vi.fn(),
  saveDependency: vi.fn(),
  deleteNode: vi.fn(),
  loadNetwork: vi.fn(),
  syncPhaseRoots: vi.fn(),
}))
vi.mock("@/data/projects", () => ({
  listProjects: vi.fn(),
  updateProject: vi.fn(),
  archiveProject: vi.fn(),
  touchProject: vi.fn(() => Promise.resolve()),
}))

const scheduleApi = await import("@/data/schedule")
const projectsApi = await import("@/data/projects")
const { useWorkspaceStore } = await import("./workspace")

const P = "project-1"
const calendar = {
  workingWeek: { sun: false, mon: true, tue: true, wed: true, thu: true, fri: true, sat: true },
  exceptions: [],
}

function nodesOf() {
  return useWorkspaceStore.getState().scheduleByProject[P].nodes
}

function leaf() {
  return nodesOf().find((node) => node.id === "leaf")
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, "error").mockImplementation(() => {})
  useWorkspaceStore.setState({
    scheduleByProject: {
      [P]: {
        calendar,
        nodes: [
          { id: "root", name: "A – Site", kind: "phase_root", parentId: null, wbsCode: "A", locked: true, durationDays: 0, isLoe: false },
          { id: "leaf", name: "Clear", kind: "leaf", parentId: "root", wbsCode: "A.1", durationDays: 8, progressPct: 10, isLoe: false },
          { id: "leaf2", name: "Dig", kind: "leaf", parentId: "root", wbsCode: "A.2", durationDays: 2, progressPct: 0, isLoe: false },
        ],
        dependencies: [],
        baseline: null,
        selectedId: null,
      },
    },
    networkStatusByProject: {},
  })
})

describe("schedule writes", () => {
  const draft = { parentId: "root", kind: "leaf", name: "Excavate", durationDays: 3 }

  it("adds a node only after the server accepts it", async () => {
    scheduleApi.saveNode.mockResolvedValueOnce()
    await useWorkspaceStore.getState().addScheduleNode(P, draft)
    expect(scheduleApi.saveNode).toHaveBeenCalledTimes(1)
    expect(nodesOf()).toHaveLength(4)
  })

  it("leaves no node behind when the insert is rejected", async () => {
    scheduleApi.saveNode.mockRejectedValueOnce(new Error("503"))
    await expect(useWorkspaceStore.getState().addScheduleNode(P, draft)).rejects.toThrow("503")
    expect(nodesOf()).toHaveLength(3)
  })

  it("sends only the changed column and restores the duration when the save fails", async () => {
    scheduleApi.updateNode.mockRejectedValueOnce(new Error("503"))
    await expect(useWorkspaceStore.getState().setDuration(P, "leaf", 20)).rejects.toThrow("503")
    expect(scheduleApi.updateNode).toHaveBeenCalledWith(P, "leaf", { duration_days: 20 })
    expect(leaf().durationDays).toBe(8)
  })

  it("restores progress when its save fails and keeps a later edit", async () => {
    let rejectProgress
    scheduleApi.updateNode.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectProgress = reject
        }),
    )
    scheduleApi.updateNode.mockResolvedValueOnce()
    const progress = useWorkspaceStore.getState().setProgress(P, "leaf", 60)
    await useWorkspaceStore.getState().setDuration(P, "leaf", 12)
    rejectProgress(new Error("503"))
    await expect(progress).rejects.toThrow("503")
    expect(leaf().progressPct).toBe(10)
    expect(leaf().durationDays).toBe(12)
  })

  it("clamps duration to whole days within the limit", async () => {
    scheduleApi.updateNode.mockResolvedValue()
    await useWorkspaceStore.getState().setDuration(P, "leaf", 200000)
    expect(leaf().durationDays).toBe(3650)
    await useWorkspaceStore.getState().setDuration(P, "leaf", 2.5)
    expect(leaf().durationDays).toBe(3)
  })

  it("keeps the old baseline when the save is rejected", async () => {
    scheduleApi.saveBaseline.mockRejectedValueOnce(new Error("503"))
    await expect(
      useWorkspaceStore.getState().setBaseline(P, { capturedAt: "now", projectDurationDays: 8, nodes: {} }),
    ).rejects.toThrow("503")
    expect(useWorkspaceStore.getState().scheduleByProject[P].baseline).toBeNull()
  })

  it("rounds and bounds lag before saving a dependency", async () => {
    scheduleApi.saveDependency.mockResolvedValue()
    await useWorkspaceStore
      .getState()
      .addDependency(P, { predecessorId: "leaf", successorId: "leaf2", type: "FS", lagDays: -9999 })
    expect(useWorkspaceStore.getState().scheduleByProject[P].dependencies[0].lagDays).toBe(-3650)
  })
})

describe("schedule structure", () => {
  it("stores the name as typed and never reuses a sibling code", async () => {
    scheduleApi.saveNode.mockResolvedValue()
    useWorkspaceStore.setState((state) => patchLeaf2(state, { wbsCode: "A.5", sortOrder: 5 }))
    const node = await useWorkspaceStore
      .getState()
      .addScheduleNode(P, { parentId: "root", kind: "leaf", name: "QA Durable Foundation", durationDays: 3 })
    expect(node.name).toBe("QA Durable Foundation")
    expect(node.wbsCode).toBe("A.6")
    expect(node.sortOrder).toBe(6)
  })

  it("refuses a link that would create a cycle", async () => {
    scheduleApi.saveDependency.mockResolvedValue()
    const add = useWorkspaceStore.getState().addDependency
    await add(P, { predecessorId: "leaf", successorId: "leaf2", type: "FS", lagDays: 0 })
    await expect(add(P, { predecessorId: "leaf2", successorId: "leaf", type: "FS", lagDays: 0 })).rejects.toThrow(/cycle/i)
    expect(scheduleApi.saveDependency).toHaveBeenCalledTimes(1)
    expect(useWorkspaceStore.getState().scheduleByProject[P].dependencies).toHaveLength(1)
  })

  it("deletes a node and its links only after the server confirms", async () => {
    scheduleApi.saveDependency.mockResolvedValue()
    await useWorkspaceStore.getState().addDependency(P, { predecessorId: "leaf", successorId: "leaf2", type: "FS", lagDays: 0 })

    scheduleApi.deleteNode.mockRejectedValueOnce(new Error("503"))
    await expect(useWorkspaceStore.getState().deleteScheduleNode(P, "leaf")).rejects.toThrow("503")
    expect(nodesOf()).toHaveLength(3)

    scheduleApi.deleteNode.mockResolvedValueOnce()
    await useWorkspaceStore.getState().deleteScheduleNode(P, "leaf")
    expect(nodesOf().map((node) => node.id)).toEqual(["root", "leaf2"])
    expect(useWorkspaceStore.getState().scheduleByProject[P].dependencies).toHaveLength(0)
  })

  it("never deletes a phase root", async () => {
    await useWorkspaceStore.getState().deleteScheduleNode(P, "root")
    expect(scheduleApi.deleteNode).not.toHaveBeenCalled()
    expect(nodesOf()).toHaveLength(3)
  })

  it("renames with a trimmed name and keeps the old one when the save fails", async () => {
    scheduleApi.updateNode.mockResolvedValueOnce()
    await useWorkspaceStore.getState().renameScheduleNode(P, "leaf", "  Clear and grub  ")
    expect(scheduleApi.updateNode).toHaveBeenCalledWith(P, "leaf", { name: "Clear and grub" })
    expect(leaf().name).toBe("Clear and grub")

    scheduleApi.updateNode.mockRejectedValueOnce(new Error("503"))
    await expect(useWorkspaceStore.getState().renameScheduleNode(P, "leaf", "Other")).rejects.toThrow("503")
    expect(leaf().name).toBe("Clear and grub")
  })
})

function patchLeaf2(state, patch) {
  const schedule = state.scheduleByProject[P]
  return {
    scheduleByProject: {
      ...state.scheduleByProject,
      [P]: { ...schedule, nodes: schedule.nodes.map((node) => (node.id === "leaf2" ? { ...node, ...patch } : node)) },
    },
  }
}

describe("project details", () => {
  const project = { id: P, name: "Clownfall", stage: "planning", budget: null, startDate: null, updatedAt: "2026-10-06T00:00:00Z", deletedAt: null }

  beforeEach(() => {
    useWorkspaceStore.setState({ projects: [project] })
  })

  it("saves edited details and keeps the old ones when the save fails", async () => {
    projectsApi.updateProject.mockRejectedValueOnce(new Error("503"))
    await expect(useWorkspaceStore.getState().updateProject(P, { name: "Harbor" })).rejects.toThrow("503")
    expect(useWorkspaceStore.getState().projects[0].name).toBe("Clownfall")

    projectsApi.updateProject.mockResolvedValueOnce({ ...project, name: "Harbor", startDate: "2026-11-02" })
    await useWorkspaceStore.getState().updateProject(P, { name: "Harbor", startDate: "2026-11-02" })
    expect(useWorkspaceStore.getState().projects[0]).toMatchObject({ name: "Harbor", startDate: "2026-11-02" })
  })

  it("archives only after the server confirms", async () => {
    projectsApi.archiveProject.mockRejectedValueOnce(new Error("503"))
    await expect(useWorkspaceStore.getState().archiveProject(P)).rejects.toThrow("503")
    expect(useWorkspaceStore.getState().projects[0].deletedAt).toBeNull()

    projectsApi.archiveProject.mockResolvedValueOnce()
    await useWorkspaceStore.getState().archiveProject(P)
    expect(useWorkspaceStore.getState().projects[0].deletedAt).toBeTruthy()
  })

  it("stamps the project as updated after a schedule write", async () => {
    scheduleApi.updateNode.mockResolvedValueOnce()
    await useWorkspaceStore.getState().setDuration(P, "leaf", 9)
    expect(projectsApi.touchProject).toHaveBeenCalledWith(P)
    expect(useWorkspaceStore.getState().projects[0].updatedAt).not.toBe(project.updatedAt)
  })

  it("does not stamp the project when the write fails", async () => {
    scheduleApi.updateNode.mockRejectedValueOnce(new Error("503"))
    await expect(useWorkspaceStore.getState().setDuration(P, "leaf", 9)).rejects.toThrow("503")
    expect(projectsApi.touchProject).not.toHaveBeenCalled()
  })
})

describe("load states", () => {
  it("marks the workspace as failed instead of ready when the project list fails", async () => {
    projectsApi.listProjects.mockRejectedValueOnce(new Error("503"))
    await useWorkspaceStore.getState().hydrate()
    expect(useWorkspaceStore.getState().hydrateStatus).toBe("error")
  })

  it("records a failed network load per project and allows a retry", async () => {
    scheduleApi.syncPhaseRoots.mockRejectedValueOnce(new Error("503"))
    await useWorkspaceStore.getState().ensureNetwork("other")
    expect(useWorkspaceStore.getState().networkStatusByProject.other).toBe("error")
    expect(useWorkspaceStore.getState().scheduleByProject.other).toBeUndefined()

    scheduleApi.syncPhaseRoots.mockResolvedValueOnce()
    scheduleApi.loadNetwork.mockResolvedValueOnce({ calendar, nodes: [], dependencies: [], baseline: null, selectedId: null })
    await useWorkspaceStore.getState().ensureNetwork("other")
    expect(useWorkspaceStore.getState().networkStatusByProject.other).toBe("ready")
    expect(useWorkspaceStore.getState().scheduleByProject.other.nodes).toEqual([])
  })
})
