import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { LandingGate } from "@/features/landing/LandingGate"
import { LoginPage } from "@/features/auth/LoginPage"
import { RequestAccessPage } from "@/features/auth/RequestAccessPage"
import { AppShell } from "@/features/shell/AppShell"
import { ProtectedRoute } from "@/features/shell/ProtectedRoute"
import { ProjectDirectory } from "@/features/projects/ProjectDirectory"
import { ProjectDetail } from "@/features/projects/ProjectDetail"
import { ReportsPage } from "@/features/reports/ReportsPage"
import { ContractorsPage } from "@/features/contractors/ContractorsPage"
import { SettingsPage } from "@/features/settings/SettingsPage"

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="sadicon-theme">
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingGate />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/request-access" element={<RequestAccessPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/projects" element={<ProjectDirectory />} />
                <Route path="/projects/:projectId" element={<Navigate to="overview" replace />} />
                <Route path="/projects/:projectId/:tab" element={<ProjectDetail />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/contractors" element={<ContractorsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  )
}
