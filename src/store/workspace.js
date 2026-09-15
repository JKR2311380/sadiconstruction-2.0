import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  createSeedState,
  DEFAULT_CALENDAR,
} from "@/data/mock/seed"
import { nextProjectCode } from "@/lib/projectCode"
import { parseBoqCsv } from "@/data/mock/csv"

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

export function boqGrandTotal(boq) {
  if (!boq?.phases) return 0
  return boq.phases.reduce(
    (sum, phase) =>
      sum + phase.lines.reduce((lineSum, line) => lineSum + Number(line.amount || 0), 0),
    0,
  )
}

export function projectExpenditure(project, boq) {
  if (project?.expenditureOverride != null) return project.expenditureOverride
  const derived = boqGrandTotal(boq)
  return derived || 0
}

function ensureSchedule(state, projectId) {
  if (state.scheduleByProject[projectId]) return state.scheduleByProject[projectId]
  const next = {
    calendar: structuredClone(DEFAULT_CALENDAR),
    nodes: [],
    dependencies: [],
    selectedId: null,
  }
  state.scheduleByProject[projectId] = next
  return next
}

function syncPhaseRootsInto(schedule, boq) {
  if (!boq?.phases?.length) return
  const existing = new Map(
    schedule.nodes
      .filter((node) => node.kind === "phase_root")
      .map((node) => [node.boqPhaseId, node]),
  )
  const keepPhaseIds = new Set(boq.phases.map((phase) => phase.id))
  const byId = Object.fromEntries(schedule.nodes.map((node) => [node.id, node]))
  const dropRootIds = new Set(
    schedule.nodes
      .filter((node) => node.kind === "phase_root" && !keepPhaseIds.has(node.boqPhaseId))
      .map((node) => node.id),
  )
  const shouldDrop = (node) => {
    let cursor = node
    while (cursor) {
      if (dropRootIds.has(cursor.id)) return true
      cursor = cursor.parentId ? byId[cursor.parentId] : null
    }
    return false
  }

  schedule.nodes = schedule.nodes.filter((node) => !shouldDrop(node))
  schedule.dependencies = schedule.dependencies.filter(
    (dep) =>
      schedule.nodes.some((node) => node.id === dep.predecessorId) &&
      schedule.nodes.some((node) => node.id === dep.successorId),
  )

  for (const phase of boq.phases) {
    const found = existing.get(phase.id)
    if (found && schedule.nodes.some((node) => node.id === found.id)) {
      found.name = `${phase.code} – ${phase.name}`
      found.phase = phase.colorToken
      continue
    }
    schedule.nodes.push({
      id: phase.code,
      name: `${phase.code} – ${phase.name}`,
      kind: "phase_root",
      parentId: null,
      boqPhaseId: phase.id,
      phase: phase.colorToken,
      locked: true,
      durationDays: 0,
      isLoe: false,
      spanStartId: null,
      spanEndId: null,
      sortOrder: phase.sortOrder,
      open: true,
    })
  }
}

