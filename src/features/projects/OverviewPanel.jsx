import { useMemo } from "react"
import { Link } from "react-router-dom"
import { formatPhp } from "@/lib/money"
import {
  boqGrandTotal,
  projectExpenditure,
  useWorkspaceStore,
} from "@/store/workspace"
import { recalculate } from "@/features/scheduling/engine"
import { overallProgress } from "@/features/scheduling/scheduleReport"
import { activityLabel, scheduleDate } from "@/features/scheduling/ganttHelpers"

const EMPTY_PERSONNEL = []

export function OverviewPanel({ project }) {
  const boq = useWorkspaceStore((state) => state.boqByProject[project.id])
  const schedule = useWorkspaceStore(
    (state) => state.scheduleByProject[project.id],
  )
  const personnel = useWorkspaceStore(
    (state) => state.personnelByProject[project.id] ?? EMPTY_PERSONNEL,
  )
  const result = useMemo(
    () =>
      schedule
        ? recalculate({
            nodes: schedule.nodes,
            dependencies: schedule.dependencies,
            calendar: schedule.calendar,
          })
        : null,
    [schedule],
  )
  const leaves =
    schedule?.nodes.filter((node) => node.kind === "leaf" && !node.isLoe) || []
  const hasActivities = leaves.length > 0
  const completion = hasActivities ? overallProgress(schedule.nodes) : null
  const finish =
    result?.ok && hasActivities
      ? scheduleDate(
          project.startDate,
          Math.max(result.projectDurationDays - 1, 0),
          schedule.calendar,
        )
      : null
  const finishLabel = finish
    ? new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${finish}T00:00:00Z`))
    : result && !result.ok
      ? "Resolve cycle"
      : !hasActivities
        ? "No activities"
        : "Set start date"
  const spend = projectExpenditure(project, boq)
  const boqTotal = boqGrandTotal(boq)
  const budgetGap =
    project.budget != null && boq ? project.budget - boqTotal : null
  const critical = result?.ok
    ? leaves
        .filter(
          (node) =>
            result.metrics[node.id]?.isCritical &&
            (node.progressPct || 0) < 100,
        )
        .sort((a, b) => result.metrics[a.id].es - result.metrics[b.id].es)
        .slice(0, 3)
    : []
  const base = `/projects/${project.id}`
  const actions = []
  if (!boq)
    actions.push([
      "Load an approved BOQ to establish project phases",
      `${base}/boq`,
    ])
  if (!hasActivities)
    actions.push(["Add activities and predecessor links", `${base}/scheduling`])
  if (result && !result.ok)
    actions.push([
      "Resolve the dependency cycle to calculate finish dates",
      `${base}/scheduling`,
    ])
  if (!project.startDate)
    actions.push(["Set the project start date in project details", "/projects"])
  if (hasActivities && !schedule?.baseline && result?.ok)
    actions.push([
      "Capture a baseline before tracking schedule changes",
      `${base}/scheduling`,
    ])
  if (!personnel.length)
    actions.push(["Assign key project personnel", `${base}/personnel`])
  if (budgetGap != null && budgetGap < 0)
    actions.push(["Review the BOQ exceeding the project budget", `${base}/boq`])
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Critical path finish", finishLabel],
          [
            "Schedule complete",
            completion == null ? "No activities" : `${completion}%`,
          ],
          [
            "Budget",
            project.budget != null ? formatPhp(project.budget) : "Not set",
          ],
          ["Approved BOQ", boq ? formatPhp(boqTotal) : "Not loaded"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm"
          >
            <div className="mb-1.5 text-sm text-muted-foreground">{label}</div>
            <div className="font-heading text-xl font-medium tabular-nums">
              {value}
            </div>
          </div>
        ))}
      </div>
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Budget versus BOQ</h2>
        <p className="text-sm text-muted-foreground">
          {budgetGap == null
            ? "Load a BOQ and set a budget to compare costs."
            : budgetGap < 0
              ? `${formatPhp(Math.abs(budgetGap))} over budget.`
              : `${formatPhp(budgetGap)} remaining against the approved BOQ.`}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Expenditure: {formatPhp(spend)} /{" "}
          {project.expenditureOverride != null
            ? "Manual override"
            : "Derived from BOQ lines"}{" "}
          / {personnel.length} personnel
        </p>
        {project.site ? (
          <p className="mt-2 text-sm text-muted-foreground">{project.site}</p>
        ) : null}
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Next actions</h2>
          {actions.length ? (
            <ul className="divide-y divide-border">
              {actions.map(([label, href]) => (
                <li key={label} className="py-3 first:pt-0">
                  <Link
                    className="text-sm text-primary underline-offset-4 hover:underline"
                    to={href}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Project setup is complete. Review activity progress in Scheduling.
            </p>
          )}
        </section>
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Upcoming critical activities</h2>
          {critical.length ? (
            <ul className="divide-y divide-border">
              {critical.map((node) => (
                <li
                  key={node.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0"
                >
                  <Link
                    to={`${base}/scheduling`}
                    onClick={() => {
                      const store = useWorkspaceStore.getState()
                      let parent = node.parentId
                      while (parent) {
                        const row = schedule.nodes.find(
                          (item) => item.id === parent,
                        )
                        if (row?.open === false)
                          store.toggleNodeOpen(project.id, parent)
                        parent = row?.parentId
                      }
                      store.selectNode(project.id, node.id)
                    }}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {activityLabel(node)}
                  </Link>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {node.progressPct || 0}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {result && !result.ok
                ? "Resolve the cycle to identify critical activities."
                : hasActivities
                  ? "No incomplete critical activities."
                  : "Add activities to calculate the critical path."}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
