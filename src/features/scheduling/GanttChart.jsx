import { useId } from "react"
import { cn } from "@/lib/utils"
import { ganttScale, scheduleDate } from "./ganttHelpers"

function shortDate(iso) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`))
}

export function GanttAxis({ scale, daysPerWeek, startDate, calendar }) {
  return (
    <div
      className="grid h-11 text-center text-xs font-medium text-muted-foreground"
      style={{ gridTemplateColumns: `repeat(${scale.weeks}, 1fr)` }}
    >
      {Array.from({ length: scale.weeks }, (_, i) => {
        const date = scheduleDate(startDate, i * daysPerWeek, calendar)
        return (
          <span
            key={i}
            className="flex items-center justify-center border-r border-border"
            title={date || "Set a project start date to show dates"}
          >
            {date ? shortDate(date) : `Week ${i + 1}`}
          </span>
        )
      })}
    </div>
  )
}

export function GanttRow({
  node,
  metrics,
  progress,
  baseline,
  scale,
  cycle,
  startDate,
  calendar,
}) {
  const m = metrics[node.id]
  const was = baseline?.nodes?.[node.id]
  const done = progress[node.id] ?? 0
  const isLeaf = node.kind === "leaf" && !node.isLoe
  const start = m && scheduleDate(startDate, m.es, calendar)
  const finish =
    m && scheduleDate(startDate, Math.max(m.es, m.ef - 1), calendar)
  const pct = (days) => (days / scale.totalDays) * 100
  return (
    <div
      className="relative h-[43px]"
      style={{
        backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent calc(100% / ${scale.weeks} - 1px), var(--border) calc(100% / ${scale.weeks} - 1px), var(--border) calc(100% / ${scale.weeks}))`,
      }}
    >
      {m && !cycle ? (
        <>
          <div
            role="img"
            aria-label={`${node.name}: ${start || `day ${m.es}`} to ${finish || `day ${m.ef}`}, ${done}% complete${m.isCritical ? ", critical" : ""}`}
            className={cn(
              "absolute top-2.5 h-4 overflow-hidden rounded-sm border border-foreground/20",
              !isLeaf && "top-3.5 h-2 opacity-40",
              node.isLoe && "opacity-50",
              m.isCritical && "border-destructive ring-1 ring-destructive",
            )}
            style={{
              left: `${pct(m.es)}%`,
              width: `${Math.max(pct(m.ef - m.es), 0.5)}%`,
              background: `var(--phase-${node.phase || "a"}, var(--phase-a))`,
            }}
            title={`${node.wbsCode || ""} ${node.name}: ${start || m.es} - ${finish || m.ef} / ${done}%`}
          >
            {isLeaf && done > 0 ? (
              <div
                className="absolute inset-y-0 left-0 bg-foreground/35"
                style={{ width: `${done}%` }}
              />
            ) : null}
          </div>
          {was && !node.isLoe ? (
            <div
              aria-hidden="true"
              className="absolute top-[30px] h-1 bg-foreground/35"
              style={{
                left: `${pct(was.es)}%`,
                width: `${Math.max(pct(was.ef - was.es), 0.3)}%`,
              }}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function DependencyArrows({
  rows,
  dependencies,
  metrics,
  scale,
  cycle,
  left,
}) {
  const marker = useId().replace(/:/g, "")
  if (cycle) return null
  const positions = new Map(rows.map((row, i) => [row.id, i]))
  const x = (day) => (day / scale.totalDays) * scale.width
  return (
    <svg
      aria-label="Schedule dependency links"
      className="pointer-events-none absolute top-11 overflow-visible"
      style={{ left, width: scale.width, height: rows.length * 44 }}
    >
      <defs>
        <marker
          id={marker}
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0 0 L6 3 L0 6" fill="var(--muted-foreground)" />
        </marker>
      </defs>
      {dependencies.map((dep) => {
        const a = metrics[dep.predecessorId],
          b = metrics[dep.successorId]
        const ai = positions.get(dep.predecessorId),
          bi = positions.get(dep.successorId)
        if (!a || !b || ai == null || bi == null) return null
        const fromFinish = dep.type[0] === "F",
          toFinish = dep.type[1] === "F"
        const ax = x(fromFinish ? a.ef : a.es),
          bx = x(toFinish ? b.ef : b.es)
        const ay = ai * 44 + 18,
          by = bi * 44 + 18
        const exit = ax + (fromFinish ? 8 : -8),
          entry = bx + (toFinish ? 8 : -8)
        const lane = ai < bi ? ay + 21 : ay - 21
        return (
          <path
            key={dep.id}
            d={`M ${ax} ${ay} H ${exit} V ${lane} H ${entry} V ${by} H ${bx}`}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeWidth="1"
            opacity="0.65"
            markerEnd={`url(#${marker})`}
          >
            <title>{`${rows[ai].name} -> ${rows[bi].name}: ${dep.type}, ${dep.lagDays || 0} working days lag`}</title>
          </path>
        )
      })}
    </svg>
  )
}

export function GanttChart(props) {
  const scale = ganttScale(
    props.projectDurationDays,
    props.baseline,
    props.daysPerWeek,
  )
  return (
    <section aria-label="Gantt chart" style={{ width: scale.width }}>
      <GanttAxis {...props} scale={scale} />
      {props.rows.map((node) => (
        <GanttRow key={node.id} {...props} node={node} scale={scale} />
      ))}
    </section>
  )
}
