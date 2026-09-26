import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { FaqAccordion } from "@/components/FaqAccordion"
import { NeuSkeleton } from "@/components/NeuSkeleton"
import { can, ROLE_LABELS } from "@/lib/permissions"
import { listStaff, updateStaffRole } from "@/data/profiles"
import { useSessionStore } from "@/store/session"
import { useWorkspaceStore } from "@/store/workspace"

const FAQ = [
  {
    q: "Who can change Staff Member roles?",
    a: "Only Admin. The last Admin cannot be demoted from Settings.",
  },
  {
    q: "Why can’t I edit the BOQ in Scheduling?",
    a: "The approved BOQ owns Phase Roots. Replace the BOQ from the BOQ tab; the network seeds from that.",
  },
  {
    q: "How does dark mode work?",
    a: "It swaps the clay highlight and shadow pair used by Soft UI controls. Light source stays top-left in both themes.",
  },
  {
    q: "What does Reset demo data do?",
    a: "It restores the Clearwater seed and wipes local edits. Signed-in Staff Member is unchanged. It no-ops when Supabase owns domain data.",
  },
]

export function SettingsPage() {
  const staff = useSessionStore((state) => state.staff)
  const replaceStaff = useSessionStore((state) => state.replaceStaff)
  const { theme, setTheme } = useTheme()
  const resetDemo = useWorkspaceStore((state) => state.resetDemo)
  const setDarkMode = useWorkspaceStore((state) => state.setDarkMode)
  const [rows, setRows] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const canChangeRole = can(staff.role, "changeRole")

  useEffect(() => {
    if (window.location.hash === "#faq") {
      document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  useEffect(() => {
    if (!canChangeRole) return undefined
    let cancelled = false
    listStaff()
      .then((list) => {
        if (!cancelled) setRows(list)
      })
      .catch((error) => {
        if (!cancelled) {
          setRows([])
          toast.error(error.message || "Could not load Staff Members.")
        }
      })
    return () => {
      cancelled = true
    }
  }, [canChangeRole])

  async function handleRoleChange(staffId, role) {
    const result = await updateStaffRole(staffId, role)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setRows((current) =>
      (current ?? []).map((row) =>
        row.id === staffId ? { ...row, role, roleLabel: ROLE_LABELS[role] } : row,
      ),
    )
    if (staffId === staff.id) {
      replaceStaff({ ...staff, role, roleLabel: ROLE_LABELS[role] })
    }
    toast.success(`Role set to ${ROLE_LABELS[role]}`)
  }

  return (
    <div className="py-6">
      <h1 className="font-heading text-2xl font-normal">Settings</h1>
      <p className="mb-6 text-xs text-muted-foreground">Dark mode, schedule defaults, and Admin Staff Roles</p>

      <div className="flex max-w-xl flex-col gap-3">
        <label className="neu-out flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3.5">
          <span>
            <strong>Dark mode</strong>
            <br />
            <span className="text-xs text-muted-foreground">
              Swaps Soft UI highlight and shadow profiles. Light source stays top-left.
            </span>
          </span>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => {
              setTheme(checked ? "dark" : "light")
              setDarkMode(checked)
            }}
          />
        </label>

        <div className="neu-out rounded-2xl px-4 py-3.5">
          <h2 className="mb-2 text-sm font-semibold">Schedule defaults</h2>
          <p className="text-sm text-muted-foreground">
            Project Calendar: Mon–Sat / Sunday off · starter PH holidays · Retained Logic only · nested summaries under BOQ phases allowed.
          </p>
        </div>

        <div className="neu-out rounded-2xl px-4 py-3.5">
          <h2 className="mb-2 text-sm font-semibold">Demo workspace</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Restore Clearwater seed and wipe local edits. Signed-in Staff Member is unchanged. No-ops when Supabase owns domain data.
          </p>
          <Button type="button" variant="outline" onClick={() => setConfirmReset(true)}>
            Reset demo data
          </Button>
        </div>
      </div>

      {canChangeRole ? (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold">Staff Roles</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Admin may change a Staff Member between Admin and Planner. The last Admin cannot be demoted here.
          </p>
          {rows == null ? (
            <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading Staff Members">
              <NeuSkeleton className="h-12" />
              <NeuSkeleton className="h-12" />
              <NeuSkeleton className="h-12" />
            </div>
          ) : (
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.fullName || "—"}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>
                      <select
                        className="rounded-xl bg-background px-2 py-1.5 text-sm shadow-neu-in"
                        value={row.role}
                        aria-label={`Role for ${row.email}`}
                        onChange={(event) => {
                          void handleRoleChange(row.id, event.target.value)
                        }}
                      >
                        <option value="planner">Planner</option>
                        <option value="admin">Admin</option>
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {rows && rows.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">No Staff Members found.</p>
          ) : null}
        </section>
      ) : (
        <p className="mt-6 text-xs text-muted-foreground">
          Signed in as {ROLE_LABELS[staff.role]}. Changing Staff Member Roles is Admin-only.
        </p>
      )}

      <section id="faq" className="mt-10 max-w-xl scroll-mt-24">
        <h2 className="mb-3 text-sm font-semibold">FAQ</h2>
        <FaqAccordion items={FAQ} />
      </section>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset demo data?"
        description="This restores the Clearwater seed and wipes local edits. Your signed-in Staff Member is unchanged."
        confirmLabel="Reset demo data"
        onConfirm={() => {
          resetDemo()
          toast.success("Demo data restored")
        }}
      />
    </div>
  )
}
