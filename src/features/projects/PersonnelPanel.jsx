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
import { can } from "@/lib/permissions"
import { useSessionStore } from "@/store/session"
import { useWorkspaceStore } from "@/store/workspace"

export function PersonnelPanel({ projectId }) {
  const role = useSessionStore((state) => state.staff?.role)
  const rows = useWorkspaceStore((state) => state.personnelByProject[projectId] || [])
  const addPersonnel = useWorkspaceStore((state) => state.addPersonnel)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState("")

  function handleAdd(event) {
    event.preventDefault()
    addPersonnel(projectId, { name, title, startDate })
    toast.success("Personnel added")
    setOpen(false)
    setName("")
    setTitle("")
    setStartDate("")
  }

  return (
    <div className="flex flex-col gap-3">
      {can(role, "createProject") ? (
        <div className="flex justify-end">
          <Button type="button" variant="secondary" className="rounded-none" onClick={() => setOpen(true)}>
            Add person
          </Button>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <Empty className="rounded-none border border-dashed border-border">
          <EmptyHeader>
            <EmptyTitle>No key personnel yet</EmptyTitle>
            <EmptyDescription>Assign Staff Members or site roles to this Project.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table className="border border-border bg-card text-[13px]">
          <TableHeader>
            <TableRow className="bg-[#ECEEF0] hover:bg-[#ECEEF0]">
              <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Name</TableHead>
              <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Role on project</TableHead>
              <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Start</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.startDate || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add key personnel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="per-name">Name</FieldLabel>
                <Input id="per-name" value={name} onChange={(event) => setName(event.target.value)} required className="rounded-none" />
              </Field>
              <Field>
                <FieldLabel htmlFor="per-title">Title on this Project</FieldLabel>
                <Input id="per-title" value={title} onChange={(event) => setTitle(event.target.value)} required className="rounded-none" />
              </Field>
              <Field>
                <FieldLabel htmlFor="per-start">Start date</FieldLabel>
                <Input id="per-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-none" />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-none" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="secondary" className="rounded-none">
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
