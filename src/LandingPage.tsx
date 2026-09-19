import { useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { FormworkCanvas } from "./features/landing/formwork/FormworkCanvas"
import { SiteOverlays } from "./features/landing/formwork/SiteOverlays"
import { BEATS, beatAt } from "./features/landing/formwork/lifecycle"
import "./features/landing/formwork/formwork.css"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const progressRef = useRef(0)
  const beatIndexRef = useRef(0)
  const hintRef = useRef(true)
  const [beat, setBeat] = useState(BEATS[0])
  const [hint, setHint] = useState(true)
  const [reduced, setReduced] = useState(false)

  useGSAP(
    () => {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)")
      const applyReduced = () => {
        const prefers = media.matches
        setReduced(prefers)
        if (prefers) {
          progressRef.current = 1
          setHint(false)
          setBeat(BEATS[BEATS.length - 1])
          beatIndexRef.current = BEATS.length - 1
          if (fillRef.current) fillRef.current.style.height = "100%"
        }
      }
      applyReduced()
      media.addEventListener("change", applyReduced)

      if (media.matches) {
        return () => media.removeEventListener("change", applyReduced)
      }

      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          progressRef.current = self.progress
          if (fillRef.current) {
            fillRef.current.style.height = `${Math.max(6, self.progress * 100)}%`
          }
          const showHint = self.progress < 0.04
          if (hintRef.current !== showHint) {
            hintRef.current = showHint
            setHint(showHint)
          }
          const next = Math.min(BEATS.length - 1, Math.floor(self.progress * 0.999 * BEATS.length))
          if (beatIndexRef.current !== next) {
            beatIndexRef.current = next
            setBeat(beatAt(self.progress))
          }
        },
      })

      return () => media.removeEventListener("change", applyReduced)
    },
    { scope: rootRef },
  )

  return (
    <div ref={rootRef} className="formwork-root">
      <div className="formwork-stage" aria-hidden>
        <FormworkCanvas progressRef={progressRef} reduced={reduced} />
      </div>
      <div className="formwork-scroll" />
      <SiteOverlays beat={beat} hint={hint} fillRef={fillRef} reduced={reduced} />
    </div>
  )
}
