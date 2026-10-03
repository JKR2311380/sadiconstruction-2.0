import { useMemo, useState } from "react"
import { toast } from "sonner"
import { AlertCircleIcon, DownloadIcon, PrinterIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { recalculate } from "@/features/scheduling/engine"
import { can } from "@/lib/permissions"
import { useSessionStore } from "@/store/session"
import { useWorkspaceStore } from "@/store/workspace"
import { activityCode, activityLabel as labelOf } from "./ganttHelpers"
import { ActivityCards, ActivityTree } from "./ActivityTree"
import {
  computeProgress,
  makeBaseline,
  overallProgress,
  scheduleToCsv,
} from "./scheduleReport"

const COLORS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"]

export function SchedulingPanel({ projectId }) {
  const role = useSessionStore((state) => state.staff?.role)
  const demo = useSessionStore((state) => state.mode === "mock")
  const editable = can(role, "editSchedule")
  const boq = useWorkspaceStore((state) => state.boqByProject[projectId])
  const schedule = useWorkspaceStore(
    (state) => state.scheduleByProject[projectId],
  )
  const project = useWorkspaceStore((state) =>
    state.projects.find((row) => row.id === projectId),
  )
  const toggleNodeOpen = useWorkspaceStore((state) => state.toggleNodeOpen)
  const selectNode = useWorkspaceStore((state) => state.selectNode)
  const setDuration = useWorkspaceStore((state) => state.setDuration)
  const setProgress = useWorkspaceStore((state) => state.setProgress)
  const setBaseline = useWorkspaceStore((state) => state.setBaseline)
  const addScheduleNode = useWorkspaceStore((state) => state.addScheduleNode)
  const addDependency = useWorkspaceStore((state) => state.addDependency)
  const removeDependency = useWorkspaceStore((state) => state.removeDependency)
  const clearDependencies = useWorkspaceStore(
    (state) => state.clearDependencies,
  )
  const simulateCycle = useWorkspaceStore((state) => state.simulateCycle)
  const restoreClearwaterNetwork = useWorkspaceStore(
    (state) => state.restoreClearwaterNetwork,
  )
  const [criticalOnly, setCriticalOnly] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [addMode, setAddMode] = useState("leaf")
  const [addParent, setAddParent] = useState("")
  const [addName, setAddName] = useState("")
  const [addDur, setAddDur] = useState("5")
  const [predOpen, setPredOpen] = useState(false)
  const [predTarget, setPredTarget] = useState(null)
  const [predId, setPredId] = useState("")
  const [predType, setPredType] = useState("FS")
  const [predLag, setPredLag] = useState("0")
  const [predError, setPredError] = useState("")
  const [predSaving, setPredSaving] = useState(false)
  const result = useMemo(
    () =>
      schedule
        ? recalculate({
            nodes: schedule.nodes,
            dependencies: schedule.dependencies,
            calendar: schedule.calendar,
          })
        : null,
    [schedule],
  )

  if (!schedule)
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No schedule yet</EmptyTitle>
          <EmptyDescription>
            Load an approved BOQ to establish project phases.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  const roots = schedule.nodes.filter((node) => node.kind === "phase_root")
  const byId = new Map(schedule.nodes.map((node) => [node.id, node]))
  const nodes = schedule.nodes.map((node) => {
    let root = node
    while (root.parentId && byId.has(root.parentId))
      root = byId.get(root.parentId)
    return {
      ...node,
      phase:
        COLORS[
          Math.max(
            0,
            roots.findIndex((row) => row.id === root.id),
          ) % COLORS.length
        ],
    }
  })
  const progress = computeProgress(nodes)
  const overall = overallProgress(nodes)
  const baseline = schedule.baseline ?? null
  const metrics = result?.ok ? result.metrics : {}
  const cycle = result && !result.ok
  const daysPerWeek = Math.max(
    1,
    Object.values(schedule.calendar.workingWeek).filter(Boolean).length,
  )
  const workingDays = schedule.calendar.workingWeek.sat ? "Mon-Sat" : "Mon-Fri"
  const holidayCount = schedule.calendar.exceptions.filter(
    (row) => row.type === "holiday",
  ).length
  const leaves = nodes.filter((node) => node.kind === "leaf" && !node.isLoe)
  const parents = nodes.filter(
    (node) => node.kind === "phase_root" || node.kind === "summary",
  )
  const incoming = schedule.dependencies.filter(
    (dep) => dep.successorId === predTarget,
  )
  function isVisible(node) {
    const parent = byId.get(node.parentId)
    return !parent || (parent.open !== false && isVisible(parent))
  }
  function hasCritical(node) {
    return (
      Boolean(metrics[node.id]?.isCritical) ||
      nodes.some((row) => row.parentId === node.id && hasCritical(row))
    )
  }
  const visible = nodes.filter(
    (node) =>
      isVisible(node) &&
      (!criticalOnly ||
        (cycle ? node.kind === "phase_root" : hasCritical(node))),
  )
  function openAdd(mode) {
    setAddMode(mode)
    setAddName("")
    setAddDur("5")
    setAddParent(parents[0]?.id || "")
    setAddOpen(true)
  }
  function openPred(id) {
    setPredTarget(id)
    setPredId(leaves.find((node) => node.id !== id)?.id || "")
    setPredType("FS")
    setPredLag("0")
    setPredError("")
    setPredOpen(true)
  }
  function revealNode(id) {
    setCriticalOnly(false)
    let parent = byId.get(id)?.parentId
    while (parent) {
      const row = byId.get(parent)
      if (row?.open === false) toggleNodeOpen(projectId, parent)
      parent = row?.parentId
    }
    selectNode(projectId, id)
    if (editable && byId.get(id)?.kind === "leaf") openPred(id)
  }
  function exportCsv() {
    const csv = scheduleToCsv({
      nodes,
      dependencies: schedule.dependencies,
      metrics,
      baseline,
      calendar: schedule.calendar,
      startDate: project?.startDate,
    })
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = `${project?.code || "schedule"}-schedule.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
  const activityProps = {
    nodes: visible,
    allNodes: nodes,
    dependencies: schedule.dependencies,
    metrics,
    progress,
    baseline,
    selectedId: schedule.selectedId,
    cycle: Boolean(cycle),
    editable,
    onSelect: (id) => selectNode(projectId, id),
    onToggle: (id) => toggleNodeOpen(projectId, id),
    onDuration: (id, value) => setDuration(projectId, id, value),
    onProgress: (id, value) => setProgress(projectId, id, value),
    onEditPred: openPred,
    daysPerWeek,
    projectDurationDays: result?.ok ? result.projectDurationDays : 0,
    startDate: project?.startDate,
    calendar: schedule.calendar,
  }
  async function changeLink(action) {
    if (predSaving) return
    setPredSaving(true)
    setPredError("")
    try {
      await action()
    } catch (error) {
      setPredError(
        error.message || "Could not save predecessor changes. Try again.",
      )
    } finally {
      setPredSaving(false)
    }
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">Retained Logic</strong> /{" "}
            {workingDays} / {holidayCount} holidays
          </span>
          <span
            className="inline-flex flex-wrap gap-x-3 gap-y-1"
            aria-label="Phase legend"
          >
            {roots.map((root, i) => (
              <span key={root.id} className="inline-flex items-center gap-1.5">
                <i
                  className="size-2.5"
                  style={{
                    background: `var(--phase-${COLORS[i % COLORS.length]})`,
                  }}
                />
                {root.name}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <i className="size-2.5 border-2 border-destructive" />
              Critical
            </span>
            {baseline ? (
              <span className="inline-flex items-center gap-1.5">
                <i className="h-1 w-3 bg-foreground/35" />
                Baseline
              </span>
            ) : null}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={criticalOnly ? "secondary" : "ghost"}
            aria-pressed={criticalOnly}
            onClick={() => setCriticalOnly((value) => !value)}
          >
            Critical only
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={Boolean(cycle)}
            onClick={exportCsv}
          >
            <DownloadIcon />
            Export CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={() => window.print()}>
            <PrinterIcon />
            Print
          </Button>
          {editable ? (
            <>
              {demo ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => simulateCycle(projectId)}
                >
                  Simulate cycle
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                disabled={Boolean(cycle) || !leaves.length}
                onClick={() => {
                  setBaseline(
                    projectId,
                    makeBaseline(metrics, result.projectDurationDays),
                  )
                  toast.success(
                    baseline ? "Baseline replaced" : "Baseline saved",
                  )
                }}
              >
                {baseline ? "Re-baseline" : "Set baseline"}
              </Button>
              {baseline ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBaseline(projectId, null)}
                >
                  Clear baseline
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                disabled={!parents.length}
                onClick={() => openAdd("summary")}
              >
                + Nested summary
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!parents.length}
                onClick={() => openAdd("leaf")}
              >
                + Activity
              </Button>
            </>
          ) : null}
        </div>
      </div>
      {cycle ? (
        <Alert variant="destructive" className="my-3">
          <AlertCircleIcon />
          <AlertTitle>Dependency cycle</AlertTitle>
          <AlertDescription>
            <span>
              A dependency cycle prevents calculation. Select an activity to
              edit its predecessors.
            </span>
            <span className="flex flex-wrap gap-2">
              {result.error.nodeIds.map((id) => (
                <Button
                  key={id}
                  variant="outline"
                  size="sm"
                  onClick={() => revealNode(id)}
                >
                  {labelOf(byId.get(id))}
                </Button>
              ))}
            </span>
            {editable && demo ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => restoreClearwaterNetwork(projectId)}
              >
                Fix network
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
      {!boq?.phases?.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No BOQ phases</EmptyTitle>
            <EmptyDescription>
              Load an approved BOQ before adding schedule activities.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <ActivityTree {...activityProps} />
          <ActivityCards {...activityProps} />
          <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border bg-card px-4 py-3 text-sm text-muted-foreground tabular-nums">
            {cycle ? (
              <span>Resolve the cycle to recalculate.</span>
            ) : (
              <>
                <span>
                  Duration{" "}
                  <b className="text-foreground">
                    {result.projectDurationDays} working days
                  </b>
                </span>
                <span>
                  Complete <b className="text-foreground">{overall}%</b>
                </span>
                {baseline ? (
                  <span>
                    Finish vs baseline{" "}
                    <b className="text-foreground">
                      {formatVariance(
                        result.projectDurationDays -
                          baseline.projectDurationDays,
                      )}
                    </b>
                  </span>
                ) : null}
                <span>
                  Longest path{" "}
                  <b className="text-foreground">
                    {result.criticalIds
                      .map(
                        (id) =>
                          activityCode(byId.get(id)) || labelOf(byId.get(id)),
                      )
                      .join(" / ") || "None"}
                  </b>
                </span>
              </>
            )}
            {demo ? (
              <span className="ml-auto">Demo / synthetic project data</span>
            ) : null}
          </footer>
        </>
      )}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {addMode === "summary" ? "Add nested summary" : "Add activity"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              addScheduleNode(projectId, {
                parentId: addParent,
                kind: addMode,
                name: addName.trim(),
                durationDays: Number(addDur),
              })
              setAddOpen(false)
              toast.success("Activity added")
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel>Under</FieldLabel>
                <Select value={addParent} onValueChange={setAddParent}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {parents.map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {labelOf(node)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="add-name">Name</FieldLabel>
                <Input
                  id="add-name"
                  required
                  value={addName}
                  onChange={(event) => setAddName(event.target.value)}
                />
              </Field>
              {addMode === "leaf" ? (
                <Field>
                  <FieldLabel htmlFor="add-dur">
                    Duration (working days)
                  </FieldLabel>
                  <Input
                    id="add-dur"
                    required
                    type="number"
                    min="0"
                    value={addDur}
                    onChange={(event) => setAddDur(event.target.value)}
                  />
                </Field>
              ) : null}
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!addParent || !addName.trim()}>
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={predOpen}
        onOpenChange={(open) => {
          if (!predSaving) setPredOpen(open)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit predecessors</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Links into {labelOf(byId.get(predTarget))}
          </p>
          <div
            className="flex max-h-48 flex-col gap-2 overflow-y-auto"
            aria-label="Current predecessor links"
          >
            {incoming.length ? (
              incoming.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-2 text-sm"
                >
                  <span>
                    {labelOf(byId.get(dep.predecessorId))} / {dep.type} /{" "}
                    {dep.lagDays > 0 ? "+" : ""}
                    {dep.lagDays || 0}d
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={predSaving}
                    aria-label={`Remove predecessor ${labelOf(byId.get(dep.predecessorId))}`}
                    onClick={() =>
                      changeLink(() => removeDependency(projectId, dep.id))
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No predecessor links yet.
              </p>
            )}
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel>Predecessor</FieldLabel>
              <Select value={predId} onValueChange={setPredId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Leaf activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {leaves
                      .filter((node) => node.id !== predTarget)
                      .map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {labelOf(node)}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <Select value={predType} onValueChange={setPredType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {["FS", "SS", "FF", "SF"].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="pred-lag">Lag (working days)</FieldLabel>
              <Input
                id="pred-lag"
                type="number"
                step="1"
                value={predLag}
                onChange={(event) => setPredLag(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Positive values delay the link; negative values allow overlap.
              </p>
            </Field>
          </FieldGroup>
          {predError ? (
            <p role="alert" className="text-sm text-destructive">
              {predError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              variant="destructive"
              className="mr-auto"
              disabled={predSaving || !incoming.length}
              onClick={() =>
                changeLink(() => clearDependencies(projectId, predTarget))
              }
            >
              Clear all
            </Button>
            <Button
              variant="outline"
              disabled={predSaving}
              onClick={() => setPredOpen(false)}
            >
              Done
            </Button>
            <Button
              disabled={
                predSaving ||
                !predId ||
                !predLag.trim() ||
                !Number.isFinite(Number(predLag)) ||
                incoming.some(
                  (dep) =>
                    dep.predecessorId === predId && dep.type === predType,
                )
              }
              onClick={() =>
                changeLink(() =>
                  addDependency(projectId, {
                    predecessorId: predId,
                    successorId: predTarget,
                    type: predType,
                    lagDays: Number(predLag),
                  }),
                )
              }
            >
              {predSaving ? "Saving..." : "Add link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatVariance(days) {
  return days === 0
    ? "on baseline"
    : `${days > 0 ? "+" : ""}${days} working days`
}
