import { cn } from "@/lib/utils"

export const STAGE_META = {
  planning: {
    label: "Planning",
    token: "planning",
  },
  active: {
    label: "Active",
    token: "active",
  },
  delayed: {
    label: "Delayed",
    token: "delayed",
  },
  on_hold: {
    label: "On Hold",
    token: "on-hold",
  },
  completed: {
    label: "Completed",
    token: "completed",
  },
}

export function stageToken(stage) {
  return STAGE_META[stage]?.token ?? "planning"
}

export function StatusDot({ stage, className }) {
  const token = stageToken(stage)
  return (
    <span
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ background: `var(--status-${token})` }}
      aria-hidden="true"
    />
  )
}

export function StageBadge({ stage }) {
  const meta = STAGE_META[stage]
  const token = meta?.token ?? "planning"
  const label = meta?.label ?? stage

  return (
    <span
      className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold tracking-wide uppercase"
      style={{
        color: `var(--status-${token})`,
        background: `var(--status-${token}-wash)`,
        boxShadow: "var(--shadow-neu-in)",
      }}
    >
      <StatusDot stage={stage} className="size-2" />
      {label}
    </span>
  )
}
