import { Suspense, lazy, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"
import { Pause, Play } from "lucide-react"
import { PHASES, PHASE_HOLD_MS } from "../phases"

const BuildPhasesScene = lazy(() =>
  import("./BuildPhasesScene").then((m) => ({ default: m.BuildPhasesScene })),
)

const LAST = PHASES.length - 1

export function BuildPhases() {
  const reduced = useReducedMotion() ?? false
  const planeRef = useRef<HTMLDivElement>(null)
  const inView = useInView(planeRef, { amount: 0.2 })
  const [phase, setPhase] = useState(0)
  const [paused, setPaused] = useState(false)
  const shown = reduced ? LAST : phase
  const playing = !reduced && !paused && inView

  useEffect(() => {
    if (!playing) return
    const id = window.setTimeout(() => setPhase((p) => (p + 1) % PHASES.length), PHASE_HOLD_MS)
    return () => window.clearTimeout(id)
  }, [playing, phase])

  const current = PHASES[shown]

  return (
    <div ref={planeRef} className="sm-hero__plane">
      <div className="sm-hero__stage" aria-hidden>
        <Suspense fallback={null}>
          <BuildPhasesScene phase={shown} active={inView} />
        </Suspense>
      </div>

      <div className="sm-hero__caption">
        <div className="sm-hero__caption-text" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="sm-hero__phase-count">
                Phase {shown + 1} of {PHASES.length}
              </p>
              <p className="sm-hero__phase-name">{current.label}</p>
              <p className="sm-hero__phase-line">{current.caption}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="sm-hero__controls">
          <ol className="sm-hero__ticks">
            {PHASES.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="sm-hero__tick"
                  aria-label={`Show ${p.label}`}
                  aria-current={i === shown ? "step" : undefined}
                  data-done={i < shown || undefined}
                  onClick={() => {
                    setPhase(i)
                    setPaused(true)
                  }}
                >
                  <span
                    key={`${i}-${shown}-${playing}`}
                    className="sm-hero__tick-fill"
                    data-running={(i === shown && playing) || undefined}
                    style={{ animationDuration: `${PHASE_HOLD_MS}ms` }}
                  />
                </button>
              </li>
            ))}
          </ol>
          {!reduced && (
            <button
              type="button"
              className="sm-hero__pause"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Play build sequence" : "Pause build sequence"}
            >
              {paused ? <Play size={14} strokeWidth={2} /> : <Pause size={14} strokeWidth={2} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
