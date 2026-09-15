import type { EngineDependency, EngineNode } from "./types"

export function drivingLeaves(nodes: EngineNode[]): EngineNode[] {
  return nodes.filter((node) => node.kind === "leaf" && !node.isLoe)
}

export function topoSort(
  leaves: EngineNode[],
  dependencies: EngineDependency[],
): { order: string[] } | { cycle: string[] } {
  const ids = new Set(leaves.map((node) => node.id))
  const indeg = new Map<string, number>()
  const succs = new Map<string, string[]>()

  for (const id of ids) {
    indeg.set(id, 0)
    succs.set(id, [])
  }

  for (const dep of dependencies) {
    if (!ids.has(dep.predecessorId) || !ids.has(dep.successorId)) continue
    succs.get(dep.predecessorId)!.push(dep.successorId)
    indeg.set(dep.successorId, (indeg.get(dep.successorId) ?? 0) + 1)
  }

  const queue = [...ids].filter((id) => (indeg.get(id) ?? 0) === 0)
  const order: string[] = []

  while (queue.length) {
    const id = queue.shift()!
    order.push(id)
    for (const next of succs.get(id) ?? []) {
      const nextDeg = (indeg.get(next) ?? 0) - 1
      indeg.set(next, nextDeg)
      if (nextDeg === 0) queue.push(next)
    }
  }

  if (order.length !== ids.size) {
    const leftover = [...ids].filter((id) => !order.includes(id))
    return { cycle: leftover }
  }

  return { order }
}
