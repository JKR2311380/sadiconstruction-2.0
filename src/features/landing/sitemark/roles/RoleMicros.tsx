import { useMemo, useRef, type ReactNode } from "react"
import { AnimatePresence, motion, useInView } from "framer-motion"
import { Lock } from "lucide-react"
import type { RoleId } from "../Mascot"
import { ACTIVITIES, LINKS, computeNetwork, isCriticalLink } from "../network"
import { useDemoTimeline, type DemoPlayProps } from "../useDemoTimeline"

const PHASES = [
  { code: "1", name: "Preliminaries" },
  { code: "2", name: "Site works" },
  { code: "3", name: "Concrete" },
  { code: "4", name: "Envelope" },
]

function PlannerLink({ play, reduced }: DemoPlayProps) {
  const scope = useRef<HTMLDivElement>(null)
  const net = useMemo(() => computeNetwork(), [])
  useDemoTimeline(scope, { play, reduced }, (tl) => {
    tl.from(".sm-micro__link-draw", { strokeDashoffset: 1, duration: 0.7, ease: "power2.inOut" })
      .from(".sm-micro__pulse", { scale: 0.6, opacity: 0, duration: 0.35 }, "-=0.15")
      .from(".sm-micro__tick", { opacity: 0, y: 4, duration: 0.3, stagger: 0.08 }, "-=0.1")
  })

  return (
    <div ref={scope} className="sm-micro sm-micro--link">
      <p className="sm-micro__caption">Link and recalc</p>
      <svg className="sm-micro__svg" viewBox="0 0 280 90" aria-hidden>
        <rect className="sm-micro__node" x="8" y="22" width="90" height="46" />
        <text className="sm-micro__label" x="16" y="42">
          3.1 Foundations
        </text>
        <text className="sm-micro__tick sm-num" x="16" y="58">
          {net.metrics.C.es}–{net.metrics.C.ef}
        </text>
        <path
          className="sm-micro__link-draw"
          d="M98,45 H170"
          pathLength={1}
          markerEnd="url(#sm-micro-arrow)"
        />
        <defs>
          <marker id="sm-micro-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
          </marker>
        </defs>
        <circle className="sm-micro__pulse" cx="134" cy="45" r="6" />
        <rect className="sm-micro__node" x="170" y="22" width="100" height="46" />
        <text className="sm-micro__label" x="178" y="42">
          3.2 Frame L1–L4
        </text>
        <text className="sm-micro__tick sm-num" x="178" y="58">
          {net.metrics.D.es}–{net.metrics.D.ef}
        </text>
      </svg>
    </div>
  )
}

