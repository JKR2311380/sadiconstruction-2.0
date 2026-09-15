import { applyFreeFloat, backwardPass, forwardPass } from "./forwardBackward"
import { markLongestPath } from "./longestPath"
import { drivingLeaves, topoSort } from "./topo"
import type {
  EngineDependency,
  EngineNode,
  NodeMetrics,
  RecalcInput,
  RecalcResult,
} from "./types"

function groupDeps(dependencies: EngineDependency[], leafIds: Set<string>) {
  const incoming = new Map<string, EngineDependency[]>()
  const outgoing = new Map<string, EngineDependency[]>()
  for (const id of leafIds) {
    incoming.set(id, [])
    outgoing.set(id, [])
  }
  for (const dep of dependencies) {
    if (!leafIds.has(dep.predecessorId) || !leafIds.has(dep.successorId)) continue
    incoming.get(dep.successorId)!.push(dep)
    outgoing.get(dep.predecessorId)!.push(dep)
  }
  return { incoming, outgoing }
}

function descendantLeaves(rootId: string, nodes: EngineNode[]): EngineNode[] {
  const kids = nodes.filter((node) => node.parentId === rootId)
  const acc: EngineNode[] = []
  for (const kid of kids) {
    if (kid.kind === "leaf" && !kid.isLoe) acc.push(kid)
    else acc.push(...descendantLeaves(kid.id, nodes))
  }
  return acc
}

function rollup(
  nodes: EngineNode[],
  metrics: Record<string, NodeMetrics>,
): void {
  for (const node of nodes) {
    if (node.kind === "leaf" && !node.isLoe) continue

    if (node.isLoe) {
      const start = node.spanStartId ? metrics[node.spanStartId] : undefined
      const end = node.spanEndId ? metrics[node.spanEndId] : undefined
      if (start && end) {
        metrics[node.id] = {
          es: start.es,
          ef: end.ef,
          ls: start.es,
          lf: end.ef,
          totalFloat: null,
          freeFloat: null,
          isCritical: false,
        }
        continue
      }
    }

    const kids = descendantLeaves(node.id, nodes)
    if (!kids.length) {
      metrics[node.id] = {
        es: 0,
        ef: 0,
        ls: 0,
        lf: 0,
        totalFloat: null,
        freeFloat: null,
        isCritical: false,
      }
      continue
    }

    const es = Math.min(...kids.map((kid) => metrics[kid.id]?.es ?? 0))
    const ef = Math.max(...kids.map((kid) => metrics[kid.id]?.ef ?? 0))
    metrics[node.id] = {
      es,
      ef,
      ls: es,
      lf: ef,
      totalFloat: null,
      freeFloat: null,
      isCritical: false,
    }
  }
}

export function recalculate(input: RecalcInput): RecalcResult {
  const leaves = drivingLeaves(input.nodes)
  if (!leaves.length) {
    const metrics: Record<string, NodeMetrics> = {}
    rollup(input.nodes, metrics)
    return { ok: true, metrics, criticalIds: [], projectDurationDays: 0 }
  }

  const sorted = topoSort(leaves, input.dependencies)
  if ("cycle" in sorted) {
    return { ok: false, error: { type: "cycle", nodeIds: sorted.cycle } }
  }

  const leafIds = new Set(leaves.map((node) => node.id))
  const durationOf = new Map(leaves.map((node) => [node.id, node.durationDays]))
  const { incoming, outgoing } = groupDeps(input.dependencies, leafIds)
  const metrics: Record<string, NodeMetrics> = {}

  forwardPass(sorted.order, durationOf, incoming, metrics)
  const projectDurationDays = Math.max(
    0,
    ...Object.values(metrics).map((row) => row.ef),
  )
  backwardPass(sorted.order, durationOf, outgoing, metrics, projectDurationDays)
  applyFreeFloat(sorted.order, outgoing, metrics)
  const criticalIds = markLongestPath(
    sorted.order,
    incoming,
    metrics,
    projectDurationDays,
  )
  rollup(input.nodes, metrics)

  return { ok: true, metrics, criticalIds, projectDurationDays }
}

export type { RecalcInput, RecalcResult, NodeMetrics } from "./types"
