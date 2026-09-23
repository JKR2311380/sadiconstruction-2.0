import { loadMockStaff, publicStaff, saveMockStaff } from "@/data/mock/staff"
import { isStaffRole, ROLE_LABELS } from "@/lib/permissions"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

function withLabel(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName ?? row.full_name ?? "",
    role: row.role,
    isActive: row.isActive ?? row.is_active ?? true,
    roleLabel: ROLE_LABELS[row.role] ?? row.role,
  }
}

export async function getProfile(staffId) {
  if (!isSupabaseConfigured) {
    const row = loadMockStaff().find((staff) => staff.id === staffId)
    return row ? withLabel(publicStaff(row)) : null
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", staffId)
    .maybeSingle()

  if (error) throw error
  return data ? withLabel(data) : null
}

export async function ensurePlannerProfile({ id, email, fullName }) {
  const existing = await getProfile(id)
  if (existing) return existing
  if (!isSupabaseConfigured) return null

  const { error } = await supabase.from("profiles").insert({
    id,
    email,
    full_name: fullName || "",
    role: "planner",
  })

  if (error && error.code !== "23505") throw error
  return getProfile(id)
}

export async function listStaff() {
  if (!isSupabaseConfigured) {
    return loadMockStaff().map((row) => withLabel(publicStaff(row)))
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("is_active", true)
    .order("email")

  if (error) throw error
  return (data ?? []).map(withLabel)
}

export async function updateStaffRole(staffId, role) {
  if (!isStaffRole(role)) {
    return { ok: false, error: "Role must be Admin or Planner." }
  }

  const staff = await listStaff()
  const target = staff.find((row) => row.id === staffId)
  if (!target) return { ok: false, error: "Staff Member not found." }

  if (target.role === "admin" && role === "planner") {
    const adminCount = staff.filter((row) => row.role === "admin").length
    if (adminCount <= 1) {
      return {
        ok: false,
        error: "Cannot demote the last Admin. Recover via seed or dashboard SQL.",
      }
    }
  }

  if (!isSupabaseConfigured) {
    const list = loadMockStaff()
    const row = list.find((staffRow) => staffRow.id === staffId)
    if (!row) return { ok: false, error: "Staff Member not found." }
    row.role = role
    saveMockStaff(list)
    return { ok: true, staff: withLabel(publicStaff(row)) }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", staffId)

  if (error) return { ok: false, error: error.message }
  const updated = await getProfile(staffId)
  return { ok: true, staff: updated }
}
