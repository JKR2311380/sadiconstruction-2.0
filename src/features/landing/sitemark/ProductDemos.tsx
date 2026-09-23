import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Lock, MousePointer2 } from "lucide-react"
import { ACTIVITIES, computeNetwork } from "./network"

gsap.registerPlugin(useGSAP)

type ModuleId = "projects" | "boq" | "scheduling"

const MODULES: Array<{ id: ModuleId; name: string; line: string }> = [
  { id: "projects", name: "Projects", line: "The record: code, site, people, documents." },
  { id: "boq", name: "BOQ", line: "The approved bill, read-only. Its phases become locked WBS roots." },
  { id: "scheduling", name: "Scheduling", line: "Activities nest under those roots. The engine finds the Longest Path." },
]

const EASE = "expo.out"

interface DemoProps {
  play: boolean
  reduced: boolean
}

/** Builds a paused timeline on mount (from-states render immediately) and plays it once `play` flips. */
function useDemoTimeline(
  scope: RefObject<HTMLDivElement | null>,
  { play, reduced }: DemoProps,
  build: (tl: gsap.core.Timeline) => void,
) {
  const tl = useRef<gsap.core.Timeline | null>(null)
  useGSAP(
    () => {
      if (reduced) return
      tl.current = gsap.timeline({ paused: true, defaults: { ease: EASE } })
      build(tl.current)
    },
    { scope, dependencies: [reduced] },
  )
  useEffect(() => {
    if (play) tl.current?.play()
  }, [play])
}

const PROJECTS = [
  { code: "PRJ-2024-014", name: "Northgate Civic Hall", status: "Active" },
  { code: "PRJ-2024-008", name: "Clearwater Medical Center", status: "Active" },
  { code: "PRJ-2024-011", name: "Harbour Link Depot", status: "Tender" },
  { code: "PRJ-2023-019", name: "Riverside Primary Annex", status: "Closed" },
]

