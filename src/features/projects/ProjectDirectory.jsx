import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
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
import { formatPhpCompact } from "@/lib/money"
import { useSessionStore } from "@/store/session"
import { projectExpenditure, useWorkspaceStore } from "@/store/workspace"
import { StageBadge } from "@/shared/StageBadge"

const STAGE_OPTIONS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "delayed", label: "Delayed" },
  { id: "planning", label: "Planning" },
  { id: "on_hold", label: "On Hold" },
  { id: "completed", label: "Completed" },
]

export function ProjectDirectory() {
  const navigate = useNavigate()
  const role = useSessionStore((state) => state.staff?.role)
  const projects = useWorkspaceStore((state) => state.projects)
  const boqByProject = useWorkspaceStore((state) => state.boqByProject)
  const createProject = useWorkspaceStore((state) => state.createProject)
  const [stage, setStage] = useState("all")
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [client, setClient] = useState("")

  const live = useMemo(
    () => projects.filter((project) => !project.deletedAt),
    [projects],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return live.filter((project) => {
      if (stage !== "all" && project.stage !== stage) return false
      if (!q) return true
      return `${project.name} ${project.code} ${project.client}`.toLowerCase().includes(q)
    })
  }, [live, query, stage])

  const totalSpend = live.reduce(
    (sum, project) => sum + projectExpenditure(project, boqByProject[project.id]),
    0,
  )

  function handleCreate(event) {
    event.preventDefault()
    const project = createProject({ name, client })
    toast.success(`Created ${project.code}`)
    setOpen(false)
    setName("")
    setClient("")
    navigate(`/projects/${project.id}/overview`)
  }

  return (
    <div className="overflow-auto p-[22px]">
      <h1 className="font-heading text-2xl font-normal">Projects</h1>
      <p className="mb-[18px] text-xs text-muted-foreground">
        Directory · {formatPhpCompact(totalSpend)} expenditure across {live.length} jobs
      </p>

      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        {STAGE_OPTIONS.map((option) => (
          <Button
            key={option.id}
            type="button"
            size="sm"
            variant={stage === option.id ? "secondary" : "outline"}
            className="rounded-none"
            onClick={() => setStage(option.id)}
          >
            {option.label}
          </Button>
        ))}
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search projects…"
          className="ml-auto min-w-[200px] max-w-xs rounded-none"
        />
        {can(role, "createProject") ? (
          <Button type="button" variant="secondary" className="rounded-none" onClick={() => setOpen(true)}>
            Add Project
          </Button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <Empty className="rounded-none border border-dashed border-border">
          <EmptyHeader>
            <EmptyTitle>No projects match</EmptyTitle>
            <EmptyDescription>Clear the stage filter or search, or add a Project if your role allows it.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table className="border border-border bg-card text-[13px] tabular-nums">
          <TableHeader>
            <TableRow className="bg-[#ECEEF0] hover:bg-[#ECEEF0]">
              <TableHead className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">Project</TableHead>
              <TableHead className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">ID</TableHead>
              <TableHead className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">Stage</TableHead>
              <TableHead className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">Priority</TableHead>
              <TableHead className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">Progress</TableHead>
              <TableHead className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">Expenditure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((project) => {
              const spend = projectExpenditure(project, boqByProject[project.id])
              const priority = project.priority === 1 ? "High" : project.priority === 3 ? "Low" : "Medium"
              return (
                <TableRow
                  key={project.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}/overview`)}
                >
                  <TableCell>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-[11px] text-muted-foreground">{project.client}</div>
                  </TableCell>
                  <TableCell>{project.code}</TableCell>
                  <TableCell>
                    <StageBadge stage={project.stage} />
                  </TableCell>
                  <TableCell>{priority}</TableCell>
                  <TableCell>{project.progressPct}%</TableCell>
                  <TableCell>
                    {formatPhpCompact(spend)}
                    {project.budget ? (
                      <span className="text-muted-foreground"> / {formatPhpCompact(project.budget)}</span>
                    ) : null}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="proj-name">Name</FieldLabel>
                <Input
                  id="proj-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="rounded-none"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="proj-client">Client / owner</FieldLabel>
                <Input
                  id="proj-client"
                  value={client}
                  onChange={(event) => setClient(event.target.value)}
                  className="rounded-none"
                />
              </Field>
            </FieldGroup>
            <p className="text-xs text-muted-foreground">
              Project Code is assigned as PRJ-YYYY-NNN on save. Stage starts as Planning.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-none" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="secondary" className="rounded-none">
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
