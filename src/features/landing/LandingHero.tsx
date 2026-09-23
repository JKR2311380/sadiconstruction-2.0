import { useReducedMotion, motion } from "framer-motion"
import { ArrowDown } from "lucide-react"
import { Link } from "react-router-dom"
import { LandingHeader } from "./LandingHeader"
import { heroContainerVariant, reducedTextReveal, textRevealVariant } from "./motion"

const HEADLINE = "The bill owns the clock."
const WORDS = HEADLINE.split(" ")

export function LandingHero() {
  const reduced = useReducedMotion()
  const wordVariant = reduced ? reducedTextReveal : textRevealVariant

  const seeProof = () => {
    document.getElementById("proof")?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    })
  }

  return (
    <section className="relative isolate flex min-h-svh flex-col bg-espresso text-latte">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgb(212_175_55/0.14),transparent_58%)]"
      />

      <a className="acoustic-skip acoustic-focus" href="#proof">
        Skip to the meeting screen
      </a>

      <LandingHeader />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 pb-28 pt-16 sm:px-8">
        <motion.h1
          className="font-display text-[clamp(3.2rem,8.4vw,6.4rem)] font-extrabold leading-[0.82] tracking-[-0.035em] text-balance text-latte"
          variants={heroContainerVariant}
          initial="hidden"
          animate="visible"
        >
          {WORDS.map((word) => (
            <motion.span key={word} className="mr-[0.22em] inline-block" variants={wordVariant}>
              {word}
            </motion.span>
          ))}
        </motion.h1>
        <motion.p
          className="mt-6 max-w-[34ch] font-ui text-[clamp(1.15rem,2.1vw,1.55rem)] font-semibold leading-tight text-foam"
          initial={reduced ? false : { opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          Construction programme controls for planners and managers. Phases come from the approved
          BOQ. Longest Path is computed here.
        </motion.p>
        <motion.div
          className="mt-10 flex flex-wrap items-center gap-3"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            className="acoustic-focus inline-flex h-11 min-h-11 items-center rounded-full bg-amber px-5 font-display text-[0.95rem] tracking-[0.08em] uppercase text-espresso no-underline shadow-glow-amber"
            to="/signup"
          >
            Sign up
          </Link>
          <button
            type="button"
            onClick={seeProof}
            className="acoustic-focus bg-glass-thin inline-flex h-11 min-h-11 items-center gap-2 rounded-full px-5 font-display text-[0.95rem] tracking-[0.08em] uppercase text-latte"
          >
            <ArrowDown size={16} strokeWidth={1.75} aria-hidden />
            See the meeting screen
          </button>
        </motion.div>
      </div>
    </section>
  )
}