function ProjectsDemo(props: DemoProps) {
  const scope = useRef<HTMLDivElement>(null)
  const { duration } = useMemo(() => computeNetwork(), [])
  useDemoTimeline(scope, props, (tl) => {
    tl.from(".sm-demo__cursor", { x: -120, y: 120, opacity: 0, duration: 0.6 })
      .from(".sm-demo__row[data-selected]", { "--sel": 0, duration: 0.25 }, "-=0.1")
      .from(".sm-demo__detail-title", { opacity: 0, y: 8, duration: 0.3 }, "-=0.05")
      .from(".sm-demo__value", { clipPath: "inset(0 100% 0 0)", duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.15")
      .to(".sm-demo__cursor", { opacity: 0, duration: 0.3 }, "+=0.2")
  })

  return (
    <div ref={scope} className="sm-demo sm-demo--projects">
      <ul className="sm-demo__list">
        {PROJECTS.map((p) => (
          <li
            key={p.code}
            className="sm-demo__row"
            data-selected={p.code === "PRJ-2024-008" || undefined}
          >
            <span className="sm-demo__name">{p.name}</span>
            <span className="sm-demo__code">{p.code}</span>
            <span className="sm-demo__status">{p.status}</span>
            {p.code === "PRJ-2024-008" && (
              <MousePointer2 className="sm-demo__cursor" size={18} strokeWidth={1.75} aria-hidden />
            )}
          </li>
        ))}
      </ul>
      <div className="sm-demo__detail">
        <p className="sm-demo__detail-title">Clearwater Medical Center</p>
        <dl>
          {[
            ["Code", "PRJ-2024-008"],
            ["Site", "Clearwater, Block C"],
            ["Planner", "R. Santos"],
            ["BOQ", "6 phases, locked"],
            ["Schedule", `${duration} working days, computed`],
          ].map(([k, v]) => (
            <div key={k} className="sm-demo__field">
              <dt>{k}</dt>
              <dd className="sm-demo__value">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

const BOQ_PHASES = [
  { code: "1", name: "Preliminaries", items: 14 },
  { code: "2", name: "Site works", items: 38 },
  { code: "3", name: "Concrete", items: 52 },
  { code: "4", name: "Envelope", items: 41 },
  { code: "5", name: "Services", items: 67 },
  { code: "6", name: "Finishes", items: 59 },
]

function BoqDemo(props: DemoProps) {
  const scope = useRef<HTMLDivElement>(null)
  useDemoTimeline(scope, props, (tl) => {
    tl.from(".sm-demo__boq-row", { opacity: 0.3, y: -8, duration: 0.45, stagger: 0.09 })
      .from(".sm-demo__lock", { opacity: 0, scale: 1.6, duration: 0.35, stagger: 0.07 }, "-=0.2")
      .from(".sm-demo__foot", { opacity: 0, y: 6, duration: 0.3 }, "-=0.1")
  })

  return (
    <div ref={scope} className="sm-demo sm-demo--boq">
      <table className="sm-demo__table">
        <thead>
          <tr>
            <th scope="col">Code</th>
            <th scope="col">Phase</th>
            <th scope="col" className="sm-num">Items</th>
            <th scope="col">WBS root</th>
          </tr>
        </thead>
        <tbody>
          {BOQ_PHASES.map((p) => (
            <tr key={p.code} className="sm-demo__boq-row">
              <td className="sm-num">{p.code}</td>
              <td>{p.name}</td>
              <td className="sm-num">{p.items}</td>
              <td>
                <span className="sm-demo__lock">
                  <Lock size={12} strokeWidth={2.25} aria-hidden /> Locked
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="sm-demo__foot">Scheduling cannot add, rename or delete these roots.</p>
    </div>
  )
}

type TreeRow =
  | { kind: "root"; code: string; name: string; ids: string[] }
  | { kind: "leaf"; id: string }

const TREE: TreeRow[] = [
  { kind: "root", code: "3", name: "Concrete", ids: ["C", "D"] },
  { kind: "leaf", id: "C" },
  { kind: "leaf", id: "D" },
  { kind: "root", code: "4", name: "Envelope", ids: ["F"] },
  { kind: "leaf", id: "F" },
  { kind: "root", code: "5", name: "Services", ids: ["E"] },
  { kind: "leaf", id: "E" },
  { kind: "root", code: "6", name: "Finishes", ids: ["G", "I"] },
  { kind: "leaf", id: "G" },
  { kind: "leaf", id: "I" },
]

const GANTT_T0 = 15

function ganttPct(day: number, duration: number) {
  return ((day - GANTT_T0) / (duration - GANTT_T0)) * 100
}

function SchedulingDemo(props: DemoProps) {
  const scope = useRef<HTMLDivElement>(null)
  const net = useMemo(() => computeNetwork(), [])
  const byId = useMemo(() => new Map(ACTIVITIES.map((a) => [a.id, a])), [])
  const pct = (d: number) => ganttPct(d, net.duration)

  const spine = useMemo(() => {
    const crit = TREE.flatMap((row, i) =>
      row.kind === "leaf" && net.critical.has(row.id) ? [{ id: row.id, row: i }] : [],
    ).sort((a, b) => net.metrics[a.id].es - net.metrics[b.id].es)
    return crit
      .map(({ id, row }) => {
        const m = net.metrics[id]
        const y = row + 0.5
        const x0 = ganttPct(m.es, net.duration) + 0.6
        const x1 = ganttPct(m.ef, net.duration) - 0.6
        return `M${x0},${y} L${x1},${y}`
      })
      .join(" ")
  }, [net])

  useDemoTimeline(scope, props, (tl) => {
    tl.from(".sm-demo__tree-row[data-leaf] .sm-demo__tree-label", { x: -18, duration: 0.45, stagger: 0.05 })
      .from(".sm-demo__bar", { scaleX: 0, transformOrigin: "0% 50%", duration: 0.55, stagger: 0.06, ease: "power3.out" }, "-=0.2")
      .from(".sm-demo__spine", { clipPath: "inset(0 100% 0 0)", duration: 0.7, ease: "power2.inOut" }, "-=0.1")
  })

  return (
    <div ref={scope} className="sm-demo sm-demo--scheduling">
      <div className="sm-demo__tree" role="list">
        {TREE.map((row, i) => {
          if (row.kind === "root") {
            return (
              <div key={i} role="listitem" className="sm-demo__tree-row" data-root>
                <span className="sm-demo__tree-label">
                  <Lock size={11} strokeWidth={2.25} aria-hidden /> {row.code} {row.name}
                </span>
              </div>
            )
          }
          const a = byId.get(row.id)!
          return (
            <div key={i} role="listitem" className="sm-demo__tree-row" data-leaf>
              <span className="sm-demo__tree-label">
                <span className="sm-num">{a.code}</span> {a.name}
              </span>
            </div>
          )
        })}
      </div>
      <div className="sm-demo__gantt" aria-hidden>
        {TREE.map((row, i) => {
          const ids = row.kind === "root" ? row.ids : [row.id]
          const es = Math.min(...ids.map((id) => net.metrics[id].es))
          const ef = Math.max(...ids.map((id) => net.metrics[id].ef))
          const critical = row.kind === "leaf" && net.critical.has(row.id)
          return (
            <div key={i} className="sm-demo__gantt-row">
              <span
                className="sm-demo__bar"
                data-kind={row.kind === "root" ? "summary" : critical ? "critical" : "float"}
                style={{ left: `${pct(es)}%`, width: `${pct(ef) - pct(es)}%` }}
              />
            </div>
          )
        })}
        <svg className="sm-demo__spine" viewBox={`0 0 100 ${TREE.length}`} preserveAspectRatio="none">
          <path d={spine} className="sm-demo__spine-core" />
        </svg>
      </div>
    </div>
  )
}

const DEMOS: Record<ModuleId, (p: DemoProps) => ReactNode> = {
  projects: (p) => <ProjectsDemo {...p} />,
  boq: (p) => <BoqDemo {...p} />,
  scheduling: (p) => <SchedulingDemo {...p} />,
}

export function ProductDemos() {
  const reduced = useReducedMotion() ?? false
  const [active, setActive] = useState<ModuleId>("projects")
  const stageRef = useRef<HTMLDivElement>(null)
  const play = useInView(stageRef, { once: true, amount: 0.45 })
  const activeModule = MODULES.find((m) => m.id === active)!

  return (
    <div className="sm-product">
      <ul className="sm-product__targets">
        {MODULES.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              className="sm-product__target"
              aria-pressed={m.id === active}
              aria-controls="sm-product-stage"
              onMouseEnter={() => setActive(m.id)}
              onFocus={() => setActive(m.id)}
              onClick={() => setActive(m.id)}
            >
              <span className="sm-product__target-name">{m.name}</span>
              <span className="sm-product__target-line">{m.line}</span>
            </button>
          </li>
        ))}
      </ul>

      <div ref={stageRef} id="sm-product-stage" className="sm-product__stage" aria-live="polite">
        <div className="sm-product__bar">
          <span>
            Clearwater Medical Center <span aria-hidden>/</span> {activeModule.name}
          </span>
          <span className="sm-product__synthetic">Synthetic data</span>
        </div>
        <div className="sm-product__viewport">
          <AnimatePresence initial={false}>
            <motion.div
              key={active}
              className="sm-product__demo"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.45, ease: [0.65, 0, 0.35, 1] }}
            >
              {DEMOS[active]({ play, reduced })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
