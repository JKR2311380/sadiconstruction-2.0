import { useRef, useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useTheme } from "next-themes"
import {
  BriefcaseBusinessIcon,
  MenuIcon,
  MoonIcon,
  SearchIcon,
  Settings2Icon,
  SunIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { DemoBanner } from "@/shared/DemoBanner"
import { useSessionStore } from "@/store/session"
import { useWorkspaceStore } from "@/store/workspace"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { CommandPalette, useCommandPalette } from "./CommandPalette"
import {
  HelpWidget,
  ScrollProgress,
  ScrollToTop,
  SkipToContent,
} from "./AppUtilities"
import { STAGE_META, StatusDot, stageToken } from "@/shared/StageBadge"

const NAV = [
  { to: "/projects", label: "Projects", icon: BriefcaseBusinessIcon },
  { to: "/settings", label: "Settings", icon: Settings2Icon },
]

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function NavButtons({ onNavigate }) {
  const location = useLocation()
  return (
    <nav className="flex flex-1 flex-col gap-2 p-3">
      {NAV.map((item) => {
        const Icon = item.icon
        const active =
          item.to === "/projects"
            ? location.pathname.startsWith("/projects")
            : location.pathname.startsWith(item.to)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[13px] font-medium transition-[box-shadow,color] duration-160",
              active
                ? "neu-nav-current"
                : "text-muted-foreground hover:text-foreground hover:shadow-neu-flat",
            )}
          >
            <Icon className={active ? "text-primary" : undefined} data-icon="inline-start" />
            {item.label}
            {active ? (
              <span className="ml-auto size-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            ) : null}
          </NavLink>
        )
      })}
    </nav>
  )
}

function ShellFooter() {
  const staff = useSessionStore((state) => state.staff)
  const signOut = useSessionStore((state) => state.signOut)
  const navigate = useNavigate()
  const projects = useWorkspaceStore((state) => state.projects)
  const live = projects.filter((project) => !project.deletedAt)
  const delayed = live.filter((project) => project.stage === "delayed").length
  const active = live.filter((project) => project.stage === "active").length
  const planning = live.filter((project) => project.stage === "planning").length
  const onHold = live.filter((project) => project.stage === "on_hold").length
  const completed = live.filter((project) => project.stage === "completed").length

  const counts = [
    { stage: "active", count: active },
    { stage: "delayed", count: delayed },
    { stage: "planning", count: planning },
    { stage: "on_hold", count: onHold },
    { stage: "completed", count: completed },
  ]

  return (
    <div className="px-5 py-5 text-[11px] leading-relaxed text-muted-foreground">
      <div className="neu-in rounded-2xl px-4 py-3.5">
        Portfolio
        <ul className="mt-2 flex flex-col gap-1.5 font-semibold">
          {counts.map((row) => (
            <li
              key={row.stage}
              className="flex items-center gap-2"
              style={{ color: `var(--status-${stageToken(row.stage)})` }}
            >
              <StatusDot stage={row.stage} />
              <span className="tabular-nums">{row.count}</span>
              {STAGE_META[row.stage].label}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <Avatar className="size-11">
          <AvatarFallback className="bg-transparent text-[11px]">{initials(staff.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-foreground">{staff.fullName}</div>
          <div>{staff.roleLabel}</div>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            void signOut().then(() => navigate("/login"))
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <div className="neu-out grid size-12 place-items-center rounded-2xl" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
          <path d="M2 11 L7 2 L12 11 Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      <span className="text-[15px] font-semibold tracking-tight">Sadiconstruction</span>
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const setDarkMode = useWorkspaceStore((state) => state.setDarkMode)
  const dark = theme === "dark"
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        const next = dark ? "light" : "dark"
        setTheme(next)
        setDarkMode(next === "dark")
      }}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}

export function AppShell() {
  const isMobile = useIsMobile()
  const mainRef = useRef(null)
  const { open, setOpen } = useCommandPalette()
  const [drawer, setDrawer] = useState(false)

  const rail = (
    <div className="flex h-full flex-col">
      <Brand />
      <NavButtons onNavigate={() => setDrawer(false)} />
      <ShellFooter />
    </div>
  )

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SkipToContent />
      <ScrollProgress targetRef={mainRef} />
      <DemoBanner />
      <header className="no-print sticky top-0 z-30 flex items-center gap-2 bg-background/90 px-3 py-2.5 backdrop-blur-sm md:px-5">
        {isMobile ? (
          <Sheet open={drawer} onOpenChange={setDrawer}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[22rem] border-0 bg-background p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              {rail}
            </SheetContent>
          </Sheet>
        ) : null}
        <span className="font-semibold md:hidden">Sadiconstruction</span>
        <button
          type="button"
          className="neu-in ml-auto hidden h-12 min-w-72 items-center gap-2 rounded-full px-5 text-sm text-muted-foreground md:flex"
          onClick={() => setOpen(true)}
        >
          <SearchIcon />
          Search workspace
          <kbd className="ml-auto rounded-md px-1.5 py-0.5 font-readout text-[10px] neu-out-sm">⌘K</kbd>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden"
          aria-label="Open command palette"
          onClick={() => setOpen(true)}
        >
          <SearchIcon />
        </Button>
        <ThemeToggle />
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1720px] flex-1">
        {isMobile ? null : (
          <aside className="no-print sticky top-[3.75rem] flex h-[calc(100svh-3.75rem)] w-[22rem] shrink-0 flex-col">
            {rail}
          </aside>
        )}
        <main
          id="app-main"
          ref={mainRef}
          className="min-h-0 min-w-0 flex-1 overflow-auto px-4 pb-28 md:px-8"
        >
          <Outlet />
        </main>
      </div>
      <ScrollToTop targetRef={mainRef} />
      <HelpWidget />
      <CommandPalette open={open} onOpenChange={setOpen} />
    </div>
  )
}
