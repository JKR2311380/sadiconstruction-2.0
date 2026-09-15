import { formatPhp } from "@/lib/money"
import { boqGrandTotal, projectExpenditure, useWorkspaceStore } from "@/store/workspace"

export function OverviewPanel({ project }) {
  const boq = useWorkspaceStore((state) => state.boqByProject[project.id])
  const personnel = useWorkspaceStore((state) => state.personnelByProject[project.id] || [])
  const spend = projectExpenditure(project, boq)
  const boqTotal = boqGrandTotal(boq)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="border border-border bg-card px-4 py-3.5">
          <div className="mb-1.5 text-[11px] text-muted-foreground">Budget</div>
          <div className="font-heading text-[22px]">{project.budget ? formatPhp(project.budget) : "—"}</div>
        </div>
        <div className="border border-border bg-card px-4 py-3.5">
          <div className="mb-1.5 text-[11px] text-muted-foreground">Expenditure</div>
          <div className="font-heading text-[22px]">{formatPhp(spend)}</div>
        </div>
        <div className="border border-border bg-card px-4 py-3.5">
          <div className="mb-1.5 text-[11px] text-muted-foreground">Personnel</div>
          <div className="font-heading text-[22px]">{personnel.length}</div>
        </div>
        <div className="border border-border bg-card px-4 py-3.5">
          <div className="mb-1.5 text-[11px] text-muted-foreground">Completion</div>
          <div className="font-heading text-[22px]">{project.progressPct}%</div>
        </div>
      </div>
      <div className="border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Overview</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {project.site ? `${project.site}. ` : ""}
          {boq
            ? `Approved BOQ totals ${formatPhp(boqTotal)}. Expenditure ${project.expenditureOverride != null ? "uses a manual override" : "is derived from BOQ lines"}.`
            : "No approved BOQ yet — Scheduling cannot seed Phase Roots until Admin loads one."}
        </p>
      </div>
    </div>
  )
}
