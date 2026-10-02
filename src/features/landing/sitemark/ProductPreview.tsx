import { useMemo } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { recalculate } from "@/features/scheduling/engine"
import type { EngineDependency, EngineNode } from "@/features/scheduling/engine/types"
import { SectionHead } from "./SectionHead"
import "./productpreview.css"

/** Synthetic demo network. Phase roots stand in for locked BOQ phases. */
interface Row {
  id: string
  code: string
  name: string
  kind: "phase_root" | "leaf"
  parentId: string | null
  phase: "a" | "b" | "c"
  duration: number
}

const ROWS: Row[] = [
  { id: "P1", code: "1", name: "Preliminaries", kind: "phase_root", parentId: null, phase: "a", duration: 0 },
  { id: "L1", code: "1.1", name: "Mobilise site", kind: "leaf", parentId: "P1", phase: "a", duration: 5 },
  { id: "L2", code: "1.2", name: "Site survey", kind: "leaf", parentId: "P1", phase: "a", duration: 3 },
  { id: "P2", code: "2", name: "Site works", kind: "phase_root", parentId: null, phase: "b", duration: 0 },
  { id: "L3", code: "2.1", name: "Excavate", kind: "leaf", parentId: "P2", phase: "b", duration: 10 },
  { id: "L4", code: "2.2", name: "Foundations", kind: "leaf", parentId: "P2", phase: "b", duration: 12 },
  { id: "P3", code: "3", name: "Structure", kind: "phase_root", parentId: null, phase: "c", duration: 0 },
  { id: "L5", code: "3.1", name: "Frame L1–L4", kind: "leaf", parentId: "P3", phase: "c", duration: 18 },
  { id: "L6", code: "3.2", name: "Envelope", kind: "leaf", parentId: "P3", phase: "c", duration: 14 },
  { id: "L7", code: "3.3", name: "Services rough-in", kind: "leaf", parentId: "P3", phase: "c", duration: 12 },
  { id: "P4", code: "4", name: "Finishes", kind: "phase_root", parentId: null, phase: "a", duration: 0 },
  { id: "L8", code: "4.1", name: "Fit-out", kind: "leaf", parentId: "P4", phase: "a", duration: 16 },
  { id: "L9", code: "4.2", name: "Testing", kind: "leaf", parentId: "P4", phase: "a", duration: 5 },
  { id: "L10", code: "4.3", name: "Handover", kind: "leaf", parentId: "P4", phase: "a", duration: 2 },
]

const DEPS: EngineDependency[] = [
  { predecessorId: "L1", successorId: "L2", type: "SS", lagDays: 1 },
  { predecessorId: "L1", successorId: "L3", type: "FS", lagDays: 0 },
  { predecessorId: "L3", successorId: "L4", type: "FS", lagDays: 0 },
  { predecessorId: "L4", successorId: "L5", type: "FS", lagDays: 0 },
  { predecessorId: "L5", successorId: "L6", type: "SS", lagDays: 6 },
  { predecessorId: "L5", successorId: "L7", type: "FS", lagDays: 0 },
  { predecessorId: "L6", successorId: "L8", type: "FS", lagDays: 0 },
  { predecessorId: "L7", successorId: "L8", type: "FS", lagDays: 0 },
  { predecessorId: "L8", successorId: "L9", type: "FS", lagDays: 0 },
  { predecessorId: "L9", successorId: "L10", type: "FS", lagDays: 0 },
]

const STEPS = [
  {
    title: "Load the approved BOQ",
    body: "An Admin or Planner uploads the bill as CSV. A bad file is rejected whole; nothing is half-written.",
  },
  {
    title: "Phases lock as WBS roots",
    body: "Each BOQ phase becomes a locked root. Nest summaries and activities beneath it; the bill stays the source.",
  },
  {
    title: "Link work, read the Longest Path",
    body: "Add FS, SS, FF and SF links with lag. Float and the critical path recompute on every edit.",
  },
]

function codeOf(id: string) {
  return ROWS.find((row) => row.id === id)?.code ?? id
}

