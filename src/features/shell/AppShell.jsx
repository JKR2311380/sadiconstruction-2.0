import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  BriefcaseBusinessIcon,
  Building2Icon,
  InboxIcon,
  MenuIcon,
  Settings2Icon,
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

const NAV = [
  { to: "/projects", label: "Projects", icon: BriefcaseBusinessIcon },
  { to: "/reports", label: "Reports", icon: InboxIcon },
  { to: "/contractors", label: "Contractors", icon: Building2Icon },
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
    <nav className="flex flex-1 flex-col gap-0.5 p-2.5">
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
              "flex items-center gap-2.5 border-l-2 border-transparent px-3 py-2 text-[13px] font-medium text-sidebar-foreground/55 transition-colors duration-150",
              "hover:bg-sidebar-accent hover:text-sidebar-foreground",
              active && "border-sidebar-primary bg-sidebar-accent text-sidebar-foreground",
            )}
          >
            <Icon data-icon="inline-start" />
            {item.label}
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

  return (
    <div className="border-t border-sidebar-border px-4 py-4 text-[11px] leading-relaxed text-sidebar-foreground/55">
      Portfolio health
      <div className="mt-0.5 font-semibold text-sidebar-foreground">
        {active} active · {delayed} delayed
      </div>
      <div className="mt-3 flex items-center gap-2.5 border-t border-sidebar-border pt-3">
        <Avatar className="size-7 rounded-none">
          <AvatarFallback className="rounded-none bg-sidebar-accent text-[11px] text-sidebar-foreground">
            {initials(staff.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-sidebar-foreground">{staff.fullName}</div>
          <div>{staff.roleLabel}</div>
        </div>
        <Button
          variant="ghost"
          size="xs"
          className="rounded-none text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={() => {
            signOut()
            navigate("/login")
          }}
        >
          Log out
        </Button>
      </div>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4">
      <div className="grid size-7 place-items-center bg-primary" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 11 L7 2 L12 11 Z" stroke="#111" strokeWidth="1.5" />
        </svg>
      </div>
      <span className="font-heading text-[15px] text-sidebar-foreground">Sadiconstruction</span>
    </div>
  )
}

export function AppShell() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <DemoBanner />
        <header className="flex items-center gap-2 bg-sidebar px-3 py-2 text-sidebar-foreground">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-none text-sidebar-foreground">
                <MenuIcon />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[232px] bg-sidebar p-0 text-sidebar-foreground">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex h-full flex-col">
                <Brand />
                <NavButtons />
                <ShellFooter />
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-heading text-sm">Sadiconstruction</span>
        </header>
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <DemoBanner />
      <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-[232px_1fr] shadow-[0_0_0_1px_#000]">
        <aside className="flex flex-col bg-sidebar text-sidebar-foreground">
          <Brand />
          <NavButtons />
          <ShellFooter />
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
