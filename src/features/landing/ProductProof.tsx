import { useState } from "react"
import { BOQ_BY_PROJECT, PROJECTS } from "@/data/mock/seed"
import { formatPhp } from "@/lib/money"

const TABS = [
  { id: "directory", label: "Directory" },
  { id: "boq", label: "BOQ" },
  { id: "scheduling", label: "Scheduling" },
] as const

type TabId = (typeof TABS)[number]["id"]

const CLEARWATER = PROJECTS.find((project) => project.id === "prj-clearwater")
const BOQ = BOQ_BY_PROJECT["prj-clearwater"]

const SCHEDULE_ROWS = [
  { id: "A", name: "A – General Requirements", kind: "phase", phase: "a", locked: true, dur: "—", pred: "—", es: 0, ef: 30, tf: 0, critical: false, bar: { left: 0, width: 16 } },
  { id: "A.1", name: "A.1 Mobilization", kind: "leaf", phase: "a", locked: false, dur: "10", pred: "—", es: 0, ef: 10, tf: 0, critical: true, bar: { left: 0, width: 8 } },
  { id: "B", name: "B – Site Works & Earthworks", kind: "phase", phase: "b", locked: true, dur: "—", pred: "—", es: 10, ef: 87, tf: 0, critical: false, bar: { left: 8, width: 38 } },
  { id: "B.2", name: "B.2 Excavation Works (Bulk)", kind: "leaf", phase: "b", locked: false, dur: "45", pred: "B.1 FS", es: 22, ef: 67, tf: 0, critical: true, bar: { left: 14, width: 28 } },
  { id: "C", name: "C – Concrete Works", kind: "phase", phase: "c", locked: true, dur: "—", pred: "—", es: 87, ef: 207, tf: 0, critical: false, bar: { left: 46, width: 52 } },
  { id: "C.pkg", name: "C Concrete package", kind: "leaf", phase: "c", locked: false, dur: "120", pred: "B.4 FS", es: 87, ef: 207, tf: 0, critical: true, bar: { left: 46, width: 52 } },
] as const

function phaseTotal(phase: { lines: Array<{ amount: number }> }) {
  return phase.lines.reduce((sum, line) => sum + line.amount, 0)
}

function DirectoryView() {
  return (
    <table className="meeting-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Project</th>
          <th>Stage</th>
          <th>Progress</th>
        </tr>
      </thead>
      <tbody>
        {PROJECTS.filter((project) => !project.deletedAt).slice(0, 5).map((project) => (
          <tr key={project.id} data-active={project.id === "prj-clearwater" ? "true" : undefined}>
            <td className="meeting-mono">{project.code}</td>
            <td>
              <span className="meeting-name">{project.name}</span>
              <span className="meeting-muted">{project.client}</span>
            </td>
            <td>
              <span className={`meeting-stage meeting-stage-${project.stage.replace("_", "-")}`}>
                {project.stage === "on_hold" ? "On Hold" : project.stage[0].toUpperCase() + project.stage.slice(1)}
              </span>
            </td>
            <td className="meeting-mono">{project.progressPct}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BoqView() {
  if (!BOQ) return null
  return (
    <table className="meeting-table">
      <thead>
        <tr>
          <th>Phase</th>
          <th>From the bill</th>
          <th>Lines</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {BOQ.phases.map((phase) => (
          <tr key={phase.id} className="meeting-phase">
            <td>
              <i className={`meeting-swatch meeting-swatch-${phase.colorToken}`} aria-hidden />
              {phase.code}
              <span className="meeting-lock">Locked</span>
            </td>
            <td>{phase.name}</td>
            <td className="meeting-mono">{phase.lines.length}</td>
            <td className="meeting-mono">{formatPhp(phaseTotal(phase))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SchedulingView() {
  return (
    <div className="meeting-split">
      <table className="meeting-table meeting-tree">
        <thead>
          <tr>
            <th>WBS / Name</th>
            <th>Dur</th>
            <th>TF</th>
            <th>Crit</th>
          </tr>
        </thead>
        <tbody>
          {SCHEDULE_ROWS.map((row) => (
            <tr key={row.id} data-critical={row.critical ? "true" : undefined} data-kind={row.kind}>
              <td>
                <i className={`meeting-swatch meeting-swatch-${row.phase}`} aria-hidden />
                {row.name}
                {row.locked ? <span className="meeting-lock">Locked</span> : null}
              </td>
              <td className="meeting-mono">{row.dur}</td>
              <td className="meeting-mono">{row.tf}</td>
              <td>{row.critical ? <span className="meeting-crit">LP</span> : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="meeting-gantt" aria-hidden>
        <div className="meeting-gantt-head">
          {Array.from({ length: 12 }, (_, week) => (
            <span key={week}>W{week + 1}</span>
          ))}
        </div>
        {SCHEDULE_ROWS.map((row) => (
          <div key={row.id} className="meeting-gantt-row" data-critical={row.critical ? "true" : undefined}>
            <span
              className={`meeting-bar meeting-bar-${row.phase}`}
              data-kind={row.kind}
              data-critical={row.critical ? "true" : undefined}
              style={{ left: `${row.bar.left}%`, width: `${row.bar.width}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProductProof() {
  const [tab, setTab] = useState<TabId>("scheduling")

  return (
    <section id="proof" className="relative bg-espresso px-5 py-16 text-latte sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-[clamp(2.4rem,5vw,4.2rem)] font-extrabold leading-[0.86] tracking-[-0.035em] text-balance">
          Put the programme on the meeting screen.
        </h2>
        <p className="mt-4 max-w-[46ch] font-ui text-[1.15rem] leading-relaxed text-foam">
          Clearwater Medical Center, the same project a planner opens after Sign in: directory,
          view-only BOQ, activity tree and Gantt with Longest Path marked.
        </p>

        <div className="mt-10">
          <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Product surfaces">
            {TABS.map((item) => {
              const selected = item.id === tab
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`proof-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls={`proof-panel-${item.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(item.id)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
                    event.preventDefault()
                    const index = TABS.findIndex((entry) => entry.id === tab)
                    const next = event.key === "ArrowRight" ? (index + 1) % TABS.length : (index - 1 + TABS.length) % TABS.length
                    setTab(TABS[next].id)
                    document.getElementById(`proof-tab-${TABS[next].id}`)?.focus()
                  }}
                  className={`acoustic-focus inline-flex h-11 min-h-11 min-w-11 items-center rounded-full px-4 font-display text-[0.9rem] tracking-[0.08em] uppercase ${
                    selected
                      ? "bg-amber text-espresso shadow-glow-amber"
                      : "bg-glass-thin text-latte"
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          <div
            role="tabpanel"
            id={`proof-panel-${tab}`}
            aria-labelledby={`proof-tab-${tab}`}
            className="meeting-screen"
          >
            <div className="meeting-chrome">
              <span className="meeting-mono">{CLEARWATER?.code}</span>
              <span>{CLEARWATER?.name}</span>
              <span className="meeting-chrome-tab">
                {tab === "directory" ? "Projects" : tab === "boq" ? "Bill of Quantities" : "Scheduling"}
              </span>
            </div>
            {tab === "directory" ? <DirectoryView /> : null}
            {tab === "boq" ? <BoqView /> : null}
            {tab === "scheduling" ? <SchedulingView /> : null}
          </div>
          <p className="font-measure mt-3 text-[0.68rem] tracking-[0.04em] text-foam/70">
            PRJ-2024-008 Clearwater Medical Center is synthetic demonstration data.
          </p>
        </div>
      </div>
    </section>
  )
}
