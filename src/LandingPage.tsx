import { Link } from "react-router-dom"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SpineIcon } from "@/components/brand/SpineIcon"
import { BuildPhases } from "./features/landing/sitemark/hero/BuildPhases"
import { ProductDemos } from "./features/landing/sitemark/ProductDemos"
import { EngineDiagram } from "./features/landing/sitemark/EngineDiagram"
import { RolesToggle } from "./features/landing/sitemark/RolesToggle"
import { ProofGraph } from "./features/landing/sitemark/ProofGraph"
import { SectionHead } from "./features/landing/sitemark/SectionHead"
import "./features/landing/sitemark/sitemark.css"

// The copy waits for the mark's reveal (icon 0–1.1s, wordmark from 0.56s) before it follows.
const heroCopy: Variants = {
  rest: {},
  shown: { transition: { staggerChildren: 0.09, delayChildren: 1.0 } },
}

const heroItem: Variants = {
  rest: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
}

const heroMark: Variants = {
  rest: {},
  shown: { transition: { staggerChildren: 0.024, delayChildren: 0.56 } },
}

const heroMarkChar: Variants = {
  rest: { y: "100%" },
  shown: { y: "0%", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

const BRAND = "Sadiconstruction"

function Actions({ className, invert = false }: { className?: string; invert?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ""}`}>
      <Button
        asChild
        size="lg"
        className={invert ? "rounded-md bg-background text-foreground shadow-none hover:bg-background/90" : "rounded-md shadow-none"}
      >
        <Link to="/login" className="group">
          Sign in{" "}
          <ArrowRight
            size={16}
            strokeWidth={2}
            aria-hidden
            className="transition-transform duration-220 group-hover:translate-x-0.5"
          />
        </Link>
      </Button>
      <Button
        asChild
        variant="outline"
        size="lg"
        className={
          invert
            ? "rounded-md border-background/50 bg-transparent text-background shadow-none hover:bg-background/10 hover:text-background"
            : "rounded-md border-border bg-transparent shadow-none"
        }
      >
        <Link to="/signup">Sign up</Link>
      </Button>
    </div>
  )
}

export default function LandingPage() {
  const reduced = useReducedMotion() ?? false

  return (
    <div className="sm-root">
      <section className="sm-hero" aria-labelledby="sm-hero-title">
        <motion.div
          className="sm-hero__copy"
          variants={heroCopy}
          initial={reduced ? "shown" : "rest"}
          animate="shown"
        >
          <motion.h1
            id="sm-hero-title"
            className="sm-hero__mark"
            variants={heroMark}
            initial={reduced ? "shown" : "rest"}
            animate="shown"
            aria-label={BRAND}
          >
            <SpineIcon className="sm-hero__icon" motion="reveal" />
            {BRAND.split("").map((char, i) => (
              <span key={i} className="sm-hero__mark-char" aria-hidden>
                <motion.span variants={heroMarkChar}>{char}</motion.span>
              </span>
            ))}
          </motion.h1>
          <motion.p className="sm-hero__lede" variants={heroItem}>
            Schedule on the bill you already approved.
          </motion.p>
          <motion.p className="sm-hero__support" variants={heroItem}>
            BOQ phases become locked WBS roots. Link the work underneath and the Longest Path is computed here, in
            the product: forward pass, backward pass, float, spine.
          </motion.p>
          <motion.div variants={heroItem}>
            <Actions />
          </motion.div>
          <motion.p className="sm-hero__meta" variants={heroItem}>
            For SADICON MANAGEMENT planners and project managers.
          </motion.p>
        </motion.div>
        <BuildPhases />
      </section>

      <section className="sm-section" aria-labelledby="sm-product-title">
        <SectionHead id="sm-product-title" title="Three modules. One bill underneath.">
          Projects hold the record. The BOQ is the work breakdown, locked. Scheduling hangs the network from it.
        </SectionHead>
        <ProductDemos />
      </section>

      <section className="sm-section sm-section--engine" aria-labelledby="sm-engine-title">
        <SectionHead id="sm-engine-title" title="Criticality is computed, not imported.">
          The engine runs the same passes a desktop scheduler does, in the browser, on every edit.
        </SectionHead>
        <EngineDiagram />
      </section>

      <section className="sm-section" aria-labelledby="sm-roles-title">
        <SectionHead id="sm-roles-title" title="Two seats at the same schedule." />
        <RolesToggle />
      </section>

      <section className="sm-section sm-section--proof" aria-labelledby="sm-proof-title">
        <SectionHead id="sm-proof-title" title="Push a date. Watch the spine move.">
          Lengthen services rough-in until it outruns the envelope. The engine recalculates as you press.
        </SectionHead>
        <ProofGraph />
      </section>

      <section className="sm-close" aria-labelledby="sm-close-title">
        <SectionHead id="sm-close-title" title="Your bill already knows the phases.">
          Sign in to schedule against it. New to the team? Sign up and start on the same WBS.
        </SectionHead>
        <Actions className="-mt-2" invert />
        <footer className="sm-foot">
          <span>SADICON MANAGEMENT · Internal platform</span>
          <span>Figures on this page are synthetic: Clearwater Medical Center, PRJ-2024-008.</span>
        </footer>
      </section>
    </div>
  )
}
