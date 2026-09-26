import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  createSeedState,
  DEFAULT_CALENDAR,
} from "@/data/mock/seed"
import { nextProjectCode } from "@/lib/projectCode"
import { parseBoqCsv } from "@/data/mock/csv"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import * as projectsApi from "@/data/projects"
import * as boqApi from "@/data/boq"
import * as scheduleApi from "@/data/schedule"
import * as documentsApi from "@/data/documents"
import * as personnelApi from "@/data/personnel"

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

const emptyWorkspace = {
  projects: [],
  boqByProject: {},
  personnelByProject: {},
  documentsByProject: {},
  scheduleByProject: {},
  settings: { darkMode: false },
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
      ...(isSupabaseConfigured ? emptyWorkspace : createSeedState()),
      hydrateStatus: isSupabaseConfigured ? "idle" : "ready",

      async hydrate() {
        if (!isSupabaseConfigured) {
          set({ hydrateStatus: "ready" })
          return
        }
        set({ hydrateStatus: "loading" })
        try {
          const projects = await projectsApi.listProjects()
          const ids = projects.map((project) => project.id)
          const [boqByProject, documentsByProject, personnelByProject] = await Promise.all([
            boqApi.loadAllBoqs(ids),
            documentsApi.loadAllDocuments(ids),
            personnelApi.loadAllPersonnel(ids),
          ])
          set({
            projects,
            boqByProject,
            documentsByProject,
            personnelByProject,
            scheduleByProject: {},
            hydrateStatus: "ready",
          })
        } catch (error) {
          console.error("Workspace hydrate failed", error)
          set({ hydrateStatus: "ready" })
        }
      },

      async ensureNetwork(projectId) {
        if (get().scheduleByProject[projectId]) return
        if (!isSupabaseConfigured) {
          set((state) => ({
            scheduleByProject: {
              ...state.scheduleByProject,
              [projectId]: {
                calendar: structuredClone(DEFAULT_CALENDAR),
                nodes: [],
                dependencies: [],
                selectedId: null,
              },
            },
          }))
          return
        }
        try {
          await scheduleApi.syncPhaseRoots(projectId)
          const network = await scheduleApi.loadNetwork(projectId)
          set((state) => ({
            scheduleByProject: { ...state.scheduleByProject, [projectId]: network },
          }))
        } catch (error) {
          console.error("ensureNetwork failed", error)
        }
      },

      async refreshProjectRecords(projectId) {
        if (!isSupabaseConfigured) return
        try {
          const [documents, personnel] = await Promise.all([
            documentsApi.listDocuments(projectId),
            personnelApi.listPersonnel(projectId),
          ])
          set((state) => ({
            documentsByProject: { ...state.documentsByProject, [projectId]: documents },
            personnelByProject: { ...state.personnelByProject, [projectId]: personnel },
          }))
        } catch (error) {
          console.error("refreshProjectRecords failed", error)
        }
      },

      resetDemo() {
        if (isSupabaseConfigured) return
        set({ ...createSeedState(), hydrateStatus: "ready" })
      },

      async createProject({ name, client, stage = "planning" }) {
        if (isSupabaseConfigured) {
          const project = await projectsApi.createProject({
            name,
            client,
            stage,
            existing: get().projects,
          })
          const network = await scheduleApi.loadNetwork(project.id)
          set((state) => ({
            projects: [project, ...state.projects],
            scheduleByProject: {
              ...state.scheduleByProject,
              [project.id]: network,
            },
            personnelByProject: { ...state.personnelByProject, [project.id]: [] },
            documentsByProject: { ...state.documentsByProject, [project.id]: [] },
          }))
          return project
        }

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
          personnelByProject: { ...state.personnelByProject, [project.id]: [] },
          documentsByProject: { ...state.documentsByProject, [project.id]: [] },
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
        if (isSupabaseConfigured) {
          void projectsApi.archiveProject(projectId)
        }
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

      async replaceBoqFromCsv(projectId, csvText) {
        if (isSupabaseConfigured) {
          const result = await boqApi.replaceBoqFromCsv(projectId, csvText)
          if (!result.ok) return result
          const boq = await boqApi.loadBoq(projectId)
          await scheduleApi.syncPhaseRoots(projectId)
          const network = await scheduleApi.loadNetwork(projectId)
          set((state) => ({
            boqByProject: { ...state.boqByProject, [projectId]: boq },
            scheduleByProject: { ...state.scheduleByProject, [projectId]: network },
            projects: state.projects.map((project) =>
              project.id === projectId
                ? { ...project, updatedAt: new Date().toISOString() }
                : project,
            ),
          }))
          return { ok: true }
        }

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

      async addPersonnel(projectId, { name, title, startDate, endDate }) {
        if (isSupabaseConfigured) {
          const row = await personnelApi.addPersonnel(projectId, {
            name,
            title,
            startDate,
            endDate,
          })
          set((state) => ({
            personnelByProject: {
              ...state.personnelByProject,
              [projectId]: [...(state.personnelByProject[projectId] || []), row],
            },
          }))
          return row
        }
        const row = {
          id: uid("per"),
          staffId: null,
          name,
          title,
          startDate,
          endDate: endDate || null,
        }
        set((state) => ({
          personnelByProject: {
            ...state.personnelByProject,
            [projectId]: [...(state.personnelByProject[projectId] || []), row],
          },
        }))
        return row
      },

      async removePersonnel(projectId, personnelId) {
        if (isSupabaseConfigured) {
          await personnelApi.removePersonnel(personnelId)
        }
        set((state) => ({
          personnelByProject: {
            ...state.personnelByProject,
            [projectId]: (state.personnelByProject[projectId] || []).filter(
              (row) => row.id !== personnelId,
            ),
          },
        }))
      },

      async addDocument(projectId, { title, contentType, file }) {
        if (isSupabaseConfigured) {
          const row = await documentsApi.uploadDocument(projectId, {
            title,
            contentType,
            file,
          })
          set((state) => ({
            documentsByProject: {
              ...state.documentsByProject,
              [projectId]: [row, ...(state.documentsByProject[projectId] || [])],
            },
          }))
          return row
        }
        const row = {
          id: uid("doc"),
          title,
          contentType,
          byteSize: file?.size ?? 0,
          storagePath: null,
          updatedAt: new Date().toISOString().slice(0, 10),
          deletedAt: null,
        }
        set((state) => ({
          documentsByProject: {
            ...state.documentsByProject,
            [projectId]: [...(state.documentsByProject[projectId] || []), row],
          },
        }))
        return row
      },

      async removeDocument(projectId, documentId) {
        if (isSupabaseConfigured) {
          await documentsApi.archiveDocument(documentId)
        }
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
        if (isSupabaseConfigured) {
          const node = get().scheduleByProject[projectId]?.nodes.find((row) => row.id === nodeId)
          if (node) void scheduleApi.saveNode(projectId, node)
        }
      },

      addScheduleNode(projectId, { parentId, kind, name, durationDays }) {
        set((state) => {
          const schedule = structuredClone(state.scheduleByProject[projectId])
          const parent = schedule.nodes.find((row) => row.id === parentId)
          if (!parent) return {}
          const id = isSupabaseConfigured ? crypto.randomUUID() : `${parentId}.${Math.random().toString(36).slice(2, 6)}`
          const node = {
            id,
            name: `${parent.wbsCode ? `${parent.wbsCode}.` : ""}${name}`,
            kind,
            parentId,
            boqPhaseId: parent.boqPhaseId ?? null,
            phase: parent.phase,
            locked: false,
            durationDays: kind === "leaf" ? durationDays || 0 : 0,
            isLoe: false,
            wbsCode: parent.wbsCode ? `${parent.wbsCode}.${schedule.nodes.filter((row) => row.parentId === parentId).length + 1}` : id,
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
        if (isSupabaseConfigured) {
          const schedule = get().scheduleByProject[projectId]
          const node = schedule?.nodes.find((row) => row.id === schedule.selectedId)
          if (node) void scheduleApi.saveNode(projectId, node)
        }
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
              id: isSupabaseConfigured ? crypto.randomUUID() : uid("dep"),
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
        if (isSupabaseConfigured) {
          const deps = get().scheduleByProject[projectId]?.dependencies || []
          const created = deps.find(
            (dep) =>
              dep.predecessorId === predecessorId &&
              dep.successorId === successorId &&
              dep.type === type,
          )
          if (created) void scheduleApi.saveDependency(projectId, created)
        }
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
        if (isSupabaseConfigured) {
          void scheduleApi.deleteDependenciesForSuccessor(projectId, successorId)
        }
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
        if (isSupabaseConfigured) {
          void scheduleApi.deleteNode(projectId, nodeId)
        }
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
      version: 4,
      partialize: (state) =>
        isSupabaseConfigured
          ? { settings: state.settings }
          : {
              projects: state.projects,
              boqByProject: state.boqByProject,
              personnelByProject: state.personnelByProject,
              documentsByProject: state.documentsByProject,
              scheduleByProject: state.scheduleByProject,
              settings: state.settings,
            },
      migrate: () => ({ ...createSeedState(), hydrateStatus: "ready" }),
    },
  ),
)
