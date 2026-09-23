import { useEffect, useRef, type RefObject } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

const EASE = "expo.out"

export interface DemoPlayProps {
  play: boolean
  reduced: boolean
}

/** Builds a paused timeline on mount (from-states render immediately) and plays it once `play` flips. */
export function useDemoTimeline(
  scope: RefObject<HTMLElement | null>,
  { play, reduced }: DemoPlayProps,
  build: (tl: gsap.core.Timeline) => void,
  deps: unknown[] = [],
) {
  const tl = useRef<gsap.core.Timeline | null>(null)
  useGSAP(
    () => {
      if (reduced) return
      tl.current = gsap.timeline({ paused: true, defaults: { ease: EASE } })
      build(tl.current)
    },
    { scope, dependencies: [reduced, ...deps] },
  )
  useEffect(() => {
    if (play) tl.current?.restart(true)
    // deps intentionally includes role-keyed rebuilds from callers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, ...deps])
}
