import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { FormworkCanvas } from "./formwork/FormworkCanvas"

const COMPLETE = 6

export function CampusArtefact() {
  const reduced = Boolean(useReducedMotion())
  const frame = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const node = frame.current
    if (!node) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting && entry.intersectionRatio >= 0.2)
      },
      { threshold: [0.2] },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  return (
    <section id="campus" className="relative bg-espresso px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.6rem)] font-extrabold leading-[0.88] tracking-[-0.035em] text-balance text-latte">
          The campus is the job. The Gantt is the control.
        </h2>
        <p className="mt-4 max-w-[46ch] font-ui text-[1.1rem] leading-relaxed text-foam">
          Clearwater massing for PRJ-2024-008. The volumes follow the bill. The programme lives on
          the meeting screen above.
        </p>
        <div
          ref={frame}
          className="campus-artefact bg-glass mt-8 overflow-hidden rounded-[1.15rem]"
          role="img"
          aria-label="Clearwater Medical Center campus massing"
        >
          <FormworkCanvas currentStep={COMPLETE} reduced={reduced} active={active} />
        </div>
      </div>
    </section>
  )
}
