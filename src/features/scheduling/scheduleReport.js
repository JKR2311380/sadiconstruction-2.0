import { workingDateAtIndex } from "./engine/calendar"

const isDriving = (node) => node.kind === "leaf" && !node.isLoe

function descendantLeaves(nodeId, nodes) {
  const out = []
  for (const child of nodes.filter((row) => row.parentId === nodeId)) {
    if (isDriving(child)) out.push(child)
    else if (!child.isLoe) out.push(...descendantLeaves(child.id, nodes))
  }
  return out
}

/** Percent complete per node. Leaves use their own value; parents weight leaves by duration. */
export function computeProgress(nodes) {
  const result = {}
  for (const node of nodes) {
    if (isDriving(node)) {
      result[node.id] = clampPct(node.progressPct)
      continue
    }
    if (node.isLoe) continue
    const leaves = descendantLeaves(node.id, nodes)
    const weight = leaves.reduce((sum, leaf) => sum + (leaf.durationDays || 0), 0)
    if (!leaves.length) result[node.id] = 0
    else if (weight === 0) result[node.id] = average(leaves.map((leaf) => clampPct(leaf.progressPct)))
    else {
      result[node.id] = Math.round(
        leaves.reduce((sum, leaf) => sum + clampPct(leaf.progressPct) * (leaf.durationDays || 0), 0) / weight,
      )
    }
  }
  return result
}

export function overallProgress(nodes) {
  const leaves = nodes.filter(isDriving)
  const weight = leaves.reduce((sum, leaf) => sum + (leaf.durationDays || 0), 0)
  if (!leaves.length) return 0
  if (weight === 0) return average(leaves.map((leaf) => clampPct(leaf.progressPct)))
  return Math.round(
    leaves.reduce((sum, leaf) => sum + clampPct(leaf.progressPct) * (leaf.durationDays || 0), 0) / weight,
  )
}

/** Snapshot of the current CPM result, stored as the schedule baseline. */
export function makeBaseline(metrics, projectDurationDays, capturedAt = new Date().toISOString()) {
  const nodes = {}
  for (const [id, row] of Object.entries(metrics)) nodes[id] = { es: row.es, ef: row.ef }
  return { capturedAt, projectDurationDays, nodes }
}

/** Finish variance in working days vs baseline: positive = later than baseline. */
export function finishVariance(baseline, nodeId, metrics) {
  const was = baseline?.nodes?.[nodeId]
  const now = metrics[nodeId]
  if (!was || !now) return null
  return now.ef - was.ef
}

function csvCell(value) {
  const text = value == null ? "" : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function dateAt(startDate, index, calendar) {
  if (!startDate) return ""
  return workingDateAtIndex(startDate, index, calendar)
}

function depth(node, nodes) {
  let d = 0
  let cursor = node
  while (cursor?.parentId) {
    d += 1
    cursor = nodes.find((row) => row.id === cursor.parentId)
  }
  return d
}

/** Schedule rows as CSV. Dates are filled when the project has a start date. */
export function scheduleToCsv({ nodes, dependencies, metrics, baseline, calendar, startDate }) {
  const progress = computeProgress(nodes)
  const header = [
    "wbs",
    "level",
    "name",
    "type",
    "duration_days",
    "predecessors",
    "early_start",
    "early_finish",
    "late_start",
    "late_finish",
    "total_float",
    "critical",
    "percent_complete",
    "baseline_finish",
    "finish_variance_days",
  ]
  const rows = nodes.map((node) => {
    const m = metrics[node.id]
    const preds = dependencies
      .filter((dep) => dep.successorId === node.id)
      .map((dep) => {
        const pred = nodes.find((row) => row.id === dep.predecessorId)
        const lag = dep.lagDays ? `${dep.lagDays > 0 ? "+" : ""}${dep.lagDays}` : ""
        return `${pred?.wbsCode || dep.predecessorId}${dep.type}${lag}`
      })
      .join(";")
    const was = baseline?.nodes?.[node.id]
    const variance = finishVariance(baseline, node.id, metrics)
    return [
      node.wbsCode || "",
      depth(node, nodes),
      node.name,
      node.isLoe ? "hammock" : node.kind,
      isDriving(node) ? node.durationDays : "",
      preds,
      m ? dateAt(startDate, m.es, calendar) : "",
      m ? dateAt(startDate, Math.max(m.ef - 1, 0), calendar) : "",
      m && isDriving(node) ? dateAt(startDate, m.ls, calendar) : "",
      m && isDriving(node) ? dateAt(startDate, Math.max(m.lf - 1, 0), calendar) : "",
      m?.totalFloat ?? "",
      m?.isCritical ? "yes" : "",
      progress[node.id] ?? "",
      was ? dateAt(startDate, Math.max(was.ef - 1, 0), calendar) || was.ef : "",
      variance ?? "",
    ]
  })
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n"
}

function clampPct(value) {
  const n = Number(value) || 0
  return Math.min(100, Math.max(0, Math.round(n)))
}

function average(values) {
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
}
