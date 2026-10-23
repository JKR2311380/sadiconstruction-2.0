import { mapCalendar, mapDependency, mapNode, nodeWritePayload } from "@/data/map"
import { orderNodes } from "@/lib/wbs"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export async function loadNetwork(projectId) {
  const [{ data: calendarRow, error: calendarError }, { data: nodeRows, error: nodeError }, { data: depRows, error: depError }, { data: baselineRow, error: baselineError }] =
    await Promise.all([
      supabase.from("project_calendars").select("*").eq("project_id", projectId).maybeSingle(),
      supabase
        .from("schedule_nodes")
        .select("*, boq_phases(color_token)")
        .eq("project_id", projectId)
        .order("sort_order"),
      supabase.from("dependencies").select("*").eq("project_id", projectId),
      supabase.from("schedule_baselines").select("*").eq("project_id", projectId).maybeSingle(),
    ])

  if (calendarError) throw calendarError
  if (nodeError) throw nodeError
  if (depError) throw depError
  if (baselineError) throw baselineError

  return {
    calendar: calendarRow
      ? mapCalendar(calendarRow)
      : {
          name: "Project",
          workingWeek: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
          hoursPerDay: 8,
          exceptions: [],
        },
    // sort_order is per sibling, so rows must be arranged into tree order here.
    nodes: orderNodes((nodeRows ?? []).map(mapNode)),
    dependencies: (depRows ?? []).map(mapDependency),
    baseline: baselineRow
      ? {
          capturedAt: baselineRow.captured_at,
          projectDurationDays: Number(baselineRow.project_duration_days),
          nodes: baselineRow.nodes ?? {},
        }
      : null,
    selectedId: null,
  }
}

/** Leaf rows of every listed project, for directory progress. Paged: requests return at most 1000 rows. */
export async function loadLeafProgress(projectIds) {
  if (!projectIds.length) return []
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("schedule_nodes")
      .select("id, project_id, is_loe, duration_days, progress_pct")
      .in("project_id", projectIds)
      .eq("node_kind", "leaf")
      .order("id")
      .range(from, from + 999)
    if (error) throw error
    rows.push(...data)
    if (data.length < 1000) break
  }
  return rows.map((row) => ({
    projectId: row.project_id,
    kind: "leaf",
    isLoe: Boolean(row.is_loe),
    durationDays: Number(row.duration_days ?? 0),
    progressPct: Number(row.progress_pct ?? 0),
  }))
}

export async function syncPhaseRoots(projectId) {
  const { error } = await supabase.rpc("sync_phase_roots", { p_project_id: projectId })
  if (error) throw error
}

export async function saveNode(projectId, node) {
  const { error } = await supabase.from("schedule_nodes").upsert(nodeWritePayload(projectId, node), {
    onConflict: "id",
  })
  if (error) throw error
}

/** Writes only the given columns, so two quick edits to one node cannot overwrite each other. */
export async function updateNode(projectId, nodeId, patch) {
  const { error } = await supabase
    .from("schedule_nodes")
    .update(patch)
    .eq("project_id", projectId)
    .eq("id", nodeId)
  if (error) throw error
}

export async function saveDependency(projectId, dep) {
  const payload = {
    project_id: projectId,
    predecessor_id: dep.predecessorId,
    successor_id: dep.successorId,
    dep_type: dep.type,
    lag_days: dep.lagDays ?? 0,
  }
  if (dep.id && !String(dep.id).startsWith("dep-")) payload.id = dep.id
  const { error } = await supabase.from("dependencies").upsert(payload, {
    onConflict: "predecessor_id,successor_id,dep_type",
  })
  if (error) throw error
}

export async function deleteDependenciesForSuccessor(projectId, successorId) {
  const { error } = await supabase
    .from("dependencies")
    .delete()
    .eq("project_id", projectId)
    .eq("successor_id", successorId)
  if (error) throw error
}

export async function saveBaseline(projectId, baseline) {
  const { error } = await supabase.from("schedule_baselines").upsert(
    {
      project_id: projectId,
      captured_at: baseline.capturedAt,
      project_duration_days: baseline.projectDurationDays,
      nodes: baseline.nodes,
    },
    { onConflict: "project_id" },
  )
  if (error) throw error
}

export async function clearBaseline(projectId) {
  const { error } = await supabase.from("schedule_baselines").delete().eq("project_id", projectId)
  if (error) throw error
}

export async function deleteNode(projectId, nodeId) {
  const { error } = await supabase.from("schedule_nodes").delete().eq("project_id", projectId).eq("id", nodeId)
  if (error) throw error
}

export { isSupabaseConfigured }

export async function deleteDependency(projectId, dependencyId) {
  const { error } = await supabase.from("dependencies").delete().eq("project_id", projectId).eq("id", dependencyId)
  if (error) throw error
}
