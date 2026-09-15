import type { DepType, EngineDependency, NodeMetrics } from "./types"

function constraintStart(
  type: DepType,
  lag: number,
  pred: NodeMetrics,
  successorDuration: number,
): number {
  switch (type) {
    case "FS":
      return pred.ef + lag
    case "SS":
      return pred.es + lag
    case "FF":
      return pred.ef + lag - successorDuration
    case "SF":
      return pred.es + lag - successorDuration
  }
}

function constraintFinish(
  type: DepType,
  lag: number,
  succ: NodeMetrics,
  predDuration: number,
): number {
  switch (type) {
    case "FS":
      return succ.ls - lag
    case "SS":
      return succ.ls - lag + predDuration
    case "FF":
      return succ.lf - lag
    case "SF":
      return succ.lf - lag + predDuration
  }
}

export function forwardPass(
  order: string[],
  durationOf: Map<string, number>,
  incoming: Map<string, EngineDependency[]>,
  metrics: Record<string, NodeMetrics>,
): void {
  for (const id of order) {
    const duration = durationOf.get(id) ?? 0
    const preds = incoming.get(id) ?? []
    let es = 0
    for (const dep of preds) {
      const pred = metrics[dep.predecessorId]
      if (!pred) continue
      es = Math.max(es, constraintStart(dep.type, dep.lagDays, pred, duration))
    }
    metrics[id] = {
      es,
      ef: es + duration,
      ls: es,
      lf: es + duration,
      totalFloat: 0,
      freeFloat: 0,
      isCritical: false,
    }
  }
}

export function backwardPass(
  order: string[],
  durationOf: Map<string, number>,
  outgoing: Map<string, EngineDependency[]>,
  metrics: Record<string, NodeMetrics>,
  projectDuration: number,
): void {
  for (const id of [...order].reverse()) {
    const duration = durationOf.get(id) ?? 0
    const succs = outgoing.get(id) ?? []
    let lf = projectDuration
    if (succs.length) {
      lf = succs.reduce((min, dep) => {
        const succ = metrics[dep.successorId]
        if (!succ) return min
        return Math.min(
          min,
          constraintFinish(dep.type, dep.lagDays, succ, duration),
        )
      }, Number.POSITIVE_INFINITY)
      if (!Number.isFinite(lf)) lf = projectDuration
    }
    const ls = lf - duration
    const current = metrics[id]
    const totalFloat = ls - current.es
    metrics[id] = {
      ...current,
      ls,
      lf,
      totalFloat,
      freeFloat: totalFloat,
      isCritical: false,
    }
  }
}

export function applyFreeFloat(
  order: string[],
  outgoing: Map<string, EngineDependency[]>,
  metrics: Record<string, NodeMetrics>,
): void {
  for (const id of order) {
    const current = metrics[id]
    const succs = outgoing.get(id) ?? []
    if (!succs.length) {
      current.freeFloat = current.totalFloat
      continue
    }
    let free = Number.POSITIVE_INFINITY
    for (const dep of succs) {
      const succ = metrics[dep.successorId]
      if (!succ) continue
      const start = constraintStart(
        dep.type,
        dep.lagDays,
        current,
        succ.ef - succ.es,
      )
      free = Math.min(free, succ.es - start)
    }
    current.freeFloat = Number.isFinite(free)
      ? Math.max(0, free)
      : current.totalFloat
  }
}
