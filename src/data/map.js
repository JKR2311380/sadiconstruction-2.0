export function mapProject(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    client: row.client || "",
    site: row.site || "",
    stage: row.stage,
    priority: row.priority,
    progressPct: Number(row.progress_pct ?? 0),
    expenditureOverride: row.expenditure == null ? null : Number(row.expenditure),
    budget: Number(row.budget ?? 0),
    currency: row.currency || "PHP",
    startDate: row.start_date,
    targetEndDate: row.target_end_date,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }
}

export function mapBoq(row, phases) {
  return {
    id: row.id,
    projectId: row.project_id,
    status: row.status,
    title: row.title,
    approvedAt: row.approved_at,
    phases,
  }
}

export function mapPhase(row, lines) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    colorToken: row.color_token,
    sortOrder: row.sort_order,
    lines,
  }
}

export function mapLine(row) {
  return {
    id: row.id,
    itemCode: row.item_code,
    description: row.description,
    unit: row.unit,
    quantity: Number(row.quantity ?? 0),
    rate: Number(row.rate ?? 0),
    amount: Number(row.amount ?? 0),
  }
}

export function mapCalendar(row) {
  return {
    name: row.name || "Project",
    workingWeek: row.working_week,
    hoursPerDay: Number(row.hours_per_day ?? 8),
    exceptions: (row.exceptions || []).map((item) => ({
      date: item.date,
      type: item.type,
    })),
  }
}

export function mapNode(row) {
  const kind = row.node_kind
  const color = row.boq_phases?.color_token || row.color_token || null
  return {
    id: row.id,
    name: row.name,
    kind,
    parentId: row.parent_id,
    boqPhaseId: row.boq_phase_id,
    phase: color,
    locked: kind === "phase_root",
    durationDays: Number(row.duration_days ?? 0),
    isLoe: Boolean(row.is_loe),
    wbsCode: row.wbs_code || null,
    spanStartId: null,
    spanEndId: null,
    sortOrder: row.sort_order ?? 0,
    open: true,
  }
}

export function mapDependency(row) {
  return {
    id: row.id,
    predecessorId: row.predecessor_id,
    successorId: row.successor_id,
    type: row.dep_type,
    lagDays: Number(row.lag_days ?? 0),
  }
}

export function mapDocument(row) {
  const stamp = row.updated_at || row.created_at || ""
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    storagePath: row.storage_path,
    contentType: row.content_type || "",
    byteSize: Number(row.byte_size ?? 0),
    uploadedBy: row.uploaded_by,
    updatedAt: String(stamp).slice(0, 10),
    deletedAt: row.deleted_at,
  }
}

export function mapPersonnel(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    staffId: row.staff_id,
    name: row.name,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
  }
}

export function nodeWritePayload(projectId, node) {
  return {
    id: node.id,
    project_id: projectId,
    parent_id: node.parentId,
    boq_phase_id: node.boqPhaseId,
    node_kind: node.kind,
    wbs_code: node.wbsCode ?? null,
    name: node.name,
    duration_days: node.durationDays ?? 0,
    is_loe: Boolean(node.isLoe),
    sort_order: node.sortOrder ?? 0,
  }
}
