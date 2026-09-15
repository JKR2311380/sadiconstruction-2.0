import { cn } from "@/lib/utils"

export function GanttChart({
  rows,
  metrics,
  selectedId,
  projectDurationDays,
  cycle,
  onSelect,
}) {
  const weeks = 12
  const span = Math.max(projectDurationDays, 1)

  return (
    <section className="overflow-auto bg-card">
      <div
        className="sticky top-0 z-2 grid border-b border-border bg-[#ECEEF0] text-center text-[10px] font-bold tracking-wide text-muted-foreground uppercase"
        style={{ gridTemplateColumns: `repeat(${weeks}, minmax(44px, 1fr))` }}
      >
        {Array.from({ length: weeks }, (_, i) => (
          <span key={i} className="border-r border-border px-1 py-2">
            W{i + 1}
            {i === weeks - 1 ? "+" : ""}
          </span>
        ))}
      </div>
      {rows.map((node) => {
        const m = metrics[node.id]
        const critical = Boolean(m?.isCritical) && !cycle
        let bar = null
        if (m && !cycle && span > 0) {
          const left = (m.es / span) * 100
          const width = Math.max(((m.ef - m.es) / span) * 100, node.kind === "leaf" ? 0.8 : 0.4)
          bar = (
            <div
              className={cn(
                "absolute top-2.5 h-4 border border-black/12",
                node.kind !== "leaf" && "top-3.5 h-2 border-0 opacity-30",
                node.isLoe && "top-3.5 h-2 opacity-55 [background:repeating-linear-gradient(-45deg,var(--phase-a),var(--phase-a)_4px,#5A7388_4px,#5A7388_8px)]",
                critical && "border-destructive shadow-[inset_0_0_0_2px_var(--color-destructive)]",
              )}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: node.isLoe ? undefined : `var(--phase-${node.phase || "a"})`,
              }}
              title={`${node.name}: ${m.es}–${m.ef}`}
            />
          )
        }
        return (
          <div
            key={node.id}
            className={cn(
              "relative h-9 border-b border-border",
              selectedId === node.id && "bg-accent",
            )}
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, transparent 0, transparent calc(100% / 12 - 1px), var(--border) calc(100% / 12 - 1px), var(--border) calc(100% / 12))",
            }}
            onClick={() => onSelect(node.id)}
          >
            {bar}
          </div>
        )
      })}
    </section>
  )
}
