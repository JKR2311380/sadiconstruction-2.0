import { cn } from "@/lib/utils"

const WEEK_PX = 64

export function GanttChart({
  rows,
  metrics,
  progress,
  baseline,
  selectedId,
  projectDurationDays,
  daysPerWeek,
  cycle,
  onSelect,
}) {
  // The time axis follows the real schedule: one column per working week, with a spare week of room.
  const baselineSpan = baseline?.projectDurationDays ?? 0
  const weeks = Math.max(Math.ceil(Math.max(projectDurationDays, baselineSpan, 1) / daysPerWeek) + 1, 8)
  const totalDays = weeks * daysPerWeek
  const pct = (days) => (days / totalDays) * 100

  return (
    <section className="overflow-auto" aria-label="Gantt chart">
      <div style={{ minWidth: weeks * WEEK_PX }}>
        <div
          className="sticky top-0 z-2 grid bg-muted/40 text-center text-[10px] font-bold tracking-wide text-muted-foreground uppercase"
          style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
        >
          {Array.from({ length: weeks }, (_, i) => (
            <span key={i} className="border-r border-border px-1 py-2.5">
              W{i + 1}
            </span>
          ))}
        </div>
        {rows.map((node) => {
          const m = metrics[node.id]
          const was = baseline?.nodes?.[node.id]
          const critical = Boolean(m?.isCritical) && !cycle
          const done = progress[node.id] ?? 0
          let bar = null
          let baselineBar = null
          if (m && !cycle) {
            const isLeaf = node.kind === "leaf" && !node.isLoe
            bar = (
              <div
                role="img"
                aria-label={`${node.name}: day ${m.es} to ${m.ef}, ${done}% complete${critical ? ", critical" : ""}`}
                className={cn(
                  "absolute top-2.5 h-4 overflow-hidden border border-black/12",
                  !isLeaf && "top-3.5 h-2 border-0 opacity-30",
                  node.isLoe &&
                    "top-3.5 h-2 opacity-55 [background:repeating-linear-gradient(-45deg,var(--phase-a),var(--phase-a)_4px,#5A7388_4px,#5A7388_8px)]",
                  critical && "border-destructive shadow-[inset_0_0_0_2px_var(--color-destructive)]",
                )}
                style={{
                  left: `${pct(m.es)}%`,
                  width: `${Math.max(pct(m.ef - m.es), isLeaf ? 0.6 : 0.3)}%`,
                  background: node.isLoe ? undefined : `var(--phase-${node.phase || "a"})`,
                }}
                title={`${node.name}: ${m.es}–${m.ef} · ${done}%`}
              >
                {isLeaf && done > 0 ? (
                  <div className="absolute inset-y-0 left-0 bg-black/35" style={{ width: `${done}%` }} />
                ) : null}
              </div>
            )
            if (was && !node.isLoe) {
              baselineBar = (
                <div
                  aria-hidden="true"
                  className="absolute top-[30px] h-1 bg-foreground/35"
                  style={{
                    left: `${pct(was.es)}%`,
                    width: `${Math.max(pct(was.ef - was.es), 0.3)}%`,
                  }}
                />
              )
            }
          }
          return (
            <div
              key={node.id}
              className={cn(
                "relative h-11 border-b border-border",
                selectedId === node.id && "bg-accent",
              )}
              style={{
                backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent calc(100% / ${weeks} - 1px), var(--border) calc(100% / ${weeks} - 1px), var(--border) calc(100% / ${weeks}))`,
              }}
              onClick={() => onSelect(node.id)}
            >
              {bar}
              {baselineBar}
            </div>
          )
        })}
      </div>
    </section>
  )
}
