import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useSessionStore } from "@/store/session"

export function ProtectedRoute() {
  const staff = useSessionStore((state) => state.staff)
  const location = useLocation()

  if (!staff) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
