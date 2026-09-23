import { mapCalendar, mapDependency, mapNode, nodeWritePayload } from "@/data/map"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export async function loadNetwork(projectId) {
  const [{ data: calendarRow, error: calendarError }, { data: nodeRows, error: nodeError }, { data: depRows, error: depError }] =
    await Promise.all([
      supabase.from("project_calendars").select("*").eq("project_id", projectId).maybeSingle(),
      supabase
        .from("schedule_nodes")
        .select("*, boq_phases(color_token)")
        .eq("project_id", projectId)
        .order("sort_order"),
      supabase.from("dependencies").select("*").eq("project_id", projectId),
    ])

  if (calendarError) throw calendarError
  if (nodeError) throw nodeError
  if (depError) throw depError

  return {
    calendar: calendarRow
      ? mapCalendar(calendarRow)
      : {
          name: "Project",
          workingWeek: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
          hoursPerDay: 8,
          exceptions: [],
        },
    nodes: (nodeRows ?? []).map(mapNode),
    dependencies: (depRows ?? []).map(mapDependency),
    selectedId: null,
  }
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

export async function deleteNode(projectId, nodeId) {
  const { error } = await supabase.from("schedule_nodes").delete().eq("project_id", projectId).eq("id", nodeId)
  if (error) throw error
}

export { isSupabaseConfigured }
