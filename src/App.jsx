import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { SessionBoot } from "@/features/auth/SessionBoot"
import { LandingGate } from "@/features/landing/LandingGate"
import { LoginPage } from "@/features/auth/LoginPage"
import { SignupPage } from "@/features/auth/SignupPage"
import { AppShell } from "@/features/shell/AppShell"
import { ProtectedRoute } from "@/features/shell/ProtectedRoute"
import { ProjectDirectory } from "@/features/projects/ProjectDirectory"
import { ProjectDetail } from "@/features/projects/ProjectDetail"
import { SettingsPage } from "@/features/settings/SettingsPage"

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="sadicon-theme">
      <TooltipProvider>
        <SessionBoot>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingGate />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/projects" element={<ProjectDirectory />} />
                  <Route path="/projects/:projectId" element={<Navigate to="overview" replace />} />
                  <Route path="/projects/:projectId/:tab" element={<ProjectDetail />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SessionBoot>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  )
}
