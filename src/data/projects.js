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
  const { data: code, error: codeError } = await supabase.rpc("next_project_code")
  if (codeError) {
    const fallback = nextProjectCode(existing)
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name,
        client: client || null,
        stage,
        code: fallback,
        created_by: user?.id ?? null,
      })
      .select("*")
      .single()
    if (error) throw error
    return mapProject(data)
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      client: client || null,
      stage,
      code,
      created_by: user?.id ?? null,
    })
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
