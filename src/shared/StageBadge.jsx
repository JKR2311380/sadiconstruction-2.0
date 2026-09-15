import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STAGE_CLASS = {
  planning: "rounded-none border-border text-muted-foreground",
  active: "rounded-none border-primary bg-accent text-primary",
  delayed: "rounded-none border-[#C9A227] bg-[#FFF8E1] text-[#8A6D00]",
  on_hold: "rounded-none",
  completed: "rounded-none border-[#2A6B5A] bg-[#E8F5F0] text-[#2A6B5A]",
}

const LABELS = {
  planning: "Planning",
  active: "Active",
  delayed: "Delayed",
  on_hold: "On Hold",
  completed: "Completed",
}

export function StageBadge({ stage }) {
  return (
    <Badge variant="outline" className={cn("uppercase tracking-wide text-[10px] font-bold", STAGE_CLASS[stage])}>
      {LABELS[stage] ?? stage}
    </Badge>
  )
}