function PlannerLock({ play, reduced }: DemoPlayProps) {
  const scope = useRef<HTMLDivElement>(null)
  useDemoTimeline(scope, { play, reduced }, (tl) => {
    tl.from(".sm-micro__boq-row", { opacity: 0.25, y: -6, duration: 0.4, stagger: 0.08 })
      .from(".sm-micro__lock", { opacity: 0, scale: 1.5, duration: 0.3, stagger: 0.06 }, "-=0.15")
  })

  return (
    <div ref={scope} className="sm-micro sm-micro--lock">
      <p className="sm-micro__caption">Phase roots lock</p>
      <ul className="sm-micro__boq">
        {PHASES.map((p) => (
          <li key={p.code} className="sm-micro__boq-row">
            <span className="sm-num">{p.code}</span>
            <span>{p.name}</span>
            <span className="sm-micro__lock">
              <Lock size={11} strokeWidth={2.25} aria-hidden /> Locked
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PmPath({ play, reduced }: DemoPlayProps) {
  const scope = useRef<HTMLDivElement>(null)
  const net = useMemo(() => computeNetwork(), [])
  const byId = useMemo(() => new Map(ACTIVITIES.map((a) => [a.id, a])), [])
  const spine = LINKS.filter((l) => isCriticalLink(net.critical, l, net.metrics))
    .map(([a, b]) => {
      const from = byId.get(a)!
      const to = byId.get(b)!
      return `M${from.x * 0.28},${from.y * 0.22} L${to.x * 0.28},${to.y * 0.22}`
    })
    .join(" ")

  useDemoTimeline(scope, { play, reduced }, (tl) => {
    tl.from(".sm-micro__spine-mark", { strokeDashoffset: 1, duration: 0.9, ease: "power2.inOut" })
  })

  return (
    <div ref={scope} className="sm-micro sm-micro--path">
      <p className="sm-micro__caption">Longest Path</p>
      <svg className="sm-micro__svg sm-micro__svg--path" viewBox="0 0 280 90" aria-hidden>
        {ACTIVITIES.filter((a) => "ABCDFGI".includes(a.id)).map((a) => (
          <rect
            key={a.id}
            className="sm-micro__node"
            data-critical={net.critical.has(a.id) || undefined}
            x={a.x * 0.28 - 18}
            y={a.y * 0.22 - 10}
            width="36"
            height="20"
          />
        ))}
        <path d={spine} pathLength={1} className="sm-spine-case" />
        <path d={spine} pathLength={1} className="sm-micro__spine-mark sm-spine-mark" />
      </svg>
      <p className="sm-micro__note sm-num">Handover day {net.duration}</p>
    </div>
  )
}

function PmSlip({ play, reduced }: DemoPlayProps) {
  const scope = useRef<HTMLDivElement>(null)
  const base = useMemo(() => computeNetwork(), [])
  const slipped = useMemo(() => computeNetwork({ F: 20 }), [])
  const scale = 96
  const pct = (d: number) => `${(d / scale) * 100}%`

  useDemoTimeline(scope, { play, reduced }, (tl) => {
    tl.fromTo(".sm-micro__bar--slip", { width: pct(base.metrics.F.ef - base.metrics.F.es) }, { width: pct(slipped.metrics.F.ef - slipped.metrics.F.es), duration: 0.7 })
      .from(".sm-micro__callout", { opacity: 0, y: 6, duration: 0.35 }, "-=0.2")
      .from(".sm-micro__meeting", { opacity: 0, duration: 0.35 }, "+=0.15")
  })

  return (
    <div ref={scope} className="sm-micro sm-micro--slip">
      <p className="sm-micro__caption">Slip callout</p>
      <div className="sm-micro__gantt">
        <div className="sm-micro__gantt-row">
          <span>Envelope</span>
          <span className="sm-micro__track">
            <span
              className="sm-micro__bar sm-micro__bar--slip"
              style={{ left: pct(base.metrics.F.es), width: pct(base.metrics.F.ef - base.metrics.F.es) }}
            />
          </span>
        </div>
        <div className="sm-micro__gantt-row">
          <span>Fit-out</span>
          <span className="sm-micro__track">
            <span
              className="sm-micro__bar sm-micro__bar--crit"
              style={{ left: pct(slipped.metrics.G.es), width: pct(slipped.metrics.G.ef - slipped.metrics.G.es) }}
            />
          </span>
        </div>
      </div>
      <p className="sm-micro__callout">
        Envelope +4 d · handover day {slipped.duration}
      </p>
      <p className="sm-micro__meeting">Ready for the meeting screen.</p>
    </div>
  )
}

const MICROS: Record<RoleId, Array<(p: DemoPlayProps) => ReactNode>> = {
  planner: [(p) => <PlannerLink {...p} />, (p) => <PlannerLock {...p} />],
  pm: [(p) => <PmPath {...p} />, (p) => <PmSlip {...p} />],
}

export function RoleMicros({ role, reduced }: { role: RoleId; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const play = useInView(ref, { once: false, amount: 0.4 })

  return (
    <div ref={ref} className="sm-roles__micros">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={role}
          className="sm-roles__micros-grid"
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.2, delay: reduced ? 0 : 0.18 } }}
          exit={{ opacity: 0, y: -4, transition: { duration: reduced ? 0 : 0.12 } }}
        >
          {MICROS[role].map((render, i) => (
            <div key={`${role}-${i}`} className="sm-roles__micro-cell">
              {render({ play, reduced })}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
