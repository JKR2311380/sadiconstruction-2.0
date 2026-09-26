import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
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
import { cn } from "@/lib/utils"
import { formatPhpCompact } from "@/lib/money"
import { useSessionStore } from "@/store/session"
import { projectExpenditure, useWorkspaceStore } from "@/store/workspace"
import { StageBadge, STAGE_META, StatusDot } from "@/shared/StageBadge"

const STAGE_OPTIONS = [
  { id: "all", label: "All" },
  { id: "active", label: STAGE_META.active.label },
  { id: "delayed", label: STAGE_META.delayed.label },
  { id: "planning", label: STAGE_META.planning.label },
  { id: "on_hold", label: STAGE_META.on_hold.label },
  { id: "completed", label: STAGE_META.completed.label },
]

export function ProjectDirectory() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const role = useSessionStore((state) => state.staff?.role)
  const projects = useWorkspaceStore((state) => state.projects)
  const boqByProject = useWorkspaceStore((state) => state.boqByProject)
  const createProject = useWorkspaceStore((state) => state.createProject)
  const [stage, setStage] = useState("all")
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [client, setClient] = useState("")

  useEffect(() => {
    if (params.get("new") === "1") {
      setOpen(true)
      const next = new URLSearchParams(params)
      next.delete("new")
      setParams(next, { replace: true })
    }
  }, [params, setParams])

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

  async function handleCreate(event) {
    event.preventDefault()
    const project = await createProject({ name, client })
    toast.success(`Created ${project.code}`)
    setOpen(false)
    setName("")
    setClient("")
    navigate(`/projects/${project.id}/overview`)
  }

  return (
    <div className="py-6">
      <h1 className="font-heading text-2xl font-normal">Projects</h1>
      <p className="mb-6 text-xs text-muted-foreground">
        Directory · {formatPhpCompact(totalSpend)} expenditure across {live.length} jobs
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="neu-in flex flex-wrap items-center gap-1 rounded-2xl p-1">
          {STAGE_OPTIONS.map((option) => (
            <Button
              key={option.id}
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                stage === option.id && "neu-selected",
                stage === option.id && option.id === "all" && "text-foreground",
              )}
              style={
                stage === option.id && option.id !== "all"
                  ? { color: `var(--status-${STAGE_META[option.id].token})` }
                  : undefined
              }
              aria-pressed={stage === option.id}
              onClick={() => setStage(option.id)}
            >
              {option.id !== "all" ? <StatusDot stage={option.id} /> : null}
              {option.label}
            </Button>
          ))}
        </div>
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search projects…"
          className="ml-auto min-w-[200px] max-w-xs"
        />
        {can(role, "createProject") ? (
          <Button type="button" onClick={() => setOpen(true)}>
            Add Project
          </Button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No projects match</EmptyTitle>
            <EmptyDescription>Clear the stage filter or search, or add a Project if your role allows it.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table className="text-[13px] tabular-nums">
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Expenditure</TableHead>
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
        <DialogContent className="sm:max-w-md">
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
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="proj-client">Client / owner</FieldLabel>
                <Input
                  id="proj-client"
                  value={client}
                  onChange={(event) => setClient(event.target.value)}
                />
              </Field>
            </FieldGroup>
            <p className="text-xs text-muted-foreground">
              Project Code is assigned as PRJ-YYYY-NNN on save. Stage starts as Planning.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
