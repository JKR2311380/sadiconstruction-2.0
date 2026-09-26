import { useMemo, useState } from "react"
import { toast } from "sonner"
import { AlertCircleIcon } from "lucide-react"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { ActivityTree } from "./ActivityTree"
import { GanttChart } from "./GanttChart"

export function SchedulingPanel({ projectId }) {
  const role = useSessionStore((state) => state.staff?.role)
  const editable = can(role, "editSchedule")
  const boq = useWorkspaceStore((state) => state.boqByProject[projectId])
  const schedule = useWorkspaceStore((state) => state.scheduleByProject[projectId])
  const toggleNodeOpen = useWorkspaceStore((state) => state.toggleNodeOpen)
  const selectNode = useWorkspaceStore((state) => state.selectNode)
  const setDuration = useWorkspaceStore((state) => state.setDuration)
  const addScheduleNode = useWorkspaceStore((state) => state.addScheduleNode)
  const addDependency = useWorkspaceStore((state) => state.addDependency)
  const clearDependencies = useWorkspaceStore((state) => state.clearDependencies)
  const simulateCycle = useWorkspaceStore((state) => state.simulateCycle)
  const restoreClearwaterNetwork = useWorkspaceStore((state) => state.restoreClearwaterNetwork)

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

  const result = useMemo(() => {
    if (!schedule) return null
    return recalculate({
      nodes: schedule.nodes.map((node) => ({
        id: node.id,
        parentId: node.parentId,
        kind: node.kind,
        durationDays: node.durationDays || 0,
        isLoe: Boolean(node.isLoe),
        spanStartId: node.spanStartId,
        spanEndId: node.spanEndId,
      })),
      dependencies: schedule.dependencies,
      calendar: schedule.calendar,
    })
  }, [schedule])

  if (!schedule) {
    return (
      <div className="p-[18px_22px]">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No schedule yet</EmptyTitle>
            <EmptyDescription>Open a Project that has an approved BOQ to seed Phase Roots.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  const phases = boq?.phases || []
  const metrics = result?.ok ? result.metrics : {}
  const cycle = result && !result.ok

  function isVisible(node) {
    if (!node.parentId) return true
    const parent = schedule.nodes.find((row) => row.id === node.parentId)
    if (!parent || parent.open === false) return false
    return isVisible(parent)
  }

  const visible = schedule.nodes.filter((node) => {
    if (!isVisible(node)) return false
    if (!criticalOnly) return true
    if (cycle) return node.kind === "phase_root"
    if (node.kind === "leaf" && !node.isLoe) return Boolean(metrics[node.id]?.isCritical)
    if (node.kind === "phase_root" || node.kind === "summary") {
      const stack = [node.id]
      const ids = new Set()
      while (stack.length) {
        const id = stack.pop()
        for (const child of schedule.nodes.filter((row) => row.parentId === id)) {
          ids.add(child.id)
          stack.push(child.id)
        }
      }
      return [...ids].some((id) => metrics[id]?.isCritical)
    }
    return false
  })

  const leaves = schedule.nodes.filter((node) => node.kind === "leaf" && !node.isLoe)
  const parentOptions = schedule.nodes.filter(
    (node) => node.kind === "phase_root" || node.kind === "summary",
  )

  function openAdd(mode) {
    setAddMode(mode)
    setAddName("")
    setAddDur("5")
    setAddParent(parentOptions[0]?.id || "")
    setAddOpen(true)
  }

  function confirmAdd(event) {
    event.preventDefault()
    addScheduleNode(projectId, {
      parentId: addParent,
      kind: addMode === "summary" ? "summary" : "leaf",
      name: addName || (addMode === "summary" ? "New summary" : "New activity"),
      durationDays: Number(addDur) || 0,
    })
    setAddOpen(false)
    toast.success(addMode === "summary" ? "Nested summary added" : "Activity added")
  }

  function openPred(nodeId) {
    setPredTarget(nodeId)
    const other = leaves.find((node) => node.id !== nodeId)
    setPredId(other?.id || "")
    setPredType("FS")
    setPredOpen(true)
  }

  const workingDays = schedule.calendar.workingWeek.sat ? "Mon–Sat" : "Mon–Fri"
  const holidayCount = schedule.calendar.exceptions.filter((row) => row.type === "holiday").length

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-[22px] py-2.5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">Retained Logic</strong> · {workingDays} · {holidayCount} PH holidays
          </span>
          <span className="inline-flex gap-2.5">
            <LegendSwatch className="bg-[var(--phase-a)]" label="A" />
            <LegendSwatch className="bg-[var(--phase-b)]" label="B" />
            <LegendSwatch className="bg-[var(--phase-c)]" label="C" />
            <LegendSwatch className="bg-destructive" label="Critical" />
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={criticalOnly ? "neu-selected text-foreground" : ""}
            aria-pressed={criticalOnly}
            onClick={() => setCriticalOnly((value) => !value)}
          >
            Critical only
          </Button>
          {editable ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  simulateCycle(projectId)
                  toast.message("Simulated cycle B.2 ↔ B.3")
                }}
              >
                Simulate cycle
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => openAdd("summary")}>
                + Nested summary
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => openAdd("leaf")}>
                + Activity
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {cycle ? (
        <Alert variant="destructive" className="mx-[22px] mt-3">
          <AlertCircleIcon />
          <AlertTitle>CPM halted</AlertTitle>
          <AlertDescription>
            Cycle involving {result.error.nodeIds.join(", ")}. Edit predecessors to resume. Critical paint is off.
          </AlertDescription>
          {editable ? (
            <AlertAction>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => {
                  restoreClearwaterNetwork(projectId)
                  toast.success("Network restored")
                }}
              >
                Fix network
              </Button>
            </AlertAction>
          ) : null}
        </Alert>
      ) : null}

      {!phases.length ? (
        <div className="p-[18px_22px]">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No BOQ phases</EmptyTitle>
              <EmptyDescription>
                An approved BOQ must exist before Scheduling can seed locked Phase Roots.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <>
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(440px,48%)_1fr]">
            <ActivityTree
              nodes={visible}
              allNodes={schedule.nodes}
              dependencies={schedule.dependencies}
              metrics={metrics}
              selectedId={schedule.selectedId}
              cycle={Boolean(cycle)}
              editable={editable}
              onSelect={(id) => selectNode(projectId, id)}
              onToggle={(id) => toggleNodeOpen(projectId, id)}
              onDuration={(id, value) => {
                setDuration(projectId, id, value)
                toast.success("Duration updated · CPM recalculated")
              }}
              onEditPred={openPred}
            />
            <GanttChart
              rows={visible}
              metrics={metrics}
              selectedId={schedule.selectedId}
              projectDurationDays={result?.ok ? result.projectDurationDays : 0}
              cycle={Boolean(cycle)}
              onSelect={(id) => selectNode(projectId, id)}
            />
          </div>
          <footer className="flex flex-wrap items-center gap-4 border-t border-border bg-card px-[22px] py-3 text-sm text-muted-foreground tabular-nums">
            {cycle ? (
              <span>
                <b className="text-foreground">Invalid network</b> – fix cycle to recalculate
              </span>
            ) : (
              <>
                <span>
                  Project duration <b className="text-foreground">{result.projectDurationDays} working days</b>
                </span>
                <span>
                  Longest Path{" "}
                  <b className="text-foreground">{result.criticalIds.join(" → ") || "—"}</b>
                </span>
                <span className="ml-auto">In-browser CPM · synthetic Clearwater data</span>
              </>
            )}
          </footer>
        </>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{addMode === "summary" ? "Add nested summary" : "Add activity"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={confirmAdd} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Under</FieldLabel>
                <Select value={addParent} onValueChange={setAddParent}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {(addMode === "summary"
                        ? parentOptions.filter((node) => node.kind === "phase_root")
                        : parentOptions
                      ).map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="add-name">Name</FieldLabel>
                <Input id="add-name" value={addName} onChange={(event) => setAddName(event.target.value)} />
              </Field>
              {addMode === "leaf" ? (
                <Field>
                  <FieldLabel htmlFor="add-dur">Duration (working days)</FieldLabel>
                  <Input
                    id="add-dur"
                    type="number"
                    min="0"
                    value={addDur}
                    onChange={(event) => setAddDur(event.target.value)}
                  />
                </Field>
              ) : null}
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="secondary">
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={predOpen} onOpenChange={setPredOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit predecessors</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Links into {schedule.nodes.find((node) => node.id === predTarget)?.name}
          </p>
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
                          {node.id} – {node.name}
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
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              className="mr-auto"
              onClick={() => {
                clearDependencies(projectId, predTarget)
                setPredOpen(false)
                toast.success("Predecessors cleared")
              }}
            >
              Clear all
            </Button>
            <Button type="button" variant="outline" onClick={() => setPredOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (predId) {
                  addDependency(projectId, {
                    predecessorId: predId,
                    successorId: predTarget,
                    type: predType,
                  })
                  toast.success("Predecessor link added")
                }
                setPredOpen(false)
              }}
            >
              Add link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LegendSwatch({ className, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className={`inline-block size-2.5 ${className}`} />
      {label}
    </span>
  )
}
