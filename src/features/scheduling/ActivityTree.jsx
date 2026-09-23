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
    <section className="overflow-auto neu-in rounded-2xl lg:rounded-none lg:rounded-l-2xl">
      <table className="w-full border-collapse text-sm tabular-nums">
        <thead>
          <tr>
            {["WBS / Name", "Dur", "Pred", "ES", "EF", "TF", "Crit"].map((label) => (
              <th
                key={label}
                className="sticky top-0 z-2 bg-muted/40 px-2 py-2.5 text-left text-[10px] font-medium tracking-wider text-muted-foreground uppercase"
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
            const predLabel =
              preds
                .map((dep) => {
                  const pred = allNodes.find((row) => row.id === dep.predecessorId)
                  const code = pred?.wbsCode || pred?.id
                  return `${code} ${dep.type}`
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
                  selectedId === node.id && "bg-background shadow-neu-in",
                )}
                onClick={(event) => {
                  if (event.target.closest("button, input")) return
                  onSelect(node.id)
                }}
              >
                <td className="h-11 px-2" style={{ paddingLeft: 8 + depth * 18 }}>
                  <div className="flex min-w-[220px] items-center gap-2">
                    {hasKids ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className={cn("text-muted-foreground", node.open === false && "-rotate-90")}
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
                      <span className="neu-in rounded-md px-1.5 py-0.5 text-[11px] font-bold tracking-widest text-muted-foreground">
                        LOCKED
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="h-11 px-2">
                  {node.kind === "leaf" && !node.isLoe && editable ? (
                    <Input
                    className="h-9 w-[64px] border-transparent bg-transparent px-1.5 tabular-nums shadow-none hover:shadow-neu-in"
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
                <td className="h-11 px-2">
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
                  {critical ? (
                    <span className="text-xs font-bold tracking-wide text-destructive">YES</span>
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
