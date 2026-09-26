import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  getSession,
  isSupabaseConfigured,
  onAuthChange,
  signIn as authSignIn,
  signOut as authSignOut,
  signUp as authSignUp,
} from "@/features/auth/session"
import { isStaffRole } from "@/lib/permissions"

let authUnsubscribe = null
let bootPromise = null

function normalizeStaff(staff) {
  if (!staff || !isStaffRole(staff.role)) return null
  return staff
}

export const useSessionStore = create(
  persist(
    (set, get) => ({
      staff: null,
      status: "loading",
      mode: isSupabaseConfigured ? "supabase" : "mock",

      async hydrate() {
        if (bootPromise) return bootPromise
        bootPromise = (async () => {
          if (authUnsubscribe) {
            authUnsubscribe()
            authUnsubscribe = null
          }

          if (isSupabaseConfigured) {
            try {
              const staff = normalizeStaff(await getSession())
              set({ staff, status: "ready", mode: "supabase" })
            } catch (error) {
              console.error("Session hydrate failed", error)
              set({ staff: null, status: "ready", mode: "supabase" })
            }
            authUnsubscribe = onAuthChange((staff) => {
              set({ staff: normalizeStaff(staff), status: "ready" })
            })
            return
          }

          const restored = normalizeStaff(get().staff)
          set({ staff: restored, status: "ready", mode: "mock" })
        })()
        return bootPromise
      },

      async signIn(email, password) {
        const result = await authSignIn(email, password)
        if (!result.ok) return result
        set({ staff: result.staff, status: "ready" })
        return result
      },

      async signUp({ email, password, fullName }) {
        const result = await authSignUp({ email, password, fullName })
        if (!result.ok) return result
        set({ staff: result.staff, status: "ready" })
        return result
      },

      async signOut() {
        await authSignOut()
        set({ staff: null, status: "ready" })
      },

      replaceStaff(staff) {
        set({ staff: normalizeStaff(staff) })
      },

      role() {
        return get().staff?.role ?? null
      },
    }),
    {
      name: "sadicon-session",
      partialize: (state) => (isSupabaseConfigured ? {} : { staff: state.staff }),
    },
  ),
)
