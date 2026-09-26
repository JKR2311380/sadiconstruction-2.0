import { useReducedMotion, AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, LogIn, UserPlus } from "lucide-react"
import { Link } from "react-router-dom"
import {
  glassChildVariant,
  glassPanelVariant,
  pipVariant,
  reducedGlassPanel,
} from "./motion"
import { BEATS } from "./formwork/lifecycle"

type Props = {
  currentStep: number
  onBack: () => void
  onNext: () => void
  onGoTo: (index: number) => void
}

export function StepOverlay({ currentStep, onBack, onNext, onGoTo }: Props) {
  const reduced = useReducedMotion()
  const beat = BEATS[currentStep]
  const last = currentStep === BEATS.length - 1
  const panel = reduced ? reducedGlassPanel : glassPanelVariant

  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-latte">
      <a className="acoustic-skip acoustic-focus pointer-events-auto" href="#formwork-enter">
        Skip to sign up
      </a>

      <header className="pointer-events-auto absolute top-5 right-5 left-5 flex items-start justify-between sm:top-7 sm:right-8 sm:left-8">
        <p className="font-display text-[clamp(1.2rem,2vw,1.6rem)] font-bold tracking-[0.22em]">SADICON</p>
        <nav className="flex gap-2" aria-label="Account">
          <Link
            className="acoustic-focus bg-glass-thin inline-flex h-11 items-center rounded-full px-4 font-display text-[0.95rem] tracking-[0.08em] uppercase text-latte no-underline"
            to="/login"
          >
            Sign in
          </Link>
          <Link
            className="acoustic-focus inline-flex h-11 items-center rounded-full bg-amber px-4 font-display text-[0.95rem] tracking-[0.08em] uppercase text-espresso no-underline shadow-glow-amber"
            to="/signup"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <p className="font-measure absolute top-[22vh] left-5 text-[0.72rem] tracking-[0.08em] text-foam/70 tabular-nums sm:left-8">
        <span className="block">{beat.week}</span>
        <span className="block">{beat.code}</span>
      </p>

      <div className="absolute right-5 bottom-[7.5rem] left-5 sm:right-8 sm:bottom-28 sm:left-auto sm:w-min sm:min-w-[22rem] sm:max-w-[32rem]">
        <AnimatePresence mode="wait">
          <motion.article
            key={beat.id}
            variants={panel}
            initial={reduced ? false : "hidden"}
            animate="visible"
            exit={reduced ? undefined : "exit"}
            aria-live="polite"
            className="text-latte"
          >
            <motion.p
              variants={glassChildVariant}
              className="font-measure mb-1 text-[0.72rem] tracking-[0.18em] text-amber tabular-nums"
            >
              {beat.index}
            </motion.p>
            <motion.h2
              variants={glassChildVariant}
              className="font-display text-[clamp(2.8rem,6vw,5rem)] leading-[0.82] font-extrabold tracking-[-0.035em] text-balance"
            >
              {beat.name}
            </motion.h2>
            <motion.p
              variants={glassChildVariant}
              className="mt-3 max-w-[18ch] font-ui text-[clamp(1.35rem,2.4vw,2rem)] font-semibold leading-tight text-foam"
            >
              {beat.lead}
            </motion.p>
            <motion.div variants={glassChildVariant} className="bg-glass mt-5 rounded-[1.15rem] p-4 shadow-glow-amber">
              <p className="font-ui max-w-[42ch] text-[1.05rem] leading-relaxed text-latte">{beat.body}</p>
              <p className="font-measure mt-3 text-[0.68rem] tracking-[0.04em] text-foam/70">
                PRJ-2024-008 Clearwater Medical Center is synthetic demonstration data.
              </p>
            </motion.div>
          </motion.article>
        </AnimatePresence>
      </div>

      <div className="pointer-events-auto absolute right-5 bottom-5 left-5 flex flex-wrap items-center justify-between gap-3 sm:right-8 sm:bottom-7 sm:left-8">
        <div className="flex items-center gap-2" role="group" aria-label="Programme phases">
          {BEATS.map((item, index) => {
            const active = index === currentStep
            const visited = index < currentStep
            return (
              <motion.button
                key={item.id}
                type="button"
                aria-label={`${item.name}, phase ${index + 1} of ${BEATS.length}`}
                aria-current={active ? "step" : undefined}
                onClick={() => onGoTo(index)}
                variants={pipVariant}
                animate={active ? "active" : "idle"}
                className="acoustic-focus size-2.5 rounded-full border border-border-glass"
                style={
                  !active && visited
                    ? { backgroundColor: "rgba(232, 224, 208, 0.4)" }
                    : !active
                      ? { backgroundColor: "transparent" }
                      : undefined
                }
              />
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2" id="formwork-enter">
          <button
            type="button"
            onClick={onBack}
            disabled={currentStep === 0}
            aria-disabled={currentStep === 0}
            className="acoustic-focus bg-glass-thin inline-flex h-11 items-center gap-2 rounded-full px-4 font-display text-[0.95rem] tracking-[0.08em] uppercase text-latte disabled:opacity-35"
          >
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
            Back
          </button>
          {last ? (
            <>
              <Link
                className="acoustic-focus bg-glass-thin inline-flex h-11 items-center gap-2 rounded-full px-4 font-display text-[0.95rem] tracking-[0.08em] uppercase text-latte no-underline"
                to="/login"
              >
                <LogIn size={16} strokeWidth={1.75} aria-hidden />
                Sign in
              </Link>
              <Link
                className="acoustic-focus inline-flex h-11 items-center gap-2 rounded-full bg-amber px-4 font-display text-[0.95rem] tracking-[0.08em] uppercase text-espresso no-underline shadow-glow-amber"
                to="/signup"
              >
                <UserPlus size={16} strokeWidth={1.75} aria-hidden />
                Sign up
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="acoustic-focus inline-flex h-11 items-center gap-2 rounded-full bg-amber px-4 font-display text-[0.95rem] tracking-[0.08em] uppercase text-espresso shadow-glow-amber"
            >
              Next phase
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
