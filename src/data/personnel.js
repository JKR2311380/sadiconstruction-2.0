import { mapPersonnel } from "@/data/map"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

function groupByProject(rows, projectIds) {
  const result = {}
  for (const id of projectIds) result[id] = []
  for (const row of rows) {
    const list = result[row.projectId]
    if (list) list.push(row)
    else result[row.projectId] = [row]
  }
  return result
}

export async function listPersonnel(projectId) {
  const { data, error } = await supabase
    .from("project_personnel")
    .select("*")
    .eq("project_id", projectId)
    .order("start_date", { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data ?? []).map(mapPersonnel)
}

export async function loadAllPersonnel(projectIds) {
  if (!projectIds.length) return {}
  const { data, error } = await supabase
    .from("project_personnel")
    .select("*")
    .in("project_id", projectIds)
    .order("start_date", { ascending: true, nullsFirst: false })
  if (error) throw error
  return groupByProject((data ?? []).map(mapPersonnel), projectIds)
}

export async function addPersonnel(projectId, { name, title, startDate, endDate }) {
  const { data, error } = await supabase
    .from("project_personnel")
    .insert({
      project_id: projectId,
      staff_id: null,
      name,
      title,
      start_date: startDate || null,
      end_date: endDate || null,
    })
    .select("*")
    .single()
  if (error) throw error
  return mapPersonnel(data)
}

export async function removePersonnel(personnelId) {
  const { error } = await supabase
    .from("project_personnel")
    .delete()
    .eq("id", personnelId)
  if (error) throw error
}

export { isSupabaseConfigured }
