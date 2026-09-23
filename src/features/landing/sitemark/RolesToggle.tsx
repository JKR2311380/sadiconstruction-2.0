import { useRef, useState, type KeyboardEvent } from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"
import { type RoleId } from "./Mascot"
import { RoleFigure } from "./roles/RoleFigure"
import { RoleMicros } from "./roles/RoleMicros"

const ROLES: Array<{ id: RoleId; label: string; heading: string }> = [
  {
    id: "planner",
    label: "Planner",
    heading: "You build the network.",
  },
  {
    id: "pm",
    label: "Project Manager",
    heading: "You read the spine.",
  },
]

export function RolesToggle() {
  const reduced = useReducedMotion() ?? false
  const [role, setRole] = useState<RoleId>("planner")
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const sectionRef = useRef<HTMLDivElement>(null)
  const near = useInView(sectionRef, { margin: "280px 0px", once: true })
  const current = ROLES.find((r) => r.id === role)!

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    e.preventDefault()
    const next = (index + (e.key === "ArrowRight" ? 1 : ROLES.length - 1)) % ROLES.length
    setRole(ROLES[next].id)
    tabs.current[next]?.focus()
  }

  return (
    <div ref={sectionRef} className="sm-roles">
      <div className="sm-roles__figure">
        <RoleFigure role={role} reduced={reduced} near={near} />
      </div>

      <div className="sm-roles__content">
        <div className="sm-roles__toggle" role="tablist" aria-label="Role">
          {ROLES.map((r, i) => (
            <button
              key={r.id}
              ref={(el) => {
                tabs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`sm-role-tab-${r.id}`}
              aria-selected={r.id === role}
              aria-controls="sm-role-panel"
              tabIndex={r.id === role ? 0 : -1}
              className="sm-roles__tab"
              onClick={() => setRole(r.id)}
              onKeyDown={(e) => onKey(e, i)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div id="sm-role-panel" role="tabpanel" aria-labelledby={`sm-role-tab-${role}`} className="sm-roles__panel">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={role}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.2, delay: reduced ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] } }}
              exit={{ opacity: 0, y: -6, transition: { duration: reduced ? 0 : 0.12 } }}
            >
              <h3 className="sm-roles__heading">{current.heading}</h3>
            </motion.div>
          </AnimatePresence>
          <RoleMicros role={role} reduced={reduced} />
        </div>
      </div>
    </div>
  )
}
