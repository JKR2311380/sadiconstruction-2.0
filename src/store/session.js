import { create } from "zustand"
import { persist } from "zustand/middleware"
import { STAFF } from "@/data/mock/seed"
import { ROLE_LABELS } from "@/lib/permissions"

export const useSessionStore = create(
  persist(
    (set, get) => ({
      staff: null,
      signIn(email, password) {
        const match = STAFF.find(
          (row) =>
            row.email.toLowerCase() === email.trim().toLowerCase() &&
            row.password === password,
        )
        if (!match) {
          return { ok: false, error: "Email or password is not recognized." }
        }
        const staff = {
          id: match.id,
          email: match.email,
          fullName: match.fullName,
          role: match.role,
          roleLabel: ROLE_LABELS[match.role],
        }
        set({ staff })
        return { ok: true, staff }
      },
      signOut() {
        set({ staff: null })
      },
      role() {
        return get().staff?.role ?? null
      },
    }),
    { name: "sadicon-session" },
  ),
)