export function ProductPreview() {
  const result = useMemo(() => {
    const nodes: EngineNode[] = ROWS.map((row) => ({
      id: row.id,
      parentId: row.parentId,
      kind: row.kind,
      durationDays: row.duration,
      isLoe: false,
    }))
    const next = recalculate({
      nodes,
      dependencies: DEPS,
      calendar: {
        workingWeek: { sun: false, mon: true, tue: true, wed: true, thu: true, fri: true, sat: false },
        exceptions: [],
      },
    })
    if (!next.ok) throw new Error("Preview network must stay acyclic")
    return next
  }, [])

  const span = Math.max(result.projectDurationDays, 1)
  const weeks = Math.ceil(span / 5)
  const critical = new Set(result.criticalIds)
  const path = result.criticalIds.map(codeOf).join(" → ")

  return (
    <section className="sm-section sm-preview" aria-labelledby="sm-preview-title">
      <SectionHead id="sm-preview-title" title="The schedule, as it computes.">
        A read-only slice of the Scheduling tab. Every figure below comes from the same engine the product runs.
      </SectionHead>

      <figure className="sm-preview__frame">
        <div
          className="sm-preview__scroll"
          tabIndex={0}
          role="region"
          aria-label="Sample schedule: activity table and Gantt chart"
        >
          <table className="sm-preview__table">
            <caption className="sm-preview__sr">
              Sample schedule with four BOQ phases and ten activities. Critical activities are marked.
            </caption>
            <thead>
              <tr>
                <th scope="col">WBS / Name</th>
                <th scope="col">Dur</th>
                <th scope="col">Pred</th>
                <th scope="col">Float</th>
                <th scope="col" className="sm-preview__chart-head">
                  <div
                    className="sm-preview__weeks"
                    style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
                    aria-hidden
                  >
                    {Array.from({ length: weeks }, (_, i) => (
                      <span key={i}>W{i + 1}</span>
                    ))}
                  </div>
                  <span className="sm-preview__sr">Gantt</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const m = result.metrics[row.id]
                const isRoot = row.kind === "phase_root"
                const isCritical = critical.has(row.id)
                const preds = DEPS.filter((d) => d.successorId === row.id)
                  .map((d) => `${codeOf(d.predecessorId)} ${d.type}${d.lagDays ? `+${d.lagDays}` : ""}`)
                  .join(", ")
                const left = (m.es / span) * 100
                const width = Math.max(((m.ef - m.es) / span) * 100, 0.8)
                return (
                  <tr key={row.id} data-root={isRoot || undefined} data-critical={isCritical || undefined}>
                    <th scope="row" className="sm-preview__name">
                      <i style={{ background: `var(--phase-${row.phase})` }} aria-hidden />
                      <span className="sm-preview__code">{row.code}</span>
                      {row.name}
                      {isRoot && <span className="sm-preview__lock">BOQ</span>}
                    </th>
                    <td>{isRoot ? "–" : row.duration}</td>
                    <td>{isRoot ? "–" : preds || "–"}</td>
                    <td>
                      {isRoot || m.totalFloat == null ? (
                        "–"
                      ) : isCritical ? (
                        <b className="sm-preview__crit">0 · crit</b>
                      ) : (
                        m.totalFloat
                      )}
                    </td>
                    <td className="sm-preview__chart">
                      <div
                        className="sm-preview__bar"
                        data-root={isRoot || undefined}
                        data-critical={isCritical || undefined}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          background: isCritical ? undefined : `var(--phase-${row.phase})`,
                        }}
                        role="img"
                        aria-label={`${row.name}: working day ${m.es} to ${m.ef}${isCritical ? ", critical" : ""}`}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <figcaption className="sm-preview__foot">
          <span>
            Longest Path <b>{path}</b>
          </span>
          <span>
            <b>{result.projectDurationDays} working days</b> · Mon–Sat · Retained Logic
          </span>
          <span className="sm-preview__note">Synthetic data.</span>
        </figcaption>
      </figure>

      <ol className="sm-preview__steps">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <span className="sm-preview__n" aria-hidden>
              {i + 1}
            </span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="sm-preview__cta">
        <p>Open the workspace to schedule against your own bill.</p>
        <Button asChild size="lg" className="rounded-md shadow-none">
          <Link to="/login" className="group">
            Sign in to open the workspace{" "}
            <ArrowRight
              size={16}
              strokeWidth={2}
              aria-hidden
              className="transition-transform duration-220 group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
        </Button>
      </div>
    </section>
  )
}
