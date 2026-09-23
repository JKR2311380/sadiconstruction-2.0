import { recalculate, type NodeMetrics } from "@/features/scheduling/engine"
import type { EngineDependency, EngineNode } from "@/features/scheduling/engine/types"

/** Synthetic Clearwater Medical Center (PRJ-2024-008) network used across the landing. */
export interface DemoActivity {
  id: string
  code: string
  name: string
  phase: string
  duration: number
  /** Engine diagram layout, in viewBox units. */
  x: number
  y: number
}

export const ACTIVITIES: DemoActivity[] = [
  { id: "A", code: "1.1", name: "Mobilise site", phase: "Preliminaries", duration: 5, x: 2, y: 162 },
  { id: "B", code: "2.1", name: "Excavate & pile", phase: "Site works", duration: 12, x: 148, y: 162 },
  { id: "H", code: "2.4", name: "Utility mains", phase: "Site works", duration: 8, x: 366, y: 284 },
  { id: "C", code: "3.1", name: "Foundations", phase: "Concrete", duration: 10, x: 294, y: 162 },
  { id: "D", code: "3.2", name: "Frame L1–L4", phase: "Concrete", duration: 18, x: 440, y: 162 },
  { id: "E", code: "5.1", name: "Services rough-in", phase: "Services", duration: 14, x: 586, y: 40 },
  { id: "F", code: "4.1", name: "Envelope", phase: "Envelope", duration: 16, x: 586, y: 162 },
  { id: "G", code: "6.1", name: "Fit-out", phase: "Finishes", duration: 20, x: 732, y: 162 },
  { id: "I", code: "6.4", name: "Handover", phase: "Finishes", duration: 3, x: 874, y: 162 },
]

export const LINKS: Array<[string, string]> = [
  ["A", "B"],
  ["A", "H"],
  ["B", "C"],
  ["C", "D"],
  ["D", "E"],
  ["D", "F"],
  ["E", "G"],
  ["F", "G"],
  ["G", "I"],
  ["H", "I"],
]

export const NODE_W = 124
export const NODE_H = 60

export interface NetworkResult {
  metrics: Record<string, NodeMetrics>
  critical: Set<string>
  duration: number
}

export function computeNetwork(durations: Record<string, number> = {}): NetworkResult {
  const nodes: EngineNode[] = ACTIVITIES.map((activity) => ({
    id: activity.id,
    parentId: null,
    kind: "leaf",
    durationDays: durations[activity.id] ?? activity.duration,
    isLoe: false,
  }))
  const dependencies: EngineDependency[] = LINKS.map(([predecessorId, successorId]) => ({
    predecessorId,
    successorId,
    type: "FS",
    lagDays: 0,
  }))
  const result = recalculate({
    nodes,
    dependencies,
    calendar: {
      workingWeek: { sun: false, mon: true, tue: true, wed: true, thu: true, fri: true, sat: false },
      exceptions: [],
    },
  })
  if (!result.ok) throw new Error("Demo network must stay acyclic")
  return {
    metrics: result.metrics,
    critical: new Set(result.criticalIds),
    duration: result.projectDurationDays,
  }
}

export function isCriticalLink(critical: Set<string>, [from, to]: [string, string], metrics: Record<string, NodeMetrics>) {
  return critical.has(from) && critical.has(to) && metrics[from].ef === metrics[to].es
}
