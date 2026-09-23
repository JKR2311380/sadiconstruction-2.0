import { loadMockStaff, publicStaff, saveMockStaff } from "@/data/mock/staff"
import { ensurePlannerProfile, getProfile } from "@/data/profiles"
import { isStaffRole, ROLE_LABELS } from "@/lib/permissions"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export { isSupabaseConfigured }

const MIN_PASSWORD_LENGTH = 6

export function mapStaff(profile) {
  if (!profile || !isStaffRole(profile.role)) return null
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName ?? profile.full_name ?? "",
    role: profile.role,
    roleLabel: ROLE_LABELS[profile.role],
  }
}

function validateCredentials(email, password, { requireName, fullName } = {}) {
  const trimmedEmail = email.trim().toLowerCase()
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    return { ok: false, error: "Enter a valid email." }
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
  }
  if (requireName && !fullName?.trim()) {
    return { ok: false, error: "Enter a full name." }
  }
  return { ok: true, email: trimmedEmail }
}

async function staffFromUser(user) {
  if (!user) return null
  const fullName = user.user_metadata?.full_name || ""
  const profile =
    (await getProfile(user.id)) ||
    (await ensurePlannerProfile({ id: user.id, email: user.email, fullName }))
  return mapStaff(profile)
}

export async function getSession() {
  if (!isSupabaseConfigured) return null
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error) throw error
  return staffFromUser(session?.user ?? null)
}

export async function signIn(email, password) {
  const valid = validateCredentials(email, password)
  if (!valid.ok) return valid

  if (!isSupabaseConfigured) {
    const match = loadMockStaff().find(
      (row) => row.email.toLowerCase() === valid.email && row.password === password,
    )
    if (!match) return { ok: false, error: "Email or password is not recognized." }
    if (match.isActive === false) return { ok: false, error: "This Staff Member is inactive." }
    return { ok: true, staff: mapStaff(publicStaff(match)) }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: valid.email,
    password,
  })
  if (error) return { ok: false, error: error.message }
  const staff = await staffFromUser(data.user)
  if (!staff) return { ok: false, error: "No Staff Member profile for this session." }
  return { ok: true, staff }
}

export async function signUp({ email, password, fullName }) {
  const valid = validateCredentials(email, password, { requireName: true, fullName })
  if (!valid.ok) return valid
  const name = fullName.trim()

  if (!isSupabaseConfigured) {
    const list = loadMockStaff()
    if (list.some((row) => row.email.toLowerCase() === valid.email)) {
      return { ok: false, error: "An account with this email already exists." }
    }
    const row = {
      id: crypto.randomUUID(),
      email: valid.email,
      password,
      fullName: name,
      role: "planner",
      isActive: true,
    }
    saveMockStaff([row, ...list])
    return { ok: true, staff: mapStaff(publicStaff(row)) }
  }

  const { data, error } = await supabase.auth.signUp({
    email: valid.email,
    password,
    options: { data: { full_name: name } },
  })
  if (error) return { ok: false, error: error.message }
  if (!data.user) {
    return { ok: false, error: "Sign-up did not return a Staff Member. Confirm Auth email confirmation is off." }
  }
  if (!data.session) {
    return {
      ok: false,
      error: "No session after Sign-up. Turn off Auth → confirmations (working-app contract).",
    }
  }
  const staff = await staffFromUser(data.user)
  if (!staff) return { ok: false, error: "Profile was not created for this Staff Member." }
  return { ok: true, staff }
}

export async function signOut() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut()
  }
}

export function onAuthChange(callback) {
  if (!isSupabaseConfigured) return () => {}
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "TOKEN_REFRESHED") return
    const staff = await staffFromUser(session?.user ?? null)
    callback(staff)
  })
  return () => subscription.unsubscribe()
}
