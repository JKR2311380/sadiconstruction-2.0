import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { can } from "@/lib/permissions"
import { useSessionStore } from "@/store/session"
import { useWorkspaceStore } from "@/store/workspace"

const EMPTY_ROWS = []

export function PersonnelPanel({ projectId }) {
  const role = useSessionStore((state) => state.staff?.role)
  const rows = useWorkspaceStore((state) => state.personnelByProject[projectId] ?? EMPTY_ROWS)
  const addPersonnel = useWorkspaceStore((state) => state.addPersonnel)
  const removePersonnel = useWorkspaceStore((state) => state.removePersonnel)
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [pendingRemove, setPendingRemove] = useState(null)

  function resetForm() {
    setName("")
    setTitle("")
    setStartDate("")
    setEndDate("")
  }

  async function handleAdd(event) {
    event.preventDefault()
    setPending(true)
    try {
      await addPersonnel(projectId, { name, title, startDate, endDate })
      toast.success("Personnel added")
      setOpen(false)
      resetForm()
    } catch (error) {
      toast.error(error.message || "Could not add this person.")
    } finally {
      setPending(false)
    }
  }

  async function handleRemove(row) {
    try {
      await removePersonnel(projectId, row.id)
      toast.success("Personnel removed")
    } catch (error) {
      toast.error(error.message || "Could not remove this person.")
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {can(role, "editPersonnel") ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setOpen(true)}>
            Add person
          </Button>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No key personnel yet</EmptyTitle>
            <EmptyDescription>
              Free-text roster of people on this Project. They do not have to be Staff Members.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role on project</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              {can(role, "editPersonnel") ? <TableHead className="w-24" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.startDate || "—"}</TableCell>
                <TableCell>{row.endDate || "—"}</TableCell>
                {can(role, "editPersonnel") ? (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setPendingRemove(row)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add key personnel</DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => void handleAdd(event)} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="per-name">Name</FieldLabel>
                <Input id="per-name" value={name} onChange={(event) => setName(event.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="per-title">Title on this Project</FieldLabel>
                <Input id="per-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="per-start">Start date</FieldLabel>
                <Input id="per-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="per-end">End date</FieldLabel>
                <Input id="per-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Adding…" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        onOpenChange={(next) => {
          if (!next) setPendingRemove(null)
        }}
        title="Remove this person?"
        description={
          pendingRemove
            ? `${pendingRemove.name} will be removed from this Project roster. They are not a Staff Member account.`
            : ""
        }
        confirmLabel="Remove"
        onConfirm={() => {
          if (pendingRemove) void handleRemove(pendingRemove)
          setPendingRemove(null)
        }}
      />
    </div>
  )
}
