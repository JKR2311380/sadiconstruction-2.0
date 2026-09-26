import { useEffect } from "react"
import { useSessionStore } from "@/store/session"

export function SessionBoot({ children }) {
  const hydrate = useSessionStore((state) => state.hydrate)

  useEffect(() => {
    let done = false
    const run = () => {
      if (done) return
      done = true
      void hydrate()
    }
    if (useSessionStore.persist.hasHydrated()) {
      run()
      return undefined
    }
    const unsub = useSessionStore.persist.onFinishHydration(run)
    const timeoutId = window.setTimeout(run, 400)
    return () => {
      unsub?.()
      window.clearTimeout(timeoutId)
    }
  }, [hydrate])

  return children
}
