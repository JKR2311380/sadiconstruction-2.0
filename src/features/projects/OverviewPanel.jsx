import { formatPhp } from "@/lib/money"
import { boqGrandTotal, projectExpenditure, useWorkspaceStore } from "@/store/workspace"

const EMPTY_PERSONNEL = []

export function OverviewPanel({ project }) {
  const boq = useWorkspaceStore((state) => state.boqByProject[project.id])
  const personnel = useWorkspaceStore((state) => state.personnelByProject[project.id] ?? EMPTY_PERSONNEL)
  const spend = projectExpenditure(project, boq)
  const boqTotal = boqGrandTotal(boq)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Budget", project.budget ? formatPhp(project.budget) : "—"],
          ["Expenditure", formatPhp(spend)],
          ["Personnel", String(personnel.length)],
          ["Completion", `${project.progressPct}%`],
        ].map(([label, value]) => (
          <div key={label} className="neu-out rounded-2xl px-4 py-3.5">
            <div className="mb-1.5 text-[11px] text-muted-foreground">{label}</div>
            <div className="font-heading text-[22px]">{value}</div>
          </div>
        ))}
      </div>
      <div className="neu-out rounded-2xl p-4">
        <h2 className="mb-2 text-sm font-semibold">Overview</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {project.site ? `${project.site}. ` : ""}
          {boq
            ? `Approved BOQ totals ${formatPhp(boqTotal)}. Expenditure ${project.expenditureOverride != null ? "uses a manual override" : "is derived from BOQ lines"}.`
            : "No approved BOQ yet — Scheduling cannot seed Phase Roots until a Staff Member loads one."}
        </p>
      </div>
    </div>
  )
}
