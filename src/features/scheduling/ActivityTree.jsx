import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { DependencyArrows, GanttAxis, GanttRow, TodayLine } from "./GanttChart"
import {
  activityCode,
  activityLabel,
  ganttScale,
  scheduleDate,
} from "./ganttHelpers"
import { finishVariance } from "./scheduleReport"

function Variance({ value }) {
  if (value == null) return <span className="text-muted-foreground">–</span>
  if (value === 0) return <span className="text-muted-foreground">0</span>
  return (
    <span
      className={
        value > 0
          ? "font-medium text-destructive"
          : "font-medium text-emerald-600 dark:text-emerald-400"
      }
    >
      {value > 0 ? `+${value}` : value}d
    </span>
  )
}

function depthOf(node, allNodes) {
  let depth = 0
  let cursor = node
  while (cursor?.parentId) {
    depth += 1
    cursor = allNodes.find((row) => row.id === cursor.parentId)
  }
  return depth
}

export function ActivityTree({
  nodes,
  allNodes,
  dependencies,
  metrics,
  progress,
  baseline,
  selectedId,
  cycle,
  editable,
  onSelect,
  onToggle,
  onDuration,
  onProgress,
  onEditPred,
  daysPerWeek,
  weekPx,
  projectDurationDays,
  startDate,
  calendar,
}) {
  const columns = [
    "WBS / Name",
    "Dur",
    "Pred",
    "ES",
    "EF",
    "TF",
    "%",
    ...(baseline ? ["Δ Fin"] : []),
    "Crit",
  ]
  const scale = ganttScale(projectDurationDays, baseline, daysPerWeek, weekPx)
  const widths = [280, 70, 170, 50, 50, 50, 70, ...(baseline ? [70] : []), 60]
  const treeWidth = widths.reduce((a, b) => a + b, 0)
  const ganttProps = {
    metrics,
    progress,
    baseline,
    scale,
    cycle,
    startDate,
    calendar,
  }
  return (
    <section
      className="schedule-scroll hidden min-h-0 flex-1 overflow-auto border border-border bg-card lg:block"
      aria-label="Activity schedule and Gantt chart"
    >
      <div className="relative" style={{ width: treeWidth + scale.width }}>
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm tabular-nums [&_td]:border-b [&_td]:border-border">
          <colgroup>
            {widths.map((width, i) => (
              <col key={i} style={{ width }} />
            ))}
            <col style={{ width: scale.width }} />
          </colgroup>
          <thead>
            <tr>
              {columns.map((label) => (
                <th
                  key={label}
                  className={cn(
                    "sticky top-0 z-20 h-11 bg-muted px-2 text-left text-[10px] font-medium text-muted-foreground uppercase",
                    label === columns[0] && "left-0 z-30",
                  )}
                >
                  {label}
                </th>
              ))}
              <th className="sticky top-0 z-20 bg-muted p-0">
                <GanttAxis
                  scale={scale}
                  daysPerWeek={daysPerWeek}
                  startDate={startDate}
                  calendar={calendar}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => {
              const m = metrics[node.id] || {}
              const depth = depthOf(node, allNodes)
              const hasKids = allNodes.some((row) => row.parentId === node.id)
              const preds = dependencies.filter(
                (dep) => dep.successorId === node.id,
              )
              const predLabel =
                preds
                  .map((dep) => {
                    const pred = allNodes.find(
                      (row) => row.id === dep.predecessorId,
                    )
                    const code =
                      activityCode(pred) || pred?.name || "Missing activity"
                    return `${code} ${dep.type}${dep.lagDays ? ` ${dep.lagDays > 0 ? "+" : ""}${dep.lagDays}d` : ""}`
                  })
                  .join(", ") || "–"
              const critical = Boolean(m.isCritical) && !cycle

              return (
                <tr
                  key={node.id}
                  data-selected={selectedId === node.id}
                  className={cn(
                    "cursor-pointer border-b border-border hover:bg-muted/40",
                    node.kind === "phase_root" && "bg-muted/50 font-semibold",
                    node.kind === "summary" && "font-medium",
                    critical && "bg-[var(--critical-wash)]",
                    selectedId === node.id && "bg-accent/70",
                  )}
                  onClick={(event) => {
                    if (event.target.closest("button, input")) return
                    onSelect(node.id)
                  }}
                >
                  <td
                    className={cn(
                      "sticky left-0 z-10 h-11 bg-card px-2",
                      critical && "bg-[var(--critical-wash)]",
                      selectedId === node.id && "bg-accent",
                    )}
                    style={{ paddingLeft: 8 + depth * 18 }}
                  >
                    <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                      {hasKids ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className={cn(
                            "text-muted-foreground",
                            node.open === false && "-rotate-90",
                          )}
                          aria-label={`Toggle ${node.name}`}
                          aria-expanded={node.open !== false}
                          onClick={() => onToggle(node.id)}
                        >
                          <ChevronDownIcon />
                        </Button>
                      ) : (
                        <span className="inline-block w-[18px]" />
                      )}
                      <i
                        className="size-2 shrink-0"
                        style={{
                          background: `var(--phase-${node.phase || "a"}, var(--phase-a))`,
                        }}
                      />
                      <button
                        type="button"
                        className="truncate text-left focus-visible:underline"
                        title={node.name}
                        onClick={() => onSelect(node.id)}
                      >
                        {activityLabel(node)}
                      </button>
                      {node.locked ? (
                        <span className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-bold tracking-widest text-muted-foreground">
                          LOCKED
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="h-11 px-2">
                    {node.kind === "leaf" && !node.isLoe && editable ? (
                      <Input
                        className="h-9 w-[64px] border-transparent bg-transparent px-1.5 tabular-nums shadow-none hover:border-input hover:bg-background hover:shadow-sm"
                        type="number"
                        aria-label={`${node.name} duration in working days`}
                        min="0"
                        defaultValue={node.durationDays}
                        key={`${node.id}-${node.durationDays}`}
                        onKeyDown={commitKey}
                        onBlur={(event) => {
                          const next = Math.max(
                            0,
                            Number(event.target.value) || 0,
                          )
                          if (next !== node.durationDays)
                            onDuration(node.id, next)
                        }}
                        onClick={(event) => event.stopPropagation()}
                      />
                    ) : node.isLoe ? (
                      <span className="text-muted-foreground">hammock</span>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </td>
                  <td className="h-11 overflow-hidden px-2">
                    {node.kind === "leaf" && !node.isLoe ? (
                      editable ? (
                        <button
                          type="button"
                          className="block w-full truncate border border-transparent px-1.5 py-0.5 text-left hover:border-border hover:bg-card"
                          title={`Edit predecessors: ${predLabel}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onEditPred(node.id)
                          }}
                        >
                          {predLabel}
                        </button>
                      ) : (
                        predLabel
                      )
                    ) : (
                      <span className="text-muted-foreground">
                        {node.isLoe ? "SS/FF span" : "–"}
                      </span>
                    )}
                  </td>
                  <td className="h-11 px-2">{cycle ? "–" : (m.es ?? "–")}</td>
                  <td className="h-11 px-2">{cycle ? "–" : (m.ef ?? "–")}</td>
                  <td className="h-11 px-2">
                    {cycle || m.totalFloat == null ? (
                      <span className="text-muted-foreground">–</span>
                    ) : (
                      m.totalFloat
                    )}
                  </td>
                  <td className="h-11 px-2">
                    {node.kind === "leaf" && !node.isLoe && editable ? (
                      <Input
                        className="h-9 w-[60px] border-transparent bg-transparent px-1.5 tabular-nums shadow-none hover:border-input hover:bg-background hover:shadow-sm"
                        type="number"
                        min="0"
                        max="100"
                        aria-label={`${node.name} percent complete`}
                        defaultValue={progress[node.id] ?? 0}
                        key={`${node.id}-p${progress[node.id] ?? 0}`}
                        onKeyDown={commitKey}
                        onBlur={(event) => {
                          const next = Math.min(
                            100,
                            Math.max(
                              0,
                              Math.round(Number(event.target.value) || 0),
                            ),
                          )
                          if (next !== (progress[node.id] ?? 0))
                            onProgress(node.id, next)
                        }}
                        onClick={(event) => event.stopPropagation()}
                      />
                    ) : node.isLoe ? (
                      <span className="text-muted-foreground">–</span>
                    ) : (
                      <span className="text-muted-foreground">
                        {progress[node.id] ?? 0}%
                      </span>
                    )}
                  </td>
                  {baseline ? (
                    <td className="h-11 px-2">
                      <Variance
                        value={
                          cycle || node.isLoe
                            ? null
                            : finishVariance(baseline, node.id, metrics)
                        }
                      />
                    </td>
                  ) : null}
                  <td className="h-11 px-2">
                    {critical ? (
                      <span className="text-xs font-bold tracking-wide text-destructive">
                        YES
                      </span>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </td>
                  <td className="h-11 p-0">
                    <GanttRow {...ganttProps} node={node} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <TodayLine scale={scale} left={treeWidth} startDate={startDate} calendar={calendar} />
        <DependencyArrows
          rows={nodes}
          dependencies={dependencies}
          metrics={metrics}
          scale={scale}
          cycle={cycle}
          left={treeWidth}
        />
      </div>
    </section>
  )
}

function commitKey(event) {
  if (event.key === "Enter") {
    event.preventDefault()
    event.currentTarget.blur()
  }
  if (event.key === "Escape") {
    event.currentTarget.value = event.currentTarget.defaultValue
    event.currentTarget.blur()
  }
}

export function ActivityCards({
  nodes,
  allNodes,
  metrics,
  progress,
  baseline,
  selectedId,
  cycle,
  editable,
  onSelect,
  onToggle,
  onDuration,
  onProgress,
  onEditPred,
  startDate,
  calendar,
}) {
  return (
    <section
      className="flex flex-col gap-3 p-3 lg:hidden"
      aria-label="Schedule activities"
    >
      {nodes.map((node) => {
        const m = metrics[node.id] || {}
        const leaf = node.kind === "leaf" && !node.isLoe
        const kids = allNodes.some((row) => row.parentId === node.id)
        const start =
          !cycle && m.es != null
            ? scheduleDate(startDate, m.es, calendar)
            : null
        const finish =
          !cycle && m.ef != null
            ? scheduleDate(startDate, Math.max(m.es, m.ef - 1), calendar)
            : null
        return (
          <article
            key={node.id}
            className={cn(
              "rounded-lg border border-border bg-card p-4",
              selectedId === node.id && "ring-2 ring-primary",
            )}
          >
            <div className="flex items-center gap-2">
              {kids ? (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Toggle ${node.name}`}
                  aria-expanded={node.open !== false}
                  onClick={() => onToggle(node.id)}
                >
                  <ChevronDownIcon
                    className={node.open === false ? "-rotate-90" : ""}
                  />
                </Button>
              ) : null}
              <button
                type="button"
                className="min-w-0 flex-1 text-left font-medium"
                onClick={() => onSelect(node.id)}
              >
                {activityLabel(node)}
              </button>
              {m.isCritical && !cycle ? (
                <span className="text-xs font-semibold text-destructive">
                  Critical
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <label className="flex flex-col gap-1 text-muted-foreground">
                Duration (days)
                {leaf && editable ? (
                  <Input
                    key={`${node.id}-${node.durationDays}`}
                    type="number"
                    min="0"
                    defaultValue={node.durationDays}
                    onKeyDown={commitKey}
                    onBlur={(e) => {
                      const n = Math.max(0, Number(e.target.value) || 0)
                      if (n !== node.durationDays) onDuration(node.id, n)
                    }}
                  />
                ) : (
                  <span className="text-foreground">
                    {cycle
                      ? "-"
                      : m.ef != null
                        ? m.ef - m.es
                        : node.durationDays}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1 text-muted-foreground">
                Complete (%){" "}
                {leaf && editable ? (
                  <Input
                    key={`${node.id}-${progress[node.id]}`}
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={progress[node.id] ?? 0}
                    onKeyDown={commitKey}
                    onBlur={(e) => {
                      const n = Math.min(
                        100,
                        Math.max(0, Math.round(Number(e.target.value) || 0)),
                      )
                      if (n !== progress[node.id]) onProgress(node.id, n)
                    }}
                  />
                ) : (
                  <span className="text-foreground">
                    {node.isLoe ? "-" : `${progress[node.id] ?? 0}%`}
                  </span>
                )}
              </label>
              <span>
                Start / finish {start ? "" : "(working days)"}{" "}
                <b className="block font-normal">
                  {cycle
                    ? "-"
                    : `${start || m.es || 0} / ${finish || m.ef || 0}`}
                </b>
              </span>
              <span>
                Float{" "}
                <b className="block font-normal">
                  {cycle ? "-" : `${m.totalFloat ?? "-"} days`}
                </b>
              </span>
              {baseline ? (
                <span>
                  Finish variance{" "}
                  <Variance
                    value={
                      cycle ? null : finishVariance(baseline, node.id, metrics)
                    }
                  />
                </span>
              ) : null}
            </div>
            {leaf && editable ? (
              <Button
                className="mt-3"
                variant="outline"
                size="sm"
                onClick={() => onEditPred(node.id)}
              >
                Edit predecessors
              </Button>
            ) : null}
          </article>
        )
      })}
    </section>
  )
}
