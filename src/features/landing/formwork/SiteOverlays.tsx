import type { RefObject } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowDown, LogIn, UnlockKeyhole } from "lucide-react"
import { Link } from "react-router-dom"
import type { Beat } from "./lifecycle"

const wipe = {
  initial: { clipPath: "inset(0 0 100% 0)", opacity: 0.4 },
  animate: { clipPath: "inset(0 0 0% 0)", opacity: 1 },
  exit: { clipPath: "inset(100% 0 0 0)", opacity: 0.2 },
}

type Props = {
  beat: Beat
  hint: boolean
  fillRef: RefObject<HTMLSpanElement | null>
  reduced: boolean
}

export function SiteOverlays({ beat, hint, fillRef, reduced }: Props) {
  const showHint = hint && !reduced
  const showHandover = Boolean(beat.handover)

  return (
    <div className="formwork-hud">
      <a className="formwork-skip" href="#formwork-enter">
        Skip to sign in
      </a>

      <motion.p
        className="formwork-wordmark"
        initial={reduced ? false : { opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        SADICON
      </motion.p>

      <motion.aside
        className="formwork-staff"
        aria-hidden
        initial={reduced ? false : { opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        <span ref={fillRef} className="formwork-staff-fill" />
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} className="formwork-staff-tick" style={{ bottom: `${(i / 6) * 100}%` }} />
        ))}
      </motion.aside>

      <p className="formwork-measure">
        <span>{beat.week}</span>
        <span>{beat.code}</span>
      </p>

      <section className="formwork-copy" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key={beat.id}
            className="formwork-copy-inner"
            initial={reduced ? false : wipe.initial}
            animate={wipe.animate}
            exit={reduced ? undefined : wipe.exit}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="formwork-index">{beat.index}</p>
            <h1 className="formwork-name">{beat.name}</h1>
            <p className="formwork-lead">{beat.lead}</p>
            <div className="formwork-oil">
              <p className="formwork-body">{beat.body}</p>
              <p className="formwork-synth">
                PRJ-2024-008 Clearwater Medical Center is synthetic demonstration data.
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {showHint && (
          <motion.p
            className="formwork-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ArrowDown size={16} strokeWidth={1.75} aria-hidden />
            Scroll to pour
          </motion.p>
        )}
      </AnimatePresence>

      <div className="formwork-enter" id="formwork-enter">
        <AnimatePresence>
          {showHandover && (
            <motion.div
              className="formwork-enter-row"
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link className="formwork-action formwork-action-primary" to="/login">
                <LogIn size={16} strokeWidth={1.75} aria-hidden />
                Sign in
              </Link>
              <Link className="formwork-action" to="/request-access">
                <UnlockKeyhole size={16} strokeWidth={1.75} aria-hidden />
                Request access
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
