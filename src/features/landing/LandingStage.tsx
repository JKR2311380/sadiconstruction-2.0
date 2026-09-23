import { useCallback, useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { FormworkCanvas } from "./formwork/FormworkCanvas"
import { BEATS } from "./formwork/lifecycle"
import { StepOverlay } from "./StepOverlay"

const LAST = BEATS.length - 1

export function LandingStage() {
  const reduced = Boolean(useReducedMotion())
  const [currentStep, setCurrentStep] = useState(0)

  const goNext = useCallback(() => {
    setCurrentStep((step) => Math.min(LAST, step + 1))
  }, [])

  const goBack = useCallback(() => {
    setCurrentStep((step) => Math.max(0, step - 1))
  }, [])

  const goTo = useCallback((index: number) => {
    setCurrentStep(Math.min(LAST, Math.max(0, index)))
  }, [])

  useEffect(() => {
    const stage = document.getElementById("programme")
    if (!stage) return
    let armed = false
    const io = new IntersectionObserver(
      ([entry]) => {
        armed = entry.isIntersecting && entry.intersectionRatio >= 0.55
      },
      { threshold: [0.55] },
    )
    io.observe(stage)

    const onKey = (event: KeyboardEvent) => {
      if (!armed) return
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || event.target.isContentEditable) return
      }
      if (event.key === "ArrowRight" || event.key === "l") {
        event.preventDefault()
        goNext()
      } else if (event.key === "ArrowLeft" || event.key === "h") {
        event.preventDefault()
        goBack()
      } else if (/^[1-7]$/.test(event.key)) {
        goTo(Number(event.key) - 1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      io.disconnect()
      window.removeEventListener("keydown", onKey)
    }
  }, [goBack, goNext, goTo])

  return (
    <section id="programme" className="acoustic-pane relative h-svh overflow-hidden bg-espresso">
      <div className="absolute inset-0 z-0" aria-hidden>
        <FormworkCanvas currentStep={currentStep} reduced={reduced} />
      </div>
      <StepOverlay currentStep={currentStep} onBack={goBack} onNext={goNext} onGoTo={goTo} />
    </section>
  )
}