export const useWorkspaceStore = create(
  persist(
    (set, get) => ({
      ...createSeedState(),

      resetDemo() {
        set(createSeedState())
      },

      submitAccessRequest({ email, fullName, companyNote }) {
        const row = {
          id: uid("ar"),
          email,
          fullName,
          companyNote: companyNote || "",
          status: "pending",
          createdAt: new Date().toISOString(),
          reviewedBy: null,
          reviewedAt: null,
        }
        set((state) => ({
          accessRequests: [row, ...state.accessRequests],
        }))
        return row
      },

      reviewAccessRequest(id, status, reviewerId) {
        set((state) => ({
          accessRequests: state.accessRequests.map((row) =>
            row.id === id
              ? {
                  ...row,
                  status,
                  reviewedBy: reviewerId,
                  reviewedAt: new Date().toISOString(),
                }
              : row,
          ),
        }))
      },

      createProject({ name, client, stage = "planning" }) {
        const code = nextProjectCode(get().projects)
        const project = {
          id: uid("prj"),
          code,
          name,
          client: client || "",
          site: "",
          stage,
          priority: 2,
          progressPct: 0,
          expenditureOverride: null,
          budget: 0,
          currency: "PHP",
          startDate: new Date().toISOString().slice(0, 10),
          targetEndDate: null,
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        }
        set((state) => ({
          projects: [project, ...state.projects],
          scheduleByProject: {
            ...state.scheduleByProject,
            [project.id]: {
              calendar: structuredClone(DEFAULT_CALENDAR),
              nodes: [],
              dependencies: [],
              selectedId: null,
            },
          },
        }))
        return project
      },

      archiveProject(projectId) {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { ...project, deletedAt: new Date().toISOString() }
              : project,
          ),
        }))
      },

      setProjectStage(projectId, stage) {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { ...project, stage, updatedAt: new Date().toISOString() }
              : project,
          ),
        }))
      },

      setExpenditureOverride(projectId, value) {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { ...project, expenditureOverride: value }
              : project,
          ),
        }))
      },

      replaceBoqFromCsv(projectId, csvText) {
        const parsed = parseBoqCsv(csvText)
        if (!parsed.ok) return parsed
        set((state) => {
          const boq = {
            id: uid("boq"),
            projectId,
            status: "approved",
            title: "Uploaded BOQ",
            approvedAt: new Date().toISOString(),
            phases: parsed.phases,
          }
          const schedule = structuredClone(ensureSchedule(state, projectId))
          syncPhaseRootsInto(schedule, boq)
          return {
            boqByProject: { ...state.boqByProject, [projectId]: boq },
            scheduleByProject: {
              ...state.scheduleByProject,
              [projectId]: schedule,
            },
            projects: state.projects.map((project) =>
              project.id === projectId
                ? { ...project, updatedAt: new Date().toISOString() }
                : project,
            ),
          }
        })
        return { ok: true }
      },

      addPersonnel(projectId, { name, title, startDate }) {
        const row = {
          id: uid("per"),
          staffId: null,
          name,
          title,
          startDate,
        }
        set((state) => ({
          personnelByProject: {
            ...state.personnelByProject,
            [projectId]: [...(state.personnelByProject[projectId] || []), row],
          },
        }))
      },

      addDocument(projectId, { title, contentType, byteSize }) {
        const row = {
          id: uid("doc"),
          title,
          contentType,
          byteSize,
          updatedAt: new Date().toISOString().slice(0, 10),
          deletedAt: null,
        }
        set((state) => ({
          documentsByProject: {
            ...state.documentsByProject,
            [projectId]: [...(state.documentsByProject[projectId] || []), row],
          },
        }))
      },

      removeDocument(projectId, documentId) {
        set((state) => ({
          documentsByProject: {
            ...state.documentsByProject,
            [projectId]: (state.documentsByProject[projectId] || []).map((doc) =>
              doc.id === documentId
                ? { ...doc, deletedAt: new Date().toISOString() }
                : doc,
            ),
          },
        }))
      },

      toggleNodeOpen(projectId, nodeId) {
        set((state) => {
          const schedule = structuredClone(state.scheduleByProject[projectId])
          const node = schedule.nodes.find((row) => row.id === nodeId)
          if (node) node.open = node.open === false
          return {
            scheduleByProject: {
              ...state.scheduleByProject,
              [projectId]: schedule,
            },
          }
        })
      },

      selectNode(projectId, nodeId) {
        set((state) => ({
          scheduleByProject: {
            ...state.scheduleByProject,
            [projectId]: {
              ...state.scheduleByProject[projectId],
              selectedId: nodeId,
            },
          },
        }))
      },

      setDuration(projectId, nodeId, durationDays) {
        set((state) => {
          const schedule = structuredClone(state.scheduleByProject[projectId])
          const node = schedule.nodes.find((row) => row.id === nodeId)
          if (node && node.kind === "leaf" && !node.isLoe) {
            node.durationDays = Math.max(0, durationDays)
          }
          return {
            scheduleByProject: {
              ...state.scheduleByProject,
              [projectId]: schedule,
            },
          }
        })
      },

      addScheduleNode(projectId, { parentId, kind, name, durationDays }) {
        set((state) => {
          const schedule = structuredClone(state.scheduleByProject[projectId])
          const parent = schedule.nodes.find((row) => row.id === parentId)
          if (!parent) return {}
          const id = `${parentId}.${Math.random().toString(36).slice(2, 6)}`
          const node = {
            id,
            name: `${id} ${name}`,
            kind,
            parentId,
            boqPhaseId: parent.boqPhaseId ?? null,
            phase: parent.phase,
            locked: false,
            durationDays: kind === "leaf" ? durationDays || 0 : 0,
            isLoe: false,
            spanStartId: null,
            spanEndId: null,
            sortOrder: schedule.nodes.filter((row) => row.parentId === parentId).length + 1,
            open: true,
          }
          const parentIndex = schedule.nodes.findIndex((row) => row.id === parentId)
          const isDescendant = (nodeId) => {
            let cursor = schedule.nodes.find((row) => row.id === nodeId)
            while (cursor?.parentId) {
              if (cursor.parentId === parentId) return true
              cursor = schedule.nodes.find((row) => row.id === cursor.parentId)
            }
            return false
          }
          let insertAt = parentIndex + 1
          while (
            insertAt < schedule.nodes.length &&
            (schedule.nodes[insertAt].parentId === parentId ||
              isDescendant(schedule.nodes[insertAt].id))
          ) {
            insertAt += 1
          }
          schedule.nodes.splice(insertAt, 0, node)
          parent.open = true
          schedule.selectedId = id
          return {
            scheduleByProject: {
              ...state.scheduleByProject,
              [projectId]: schedule,
            },
          }
        })
      },

      addDependency(projectId, { predecessorId, successorId, type, lagDays = 0 }) {
        set((state) => {
          const schedule = structuredClone(state.scheduleByProject[projectId])
          if (predecessorId === successorId) return {}
          const exists = schedule.dependencies.some(
            (dep) =>
              dep.predecessorId === predecessorId &&
              dep.successorId === successorId &&
              dep.type === type,
          )
          if (!exists) {
            schedule.dependencies.push({
              id: uid("dep"),
              predecessorId,
              successorId,
              type,
              lagDays,
            })
          }
          return {
            scheduleByProject: {
              ...state.scheduleByProject,
              [projectId]: schedule,
            },
          }
        })
      },

      clearDependencies(projectId, successorId) {
        set((state) => {
          const schedule = structuredClone(state.scheduleByProject[projectId])
          schedule.dependencies = schedule.dependencies.filter(
            (dep) => dep.successorId !== successorId,
          )
          return {
            scheduleByProject: {
              ...state.scheduleByProject,
              [projectId]: schedule,
            },
          }
        })
      },

      deleteScheduleNode(projectId, nodeId) {
        set((state) => {
          const schedule = structuredClone(state.scheduleByProject[projectId])
          const target = schedule.nodes.find((row) => row.id === nodeId)
          if (!target || target.kind === "phase_root" || target.locked) return {}
          const removeIds = new Set([nodeId])
          let grew = true
          while (grew) {
            grew = false
            for (const node of schedule.nodes) {
              if (removeIds.has(node.parentId) && !removeIds.has(node.id)) {
                removeIds.add(node.id)
                grew = true
              }
            }
          }
          schedule.nodes = schedule.nodes.filter((node) => !removeIds.has(node.id))
          schedule.dependencies = schedule.dependencies.filter(
            (dep) =>
              !removeIds.has(dep.predecessorId) && !removeIds.has(dep.successorId),
          )
          if (removeIds.has(schedule.selectedId)) schedule.selectedId = null
          return {
            scheduleByProject: {
              ...state.scheduleByProject,
              [projectId]: schedule,
            },
          }
        })
      },

      simulateCycle(projectId) {
        set((state) => {
          const schedule = structuredClone(state.scheduleByProject[projectId])
          const b2 = schedule.nodes.find((row) => row.id === "B.2")
          const b3 = schedule.nodes.find((row) => row.id === "B.3")
          if (!b2 || !b3) return {}
          schedule.dependencies = schedule.dependencies.filter(
            (dep) =>
              !(dep.successorId === "B.2" || dep.successorId === "B.3"),
          )
          schedule.dependencies.push(
            { id: uid("dep"), predecessorId: "B.3", successorId: "B.2", type: "FS", lagDays: 0 },
            { id: uid("dep"), predecessorId: "B.2", successorId: "B.3", type: "FS", lagDays: 0 },
          )
          return {
            scheduleByProject: {
              ...state.scheduleByProject,
              [projectId]: schedule,
            },
          }
        })
      },

      restoreClearwaterNetwork(projectId) {
        const seed = createSeedState().scheduleByProject[projectId]
        if (!seed) return
        set((state) => ({
          scheduleByProject: {
            ...state.scheduleByProject,
            [projectId]: structuredClone(seed),
          },
        }))
      },

      setDarkMode(darkMode) {
        set((state) => ({ settings: { ...state.settings, darkMode } }))
      },
    }),
    {
      name: "sadicon-workspace",
      version: 2,
      migrate: () => createSeedState(),
    },
  ),
)
