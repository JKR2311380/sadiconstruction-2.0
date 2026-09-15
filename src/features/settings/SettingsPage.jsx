import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { can } from "@/lib/permissions"
import { ROLE_LABELS } from "@/lib/permissions"
import { useSessionStore } from "@/store/session"
import { useWorkspaceStore } from "@/store/workspace"

export function SettingsPage() {
  const staff = useSessionStore((state) => state.staff)
  const { theme, setTheme } = useTheme()
  const resetDemo = useWorkspaceStore((state) => state.resetDemo)
  const setDarkMode = useWorkspaceStore((state) => state.setDarkMode)
  const requests = useWorkspaceStore((state) => state.accessRequests)
  const reviewAccessRequest = useWorkspaceStore((state) => state.reviewAccessRequest)
  const pending = requests.filter((row) => row.status === "pending")

  return (
    <div className="overflow-auto p-[22px]">
      <h1 className="font-heading text-2xl font-normal">Settings</h1>
      <p className="mb-[18px] text-xs text-muted-foreground">Preferences and Admin queue</p>

      <div className="flex max-w-xl flex-col gap-3">
        <label className="flex cursor-pointer items-center justify-between border border-border bg-card px-4 py-3.5">
          <span>
            <strong>Dark mode</strong>
            <br />
            <span className="text-xs text-muted-foreground">Same semantic tokens, charcoal shell stays dark</span>
          </span>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => {
              setTheme(checked ? "dark" : "light")
              setDarkMode(checked)
            }}
          />
        </label>

        <div className="border border-border bg-card px-4 py-3.5">
          <h2 className="mb-2 text-sm font-semibold">Schedule defaults</h2>
          <p className="text-sm text-muted-foreground">
            Project Calendar: Mon–Sat / Sunday off · starter PH holidays · Retained Logic only · nested summaries under BOQ phases allowed.
          </p>
        </div>

        <div className="border border-border bg-card px-4 py-3.5">
          <h2 className="mb-2 text-sm font-semibold">Demo workspace</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Restore Clearwater seed and wipe local edits. Signed-in Staff Member is unchanged.
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-none"
            onClick={() => {
              resetDemo()
              toast.success("Demo data restored")
            }}
          >
            Reset demo data
          </Button>
        </div>
      </div>

      {can(staff.role, "approveAccess") ? (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold">Access Requests</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            In-app queue only (v1). Approving records the decision; this prototype does not mint a real Auth user.
          </p>
          <Table className="border border-border bg-card text-[13px]">
            <TableHeader>
              <TableRow className="bg-[#ECEEF0] hover:bg-[#ECEEF0]">
                <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Name</TableHead>
                <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Email</TableHead>
                <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Note</TableHead>
                <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.fullName}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{row.companyNote || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-none capitalize">
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.status === "pending" ? (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="rounded-none"
                          onClick={() => {
                            reviewAccessRequest(row.id, "approved", staff.id)
                            toast.success("Request approved")
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-none"
                          onClick={() => {
                            reviewAccessRequest(row.id, "rejected", staff.id)
                            toast.message("Request rejected")
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pending.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">No pending Access Requests.</p>
          ) : null}
        </section>
      ) : (
        <p className="mt-6 text-xs text-muted-foreground">
          Signed in as {ROLE_LABELS[staff.role]}. Access Request review is Admin-only.
        </p>
      )}
    </div>
  )
}
