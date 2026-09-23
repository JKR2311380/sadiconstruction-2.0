import type { ReactNode } from "react"
import { motion, useReducedMotion, type Variants } from "framer-motion"

const group: Variants = {
  rest: {},
  shown: { transition: { staggerChildren: 0.05 } },
}

const item: Variants = {
  rest: { opacity: 0.12, y: 22, filter: "blur(6px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

export function SectionHead({ id, title, children }: { id: string; title: ReactNode; children?: ReactNode }) {
  const reduced = useReducedMotion() ?? false
  return (
    <motion.header
      className="sm-head"
      variants={group}
      initial={reduced ? "shown" : "rest"}
      whileInView="shown"
      viewport={{ once: true, amount: 0.6 }}
    >
      <motion.h2 id={id} className="sm-head__title" variants={item}>
        {title}
      </motion.h2>
      {children && (
        <motion.p className="sm-head__lede" variants={item}>
          {children}
        </motion.p>
      )}
    </motion.header>
  )
}
