import { useMemo, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { RotateCcw } from "lucide-react"
import { ACTIVITIES, LINKS, NODE_H, NODE_W, computeNetwork, isCriticalLink } from "./network"

gsap.registerPlugin(useGSAP, ScrollTrigger)

const VIEW_W = 1000
const VIEW_H = 372
const SWEEP_W = 140

const STEPS = [
  { id: "network", label: "Network", line: "Nine activities, ten finish-to-start links, under locked BOQ phases." },
  { id: "forward", label: "Forward pass", line: "Earliest start and finish, left to right." },
  { id: "backward", label: "Backward pass", line: "Latest start and finish, right to left from handover." },
  { id: "float", label: "Float", line: "Where late and early disagree, the activity can slip." },
  { id: "path", label: "Longest Path", line: "Zero float, end to end. This chain sets handover." },
] as const

const SPINE_Y = 162

function edgePath(from: (typeof ACTIVITIES)[number], to: (typeof ACTIVITIES)[number]) {
  if (from.y === to.y) return `M${from.x + NODE_W},${from.y + NODE_H / 2} H${to.x}`
  if (from.y === SPINE_Y) {
    const x0 = from.x + NODE_W / 2
    const y0 = to.y < from.y ? from.y : from.y + NODE_H
    return `M${x0},${y0} V${to.y + NODE_H / 2} H${to.x}`
  }
  const x1 = to.x + NODE_W / 2
  const y1 = to.y < from.y ? to.y + NODE_H : to.y
  return `M${from.x + NODE_W},${from.y + NODE_H / 2} H${x1} V${y1}`
}

export function EngineDiagram() {
  const reduced = useReducedMotion() ?? false
  const scope = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [playStep, setStep] = useState(0)
  const net = useMemo(() => computeNetwork(), [])
  const byId = useMemo(() => new Map(ACTIVITIES.map((a) => [a.id, a])), [])

  const links = useMemo(
    () =>
      LINKS.map((link) => ({
        key: link.join("-"),
        d: edgePath(byId.get(link[0])!, byId.get(link[1])!),
        critical: isCriticalLink(net.critical, link, net.metrics),
      })),
    [byId, net],
  )
  const spine = links.filter((l) => l.critical).map((l) => l.d).join(" ")
  const step = reduced ? STEPS.length - 1 : playStep

  useGSAP(
    () => {
      if (reduced) return
      const q = gsap.utils.selector(scope)
      const fwdDur = 1.5
      const backDur = 1.5
      const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })

      tl.call(() => setStep(0))
        .fromTo(q(".sm-engine__reveal"), { attr: { width: 0 } }, { attr: { width: VIEW_W }, duration: 1.1, ease: "power2.inOut" })
        .from(q(".sm-engine__node"), { opacity: 0, y: 8, duration: 0.5, stagger: { each: 0.05, from: "start" } }, 0.1)
        .call(() => setStep(1), undefined, "+=0.25")
        .addLabel("fwd")
        .fromTo(q(".sm-engine__sweep--fwd"), { x: -SWEEP_W, opacity: 1 }, { x: VIEW_W, duration: fwdDur, ease: "none" }, "fwd")
        .set(q(".sm-engine__sweep--fwd"), { opacity: 0 })

      for (const a of ACTIVITIES) {
        const at = ((a.x + NODE_W * 0.4 + SWEEP_W) / (VIEW_W + SWEEP_W)) * fwdDur
        tl.from(q(`[data-early="${a.id}"]`), { opacity: 0, y: 4, duration: 0.35 }, `fwd+=${at}`)
      }

      tl.call(() => setStep(2), undefined, "+=0.3").addLabel("back")
        .fromTo(q(".sm-engine__sweep--back"), { x: VIEW_W, opacity: 1 }, { x: -SWEEP_W, duration: backDur, ease: "none" }, "back")
        .set(q(".sm-engine__sweep--back"), { opacity: 0 })

      for (const a of ACTIVITIES) {
        const at = ((VIEW_W - a.x - NODE_W * 0.6 + SWEEP_W) / (VIEW_W + SWEEP_W)) * backDur
        tl.from(q(`[data-late="${a.id}"]`), { opacity: 0, y: -4, duration: 0.35 }, `back+=${at}`)
      }

      tl.call(() => setStep(3), undefined, "+=0.3").addLabel("float")
        .from(q(".sm-engine__float"), { opacity: 0, x: -6, duration: 0.45, stagger: 0.12 }, "float+=0.15")
        .call(() => setStep(4), undefined, "+=0.7").addLabel("path")
        .from(q(".sm-engine__spine path"), { strokeDashoffset: 1, duration: 1.1, ease: "power2.inOut" }, "path")
        .from(q(".sm-engine__ignite"), { scaleX: 0, transformOrigin: "0% 50%", duration: 0.4, stagger: 0.08 }, "path+=0.15")
        .from(q(".sm-engine__total"), { opacity: 0, y: 6, duration: 0.4 }, "path+=0.8")

      tlRef.current = tl
      ScrollTrigger.create({
        trigger: scope.current,
        start: "top 65%",
        once: true,
        onEnter: () => tl.play(),
      })
    },
    { scope, dependencies: [reduced] },
  )

  const replay = () => {
    if (reduced) return
    tlRef.current?.restart()
  }

  return (
    <div ref={scope} className="sm-engine" data-step={STEPS[step].id}>
      <div className="sm-engine__status">
        <ol className="sm-engine__steps">
          {STEPS.map((s, i) => (
            <li key={s.id} aria-current={i === step ? "step" : undefined} data-done={i < step || undefined}>
              {s.label}
            </li>
          ))}
        </ol>
        <p className="sm-engine__line" aria-live="polite">
          <strong>{STEPS[step].label}.</strong> {STEPS[step].line}
        </p>
        {!reduced && (
          <button type="button" className="sm-engine__replay" onClick={replay}>
            <RotateCcw size={14} strokeWidth={2} aria-hidden /> Replay
          </button>
        )}
      </div>

      <div className="sm-engine__scroller">
        <svg
          className="sm-engine__svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="img"
          aria-label={`Clearwater network. Longest Path runs ${ACTIVITIES.filter((a) => net.critical.has(a.id))
            .map((a) => a.name)
            .join(", ")}; ${net.duration} working days.`}
        >
          <defs>
            <clipPath id="sm-engine-reveal">
              <rect className="sm-engine__reveal" x="0" y="0" width={VIEW_W} height={VIEW_H} />
            </clipPath>
            <linearGradient id="sm-sweep-fwd" x1="0" x2="1">
              <stop offset="0" stopColor="#0E1210" stopOpacity="0" />
              <stop offset="1" stopColor="#0E1210" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="sm-sweep-back" x1="1" x2="0">
              <stop offset="0" stopColor="#0E1210" stopOpacity="0" />
              <stop offset="1" stopColor="#0E1210" stopOpacity="0.1" />
            </linearGradient>
            <marker id="sm-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="#0E1210" />
            </marker>
          </defs>

          <g clipPath="url(#sm-engine-reveal)">
            {links.map((l) => (
              <path
                key={l.key}
                d={l.d}
                className="sm-engine__edge"
                data-float={!l.critical || undefined}
                markerEnd="url(#sm-arrow)"
              />
            ))}
          </g>

          <g className="sm-engine__sweep sm-engine__sweep--fwd" opacity="0">
            <rect width={SWEEP_W} height={VIEW_H} fill="url(#sm-sweep-fwd)" />
            <line x1={SWEEP_W} x2={SWEEP_W} y1="0" y2={VIEW_H} />
          </g>
          <g className="sm-engine__sweep sm-engine__sweep--back" opacity="0">
            <rect width={SWEEP_W} height={VIEW_H} fill="url(#sm-sweep-back)" />
            <line x1="0" x2="0" y1="0" y2={VIEW_H} />
          </g>

          <g className="sm-engine__spine">
            <path d={spine} pathLength={1} className="sm-spine-case" />
            <path d={spine} pathLength={1} className="sm-spine-mark" />
          </g>

          {ACTIVITIES.map((a) => {
            const m = net.metrics[a.id]
            const critical = net.critical.has(a.id)
            return (
              <g
                key={a.id}
                className="sm-engine__node"
                data-float={!critical || undefined}
                transform={`translate(${a.x} ${a.y})`}
              >
                <rect className="sm-engine__box" width={NODE_W} height={NODE_H} />
                {critical && <rect className="sm-engine__ignite" width={NODE_W} height={5} />}
                <text className="sm-engine__code" x="9" y="19">
                  {a.code}
                </text>
                <text className="sm-engine__name" x="9" y="34">
                  {a.name}
                </text>
                <text className="sm-engine__nums" x="9" y="51" data-early={a.id}>
                  {m.es}–{m.ef}
                </text>
                <text className="sm-engine__nums" x={NODE_W - 9} y="51" textAnchor="end" data-late={a.id}>
                  {m.ls}–{m.lf}
                </text>
                {!critical && (
                  <text className="sm-engine__float" x={NODE_W / 2} y={a.y < 100 ? -8 : NODE_H + 17} textAnchor="middle">
                    TF {m.totalFloat} d
                  </text>
                )}
              </g>
            )
          })}

          <g className="sm-engine__total" transform={`translate(${VIEW_W - 6} ${VIEW_H - 14})`}>
            <text textAnchor="end">
              Handover day {net.duration}
            </text>
          </g>
        </svg>
        <p className="sm-engine__legend">
          <span>Left figures: earliest start–finish</span>
          <span>Right figures: latest start–finish, in working days</span>
        </p>
      </div>
    </div>
  )
}
