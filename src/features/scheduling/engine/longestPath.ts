import type { EngineDependency, NodeMetrics } from "./types"

const EPS = 1e-9

function isTight(
  pred: NodeMetrics,
  succ: NodeMetrics,
  dep: EngineDependency,
): boolean {
  const duration = succ.ef - succ.es
  let required = pred.ef + dep.lagDays
  if (dep.type === "SS") required = pred.es + dep.lagDays
  if (dep.type === "FF") required = pred.ef + dep.lagDays - duration
  if (dep.type === "SF") required = pred.es + dep.lagDays - duration
  return Math.abs(succ.es - required) < EPS
}

export function markLongestPath(
  order: string[],
  incoming: Map<string, EngineDependency[]>,
  metrics: Record<string, NodeMetrics>,
  projectDuration: number,
): string[] {
  for (const id of order) {
    const row = metrics[id]
    row.isCritical = Math.abs(row.totalFloat ?? 1) < EPS
  }

  const finishers = order.filter((id) => {
    const row = metrics[id]
    return row.isCritical && Math.abs(row.ef - projectDuration) < EPS
  })

  const driving = new Set<string>()
  const stack = [...finishers]
  while (stack.length) {
    const id = stack.pop()!
    if (driving.has(id)) continue
    driving.add(id)
    for (const dep of incoming.get(id) ?? []) {
      const pred = metrics[dep.predecessorId]
      if (!pred?.isCritical) continue
      if (isTight(pred, metrics[id], dep)) stack.push(dep.predecessorId)
    }
  }

  if (driving.size === 0) {
    return order.filter((id) => metrics[id].isCritical)
  }

  for (const id of order) {
    metrics[id].isCritical = driving.has(id)
  }

  return order.filter((id) => driving.has(id))
}
