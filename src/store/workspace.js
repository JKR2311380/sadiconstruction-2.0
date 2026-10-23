import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  createSeedState,
  DEFAULT_CALENDAR,
} from "@/data/mock/seed"
import { nextProjectCode } from "@/lib/projectCode"
import { parseBoqCsv } from "@/data/mock/csv"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { clampDays, MAX_DAYS, todayIso } from "@/lib/utils"
import { nextChildSlot, orderNodes } from "@/lib/wbs"
import { recalculate } from "@/features/scheduling/engine"
import { overallProgress, progressByProject } from "@/features/scheduling/scheduleReport"
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
  progressByProject: {},
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

/** Percent complete from the schedule (ADR 0004: metrics are recomputed, not stored). Null = no activities. */
export function projectProgress(state, projectId) {
  const schedule = state.scheduleByProject[projectId]
  if (!schedule) return state.progressByProject[projectId] ?? null
  const hasActivities = schedule.nodes.some((node) => node.kind === "leaf" && !node.isLoe)
  return hasActivities ? overallProgress(schedule.nodes) : null
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

function patchNode(state, projectId, nodeId, patch) {
  const schedule = state.scheduleByProject[projectId]
  if (!schedule) return {}
  return {
    scheduleByProject: {
      ...state.scheduleByProject,
      [projectId]: {
        ...schedule,
        nodes: schedule.nodes.map((node) =>
          node.id === nodeId ? { ...node, ...patch } : node,
        ),
      },
    },
  }
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
      found.wbsCode = phase.code
      found.sortOrder = phase.sortOrder
      continue
    }
    schedule.nodes.push({
      id: phase.code,
      name: `${phase.code} – ${phase.name}`,
      wbsCode: phase.code,
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
  schedule.nodes = orderNodes(schedule.nodes)
}

export const useWorkspaceStore = create(
  persist(
    (set, get) => ({
      ...(isSupabaseConfigured ? emptyWorkspace : createSeedState()),
      hydrateStatus: isSupabaseConfigured ? "idle" : "ready",
      networkStatusByProject: {},
      progressByProject: {},

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
          // Directory progress is a convenience; a failure here must not block the workspace.
          const leafRows = await scheduleApi.loadLeafProgress(ids).catch((error) => {
            console.error("Directory progress load failed", error)
            return []
          })
          set({
            projects,
            boqByProject,
            documentsByProject,
            personnelByProject,
            scheduleByProject: {},
            progressByProject: progressByProject(leafRows),
            hydrateStatus: "ready",
          })
        } catch (error) {
          console.error("Workspace hydrate failed", error)
          set({ hydrateStatus: "error" })
        }
      },

      async ensureNetwork(projectId) {
        if (get().scheduleByProject[projectId]) return
        if (get().networkStatusByProject[projectId] === "loading") return
        const setStatus = (status) =>
          set((state) => ({
            networkStatusByProject: { ...state.networkStatusByProject, [projectId]: status },
          }))
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
        setStatus("loading")
        try {
          await scheduleApi.syncPhaseRoots(projectId)
          const network = await scheduleApi.loadNetwork(projectId)
          set((state) => ({
            scheduleByProject: { ...state.scheduleByProject, [projectId]: network },
          }))
          setStatus("ready")
        } catch (error) {
          console.error("ensureNetwork failed", error)
          setStatus("error")
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
          budget: null,
          currency: "PHP",
          startDate: todayIso(),
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

      async updateProject(projectId, fields) {
        const current = get().projects.find((project) => project.id === projectId)
        const next = isSupabaseConfigured
          ? await projectsApi.updateProject(projectId, { ...current, ...fields })
          : { ...current, ...fields, updatedAt: new Date().toISOString() }
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? next : project,
          ),
        }))
        return next
      },

      // Soft delete (ADR 0011). There is no restore screen yet.
      async archiveProject(projectId) {
        if (isSupabaseConfigured) await projectsApi.archiveProject(projectId)
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { ...project, deletedAt: new Date().toISOString() }
              : project,
          ),
        }))
      },

      touchProject(projectId) {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { ...project, updatedAt: new Date().toISOString() }
              : project,
          ),
        }))
        if (isSupabaseConfigured) {
          void projectsApi
            .touchProject(projectId)
            .catch((error) => console.error("touchProject failed", error))
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
          // The BOQ reload does not depend on the phase-root sync, so they run side by side.
          const [boq, network] = await Promise.all([
            boqApi.loadBoq(projectId),
            scheduleApi.syncPhaseRoots(projectId).then(() => scheduleApi.loadNetwork(projectId)),
          ])
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
            phases: parsed.phases.map((phase) => ({
              ...phase,
              id: state.boqByProject[projectId]?.phases.find((existing) => existing.code === phase.code)?.id || phase.id,
            })),
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
          updatedAt: todayIso(),
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

      // Inline edits apply at once and roll back that one field if the save fails.
      async setNodeField(projectId, nodeId, field, column, value) {
        const node = get().scheduleByProject[projectId]?.nodes.find((row) => row.id === nodeId)
        if (!node || node.kind !== "leaf" || node.isLoe) return
        const previous = node[field]
        set((state) => patchNode(state, projectId, nodeId, { [field]: value }))
        if (!isSupabaseConfigured) return
        try {
          await scheduleApi.updateNode(projectId, nodeId, { [column]: value })
        } catch (error) {
          set((state) => {
            const current = state.scheduleByProject[projectId]?.nodes.find((row) => row.id === nodeId)
            return current?.[field] === value
              ? patchNode(state, projectId, nodeId, { [field]: previous })
              : {}
          })
          throw error
        }
      },

      setDuration(projectId, nodeId, durationDays) {
        return get().setNodeField(projectId, nodeId, "durationDays", "duration_days", clampDays(durationDays))
      },

      setProgress(projectId, nodeId, progressPct) {
        return get().setNodeField(
          projectId,
          nodeId,
          "progressPct",
          "progress_pct",
          Math.min(100, Math.max(0, Math.round(Number(progressPct) || 0))),
        )
      },

      async setBaseline(projectId, baseline) {
        if (isSupabaseConfigured) {
          await (baseline ? scheduleApi.saveBaseline(projectId, baseline) : scheduleApi.clearBaseline(projectId))
        }
        set((state) => ({
          scheduleByProject: {
            ...state.scheduleByProject,
            [projectId]: { ...state.scheduleByProject[projectId], baseline },
          },
        }))
      },

      async addScheduleNode(projectId, { parentId, kind, name, durationDays }) {
        const current = get().scheduleByProject[projectId]
        const parent = current?.nodes.find((row) => row.id === parentId)
        if (!parent) return
        const id = isSupabaseConfigured ? crypto.randomUUID() : `${parentId}.${Math.random().toString(36).slice(2, 6)}`
        const slot = nextChildSlot(parent, current.nodes.filter((row) => row.parentId === parentId))
        const node = {
          id,
          name,
          kind,
          parentId,
          boqPhaseId: parent.boqPhaseId ?? null,
          phase: parent.phase,
          locked: false,
          durationDays: kind === "leaf" ? clampDays(durationDays) : 0,
          isLoe: false,
          wbsCode: slot.wbsCode,
          spanStartId: null,
          spanEndId: null,
          sortOrder: slot.sortOrder,
          open: true,
        }
        // The row must exist on the server before it can be picked as a parent.
        if (isSupabaseConfigured) await scheduleApi.saveNode(projectId, node)
        set((state) => {
          const schedule = structuredClone(state.scheduleByProject[projectId])
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
          if (parentIndex >= 0) schedule.nodes[parentIndex].open = true
          schedule.selectedId = id
          return {
            scheduleByProject: {
              ...state.scheduleByProject,
              [projectId]: schedule,
            },
          }
        })
        return node
      },

      async addDependency(projectId, { predecessorId, successorId, type, lagDays: rawLag = 0 }) {
        const current = get().scheduleByProject[projectId]
        if (predecessorId === successorId || !Number.isFinite(rawLag)) return
        const lagDays = clampDays(rawLag, -MAX_DAYS)
        if (current.dependencies.some((dep) => dep.predecessorId === predecessorId && dep.successorId === successorId && dep.type === type)) return
        const dep = { id: isSupabaseConfigured ? crypto.randomUUID() : uid("dep"), predecessorId, successorId, type, lagDays }
        // Refuse a link that turns a valid network into a cycle; an existing cycle stays editable.
        const network = (dependencies) => recalculate({ nodes: current.nodes, dependencies, calendar: current.calendar })
        if (network(current.dependencies).ok && !network([...current.dependencies, dep]).ok) {
          throw new Error("This link would create a dependency cycle. Pick a different predecessor.")
        }
        if (isSupabaseConfigured) await scheduleApi.saveDependency(projectId, dep)
        set((state) => {
          const schedule = structuredClone(state.scheduleByProject[projectId])
          if (!schedule.dependencies.some((row) => row.predecessorId === predecessorId && row.successorId === successorId && row.type === type)) schedule.dependencies.push(dep)
          return { scheduleByProject: { ...state.scheduleByProject, [projectId]: schedule } }
        })
      },

      async removeDependency(projectId, dependencyId) {
        if (isSupabaseConfigured) await scheduleApi.deleteDependency(projectId, dependencyId)
        set((state) => {
          const schedule = structuredClone(state.scheduleByProject[projectId])
          schedule.dependencies = schedule.dependencies.filter((dep) => dep.id !== dependencyId)
          return { scheduleByProject: { ...state.scheduleByProject, [projectId]: schedule } }
        })
      },

      async clearDependencies(projectId, successorId) {
        if (isSupabaseConfigured) await scheduleApi.deleteDependenciesForSuccessor(projectId, successorId)
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

      async renameScheduleNode(projectId, nodeId, name) {
        const node = get().scheduleByProject[projectId]?.nodes.find((row) => row.id === nodeId)
        const next = name.trim()
        if (!node || node.kind === "phase_root" || node.locked || !next) return
        if (isSupabaseConfigured) await scheduleApi.updateNode(projectId, nodeId, { name: next })
        set((state) => patchNode(state, projectId, nodeId, { name: next }))
      },

      // Hard delete (ADR 0011): the database cascades to children and links.
      async deleteScheduleNode(projectId, nodeId) {
        const target = get().scheduleByProject[projectId]?.nodes.find((row) => row.id === nodeId)
        if (!target || target.kind === "phase_root" || target.locked) return
        if (isSupabaseConfigured) await scheduleApi.deleteNode(projectId, nodeId)
        set((state) => {
          const schedule = structuredClone(state.scheduleByProject[projectId])
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
          for (const node of schedule.nodes) {
            if (removeIds.has(node.spanStartId)) node.spanStartId = null
            if (removeIds.has(node.spanEndId)) node.spanEndId = null
          }
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

// Every successful change to a project's records also bumps its "Updated" stamp (QA-036).
const TOUCHING = [
  "replaceBoqFromCsv",
  "addPersonnel",
  "removePersonnel",
  "addDocument",
  "removeDocument",
  "setNodeField",
  "setBaseline",
  "addScheduleNode",
  "renameScheduleNode",
  "deleteScheduleNode",
  "addDependency",
  "removeDependency",
  "clearDependencies",
]
useWorkspaceStore.setState((state) =>
  Object.fromEntries(
    TOUCHING.map((name) => [
      name,
      async (projectId, ...args) => {
        const result = await state[name](projectId, ...args)
        if (result?.ok !== false) useWorkspaceStore.getState().touchProject(projectId)
        return result
      },
    ]),
  ),
)
