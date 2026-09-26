import { Link } from "react-router-dom"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { BuildPhases } from "./features/landing/sitemark/hero/BuildPhases"
import { ProductDemos } from "./features/landing/sitemark/ProductDemos"
import { EngineDiagram } from "./features/landing/sitemark/EngineDiagram"
import { RolesToggle } from "./features/landing/sitemark/RolesToggle"
import { ProofGraph } from "./features/landing/sitemark/ProofGraph"
import { SectionHead } from "./features/landing/sitemark/SectionHead"
import "./features/landing/sitemark/sitemark.css"

const heroCopy: Variants = {
  rest: {},
  shown: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
}

const heroItem: Variants = {
  rest: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
}

const heroMark: Variants = {
  rest: { clipPath: "inset(0 0 100% 0)", y: 24 },
  shown: { clipPath: "inset(0 0 0% 0)", y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
}

function Actions({ className }: { className?: string }) {
  return (
    <div className={`sm-actions ${className ?? ""}`}>
      <Link to="/login" className="sm-btn sm-btn--primary">
        Sign in <ArrowRight size={16} strokeWidth={2} aria-hidden />
      </Link>
      <Link to="/signup" className="sm-btn">
        Sign up
      </Link>
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
          <motion.h1 id="sm-hero-title" className="sm-hero__mark" variants={heroMark}>
            Sadiconstruction
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
        <Actions className="sm-actions--close" />
        <footer className="sm-foot">
          <span>SADICON MANAGEMENT · Internal platform</span>
          <span>Figures on this page are synthetic: Clearwater Medical Center, PRJ-2024-008.</span>
        </footer>
      </section>
    </div>
  )
}
