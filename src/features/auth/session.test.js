import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabaseClient", () => ({ isSupabaseConfigured: false, supabase: null }))

const { mapStaff } = await import("./session")

describe("mapStaff", () => {
  const profile = { id: "u1", email: "p@sadicon.local", fullName: "Priya Tan", role: "planner", isActive: true }

  it("maps an active Staff Member", () => {
    expect(mapStaff(profile)).toMatchObject({ id: "u1", role: "planner", roleLabel: "Planner" })
  })

  it("treats a deactivated profile as no Staff Member", () => {
    expect(mapStaff({ ...profile, isActive: false })).toBeNull()
  })

  it("rejects unknown roles and missing profiles", () => {
    expect(mapStaff({ ...profile, role: "viewer" })).toBeNull()
    expect(mapStaff(null)).toBeNull()
  })
})
