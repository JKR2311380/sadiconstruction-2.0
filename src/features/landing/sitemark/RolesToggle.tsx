import { useRef, useState, type KeyboardEvent } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Mascot, type RoleId } from "./Mascot"

const ROLES: Array<{ id: RoleId; label: string; heading: string; points: string[] }> = [
  {
    id: "planner",
    label: "Planner",
    heading: "You build the network.",
    points: [
      "Nest summaries and activities under the locked BOQ phase roots.",
      "Link finish-to-start, start-to-start, finish-to-finish or start-to-finish, with lag.",
      "Every edit recalculates dates, float and the Longest Path.",
    ],
  },
  {
    id: "pm",
    label: "Project Manager",
    heading: "You read the spine.",
    points: [
      "See the Longest Path on the same WBS the bill was approved on.",
      "Know which phase a slip lands in, in working days.",
      "Put the schedule on the meeting screen without exporting it.",
    ],
  },
]

export function RolesToggle() {
  const reduced = useReducedMotion() ?? false
  const [role, setRole] = useState<RoleId>("planner")
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const current = ROLES.find((r) => r.id === role)!

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    e.preventDefault()
    const next = (index + (e.key === "ArrowRight" ? 1 : ROLES.length - 1)) % ROLES.length
    setRole(ROLES[next].id)
    tabs.current[next]?.focus()
  }

  return (
    <div className="sm-roles">
      <div className="sm-roles__figure">
        <Mascot role={role} reduced={reduced} />
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
              <ul className="sm-roles__points">
                {current.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
