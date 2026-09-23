import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

export type RoleId = "planner" | "pm"

const L_SHOULDER = { x: 92, y: 98 }
const R_SHOULDER = { x: 128, y: 98 }
const UPPER = 42
const FORE = 40

const POSES: Record<RoleId, { lu: number; lf: number; ru: number; rf: number; head: number }> = {
  planner: { lu: 32, lf: -70, ru: -32, rf: 70, head: 5 },
  pm: { lu: 25, lf: -65, ru: -100, rf: 0, head: -4 },
}

function Arm({ side, shoulder }: { side: "l" | "r"; shoulder: { x: number; y: number } }) {
  const { x, y } = shoulder
  return (
    <g className={`sm-mascot__upper sm-mascot__upper--${side}`}>
      <line className="sm-mascot__halo" x1={x} y1={y + 10} x2={x} y2={y + UPPER} />
      <line x1={x} y1={y} x2={x} y2={y + UPPER} />
      <g className={`sm-mascot__fore sm-mascot__fore--${side}`}>
        <line className="sm-mascot__halo" x1={x} y1={y + UPPER + 12} x2={x} y2={y + UPPER + FORE} />
        <circle className="sm-mascot__halo" cx={x} cy={y + UPPER + FORE} r="8" />
        <line x1={x} y1={y + UPPER} x2={x} y2={y + UPPER + FORE} />
        <circle cx={x} cy={y + UPPER + FORE} r="8" />
      </g>
    </g>
  )
}

export function Mascot({ role, reduced }: { role: RoleId; reduced: boolean }) {
  const scope = useRef<SVGSVGElement>(null)
  const first = useRef(true)

  useGSAP(
    () => {
      const pose = POSES[role]
      const duration = first.current || reduced ? 0 : 0.3
      first.current = false
      const ease = "expo.out"
      const lElbow = `${L_SHOULDER.x} ${L_SHOULDER.y + UPPER}`
      const rElbow = `${R_SHOULDER.x} ${R_SHOULDER.y + UPPER}`
      gsap.to(".sm-mascot__upper--l", { rotation: pose.lu, svgOrigin: `${L_SHOULDER.x} ${L_SHOULDER.y}`, duration, ease })
      gsap.to(".sm-mascot__fore--l", { rotation: pose.lf, svgOrigin: lElbow, duration, ease })
      gsap.to(".sm-mascot__upper--r", { rotation: pose.ru, svgOrigin: `${R_SHOULDER.x} ${R_SHOULDER.y}`, duration, ease })
      gsap.to(".sm-mascot__fore--r", { rotation: pose.rf, svgOrigin: rElbow, duration, ease })
      gsap.to(".sm-mascot__head", { rotation: pose.head, svgOrigin: "110 86", duration, ease })
      gsap.to(".sm-mascot__tablet", {
        autoAlpha: role === "planner" ? 1 : 0,
        y: role === "planner" ? 0 : 14,
        duration: duration * 0.8,
        ease,
      })
      gsap.to(".sm-mascot__board", {
        autoAlpha: role === "pm" ? 1 : 0,
        x: role === "pm" ? 0 : 16,
        duration,
        ease,
      })
    },
    { scope, dependencies: [role, reduced] },
  )

  return (
    <svg ref={scope} className="sm-mascot" viewBox="0 0 264 300" aria-hidden>
      <line className="sm-mascot__ground" x1="8" x2="256" y1="291" y2="291" />

      <g className="sm-mascot__board">
        <line className="sm-mascot__easel" x1="200" y1="92" x2="192" y2="290" />
        <line className="sm-mascot__easel" x1="246" y1="92" x2="254" y2="290" />
        <rect className="sm-mascot__panel" x="190" y="38" width="66" height="56" />
        <circle className="sm-mascot__dot" cx="204" cy="78" r="4" />
        <circle className="sm-mascot__dot" cx="223" cy="56" r="4" />
        <circle className="sm-mascot__dot" cx="242" cy="72" r="4" />
        <polyline className="sm-mascot__mark-case" points="204,78 223,56 242,72" />
        <polyline className="sm-mascot__mark" points="204,78 223,56 242,72" />
      </g>

      <g className="sm-mascot__body">
        <line className="sm-mascot__limb sm-mascot__leg" x1="101" y1="168" x2="96" y2="278" />
        <line className="sm-mascot__limb sm-mascot__leg" x1="119" y1="168" x2="126" y2="278" />
        <rect className="sm-mascot__boot" x="82" y="276" width="24" height="12" rx="2" />
        <rect className="sm-mascot__boot" x="118" y="276" width="24" height="12" rx="2" />
        <rect className="sm-mascot__torso" x="86" y="88" width="48" height="88" rx="14" />
        <rect className="sm-mascot__stripe" x="86" y="130" width="48" height="5" />
        <rect className="sm-mascot__stripe" x="86" y="146" width="48" height="5" />
        <g className="sm-mascot__head">
          <circle className="sm-mascot__skull" cx="110" cy="62" r="19" />
          <path className="sm-mascot__hat" d="M89,57 A21,21 0 0 1 131,57 Z" />
          <rect className="sm-mascot__hat" x="82" y="54" width="56" height="6" rx="1" />
          <rect className="sm-mascot__hat-band" x="104" y="38" width="12" height="16" />
        </g>
      </g>

      <g className="sm-mascot__arms">
        <Arm side="l" shoulder={L_SHOULDER} />
        <Arm side="r" shoulder={R_SHOULDER} />
      </g>

      <g className="sm-mascot__tablet">
        <rect className="sm-mascot__panel" x="76" y="138" width="68" height="44" rx="3" />
        <rect className="sm-mascot__bar" x="84" y="147" width="22" height="5" />
        <rect className="sm-mascot__bar" x="96" y="156" width="30" height="5" />
        <rect className="sm-mascot__mark-bar" x="104" y="166" width="32" height="7" />
      </g>
    </svg>
  )
}
