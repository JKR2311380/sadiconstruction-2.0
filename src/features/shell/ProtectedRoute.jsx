import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useEffect } from "react"
import { WorkspaceSkeleton } from "@/components/NeuSkeleton"
import { useSessionStore } from "@/store/session"
import { useWorkspaceStore } from "@/store/workspace"

export function ProtectedRoute() {
  const staff = useSessionStore((state) => state.staff)
  const status = useSessionStore((state) => state.status)
  const hydrateWorkspace = useWorkspaceStore((state) => state.hydrate)
  const workspaceStatus = useWorkspaceStore((state) => state.hydrateStatus)
  const location = useLocation()

  useEffect(() => {
    if (status === "ready" && staff) {
      void hydrateWorkspace()
    }
  }, [status, staff, hydrateWorkspace])

  if (status !== "ready") {
    return <WorkspaceSkeleton />
  }

  if (!staff) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (workspaceStatus !== "ready") {
    return <WorkspaceSkeleton />
  }

  return <Outlet />
}
