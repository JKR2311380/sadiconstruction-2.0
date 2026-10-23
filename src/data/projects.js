import { mapProject } from "@/data/map"
import { nextProjectCode } from "@/lib/projectCode"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export async function listProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapProject)
}

export async function createProject({ name, client, stage = "planning", existing = [] }) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // next_project_code is not atomic: retry once when another insert took the code.
  for (let attempt = 0; ; attempt += 1) {
    const { data: code, error: codeError } = await supabase.rpc("next_project_code")
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name,
        client: client || null,
        stage,
        code: codeError ? nextProjectCode(existing) : code,
        created_by: user?.id ?? null,
      })
      .select("*")
      .single()
    if (!error) return mapProject(data)
    if (error.code !== "23505" || attempt > 0) throw error
  }
}

export async function updateProject(projectId, fields) {
  const { data, error } = await supabase
    .from("projects")
    .update({
      name: fields.name,
      client: fields.client || null,
      site: fields.site || null,
      stage: fields.stage,
      priority: fields.priority,
      budget: fields.budget,
      start_date: fields.startDate || null,
      target_end_date: fields.targetEndDate || null,
    })
    .eq("id", projectId)
    .select("*")
    .single()
  if (error) throw error
  return mapProject(data)
}

export async function archiveProject(projectId) {
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", projectId)
  if (error) throw error
}

export async function touchProject(projectId) {
  const { error } = await supabase
    .from("projects")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", projectId)
  if (error) throw error
}

export { isSupabaseConfigured }
