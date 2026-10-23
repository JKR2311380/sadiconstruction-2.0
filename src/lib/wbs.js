/** Display code of a node: the stored WBS code, or a seed id that doubles as one. */
export function activityCode(node) {
  return (
    node?.wbsCode ||
    (/^[A-Z](?:\.[\w-]+)*$/.test(node?.id || "") ? node.id : "")
  )
}

/** Depth-first order: roots, then each node's children, by sort order then creation time. */
export function orderNodes(nodes) {
  const ids = new Set(nodes.map((node) => node.id))
  const byParent = new Map()
  for (const node of nodes) {
    const key = node.parentId && ids.has(node.parentId) ? node.parentId : null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key).push(node)
  }
  const ordered = []
  const seen = new Set()
  const visit = (key) => {
    const kids = (byParent.get(key) || []).sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")),
    )
    for (const node of kids) {
      if (seen.has(node.id)) continue
      seen.add(node.id)
      ordered.push(node)
      visit(node.id)
    }
  }
  visit(null)
  return ordered.concat(nodes.filter((node) => !seen.has(node.id)))
}

/** Code and sort order for a new child: highest existing sibling index plus one, so gaps never repeat a code. */
export function nextChildSlot(parent, siblings) {
  const indexes = siblings
    .map((node) => Number(/\.(\d+)$/.exec(activityCode(node))?.[1]))
    .filter(Number.isInteger)
  const index = Math.max(0, ...indexes) + 1
  const sortOrder = Math.max(0, ...siblings.map((node) => node.sortOrder ?? 0)) + 1
  const parentCode = activityCode(parent)
  return { wbsCode: parentCode ? `${parentCode}.${index}` : String(index), sortOrder }
}
