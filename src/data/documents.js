import { mapDocument } from "@/data/map"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export const DOCUMENT_BUCKET = "project-documents"
export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024

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

export async function listDocuments(projectId) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapDocument)
}

export async function loadAllDocuments(projectIds) {
  if (!projectIds.length) return {}
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .in("project_id", projectIds)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
  if (error) throw error
  return groupByProject((data ?? []).map(mapDocument), projectIds)
}

export async function uploadDocument(projectId, { title, contentType, file }) {
  if (!file) throw new Error("Choose a file to upload.")
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error("File exceeds the 50 MB Free-tier maximum.")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const id = crypto.randomUUID()
  const storagePath = `${projectId}/${id}`

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from("documents")
    .insert({
      id,
      project_id: projectId,
      title,
      storage_path: storagePath,
      content_type: contentType || file.type || null,
      byte_size: file.size,
      uploaded_by: user?.id ?? null,
    })
    .select("*")
    .single()

  if (error) {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([storagePath])
    throw error
  }
  return mapDocument(data)
}

export async function archiveDocument(documentId) {
  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", documentId)
  if (error) throw error
}

export async function getDocumentUrl(doc) {
  if (!doc?.storagePath) return null
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(doc.storagePath, 120)
  if (error) throw error
  return data?.signedUrl ?? null
}

export { isSupabaseConfigured }
