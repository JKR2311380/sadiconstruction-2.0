import { Navigate } from "react-router-dom"
import LandingPage from "../../LandingPage"
import { useSessionStore } from "@/store/session"

export function LandingGate() {
  const staff = useSessionStore((state) => state.staff)
  const status = useSessionStore((state) => state.status)

  if (status !== "ready") {
    return <div className="min-h-svh bg-espresso" aria-busy="true" />
  }

  if (staff) {
    return <Navigate to="/projects" replace />
  }

  return <LandingPage />
}
