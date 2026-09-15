import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
  selectedId,
  cycle,
  editable,
  onSelect,
  onToggle,
  onDuration,
  onEditPred,
}) {
  return (
    <section className="overflow-auto border-b border-border bg-card lg:border-r lg:border-b-0">
      <table className="w-full border-collapse text-[13px] tabular-nums">
        <thead>
          <tr>
            {["WBS / Name", "Dur", "Pred", "ES", "EF", "TF", "Crit"].map((label) => (
              <th
                key={label}
                className="sticky top-0 z-2 border-b border-border bg-[#ECEEF0] px-2 py-2 text-left text-[10px] font-medium tracking-wider text-muted-foreground uppercase"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => {
            const m = metrics[node.id] || {}
            const depth = depthOf(node, allNodes)
            const hasKids = allNodes.some((row) => row.parentId === node.id)
            const preds = dependencies.filter((dep) => dep.successorId === node.id)
            const predLabel = preds.map((dep) => `${dep.predecessorId} ${dep.type}`).join(", ") || "–"
            const critical = Boolean(m.isCritical) && !cycle

            return (
              <tr
                key={node.id}
                data-selected={selectedId === node.id}
                className={cn(
                  "cursor-pointer border-b border-border hover:bg-[#F7F8F9]",
                  node.kind === "phase_root" && "bg-muted font-semibold",
                  node.kind === "summary" && "bg-[#F7F8FA] font-medium",
                  critical && "bg-[var(--critical-wash)]",
                  selectedId === node.id && "shadow-[inset_3px_0_0_var(--color-primary)]",
                )}
                onClick={(event) => {
                  if (event.target.closest("button, input")) return
                  onSelect(node.id)
                }}
              >
                <td className="h-9 px-2" style={{ paddingLeft: 8 + depth * 18 }}>
                  <div className="flex min-w-[220px] items-center gap-2">
                    {hasKids ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className={cn("rounded-none text-muted-foreground", node.open === false && "-rotate-90")}
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
                      style={{ background: `var(--phase-${node.phase || "a"})` }}
                    />
                    <span>{node.name}</span>
                    {node.locked ? (
                      <span className="border border-[#C9CED4] px-1.5 py-px text-[9px] font-bold tracking-widest text-muted-foreground">
                        LOCKED
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="h-9 px-2">
                  {node.kind === "leaf" && !node.isLoe && editable ? (
                    <Input
                    className="h-7 w-[52px] rounded-none border-transparent bg-transparent px-1.5 tabular-nums hover:border-border hover:bg-card"
                      type="number"
                      min="0"
                      defaultValue={node.durationDays}
                      key={`${node.id}-${node.durationDays}`}
                      onBlur={(event) => {
                        const next = Math.max(0, Number(event.target.value) || 0)
                        if (next !== node.durationDays) onDuration(node.id, next)
                      }}
                      onClick={(event) => event.stopPropagation()}
                    />
                  ) : node.isLoe ? (
                    <span className="text-muted-foreground">hammock</span>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </td>
                <td className="h-9 px-2">
                  {node.kind === "leaf" && !node.isLoe ? (
                    editable ? (
                      <button
                        type="button"
                        className="border border-transparent px-1.5 py-0.5 text-left hover:border-border hover:bg-card"
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
                    <span className="text-muted-foreground">{node.isLoe ? "SS/FF span" : "–"}</span>
                  )}
                </td>
                <td className="h-9 px-2">{cycle ? "–" : (m.es ?? "–")}</td>
                <td className="h-9 px-2">{cycle ? "–" : (m.ef ?? "–")}</td>
                <td className="h-9 px-2">
                  {cycle || m.totalFloat == null ? (
                    <span className="text-muted-foreground">–</span>
                  ) : (
                    m.totalFloat
                  )}
                </td>
                <td className="h-9 px-2">
                  {critical ? (
                    <span className="text-[10px] font-bold tracking-wide text-destructive">YES</span>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
