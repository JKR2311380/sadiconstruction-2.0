import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "next-themes"
import {
  BriefcaseBusinessIcon,
  LogOutIcon,
  MoonIcon,
  PlusIcon,
  Settings2Icon,
  SunIcon,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useSessionStore } from "@/store/session"
import { useWorkspaceStore } from "@/store/workspace"

export function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const signOut = useSessionStore((state) => state.signOut)
  const setDarkMode = useWorkspaceStore((state) => state.setDarkMode)
  const projects = useWorkspaceStore((state) => state.projects)
  const liveProjects = projects.filter((project) => !project.deletedAt)

  function go(path) {
    onOpenChange(false)
    navigate(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="neu-out sm:max-w-lg">
      <CommandInput placeholder="Search projects, jump, or run a command…" />
      <CommandList>
        <CommandEmpty>Nothing matches that search.</CommandEmpty>
        <CommandGroup heading="Go">
          <CommandItem onSelect={() => go("/projects")}>
            <BriefcaseBusinessIcon />
            Projects
            <CommandShortcut>G P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings2Icon />
            Settings
            <CommandShortcut>G S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/projects?new=1")}>
            <PlusIcon />
            Add Project
          </CommandItem>
        </CommandGroup>
        {liveProjects.length ? (
          <CommandGroup heading="Projects">
            {liveProjects.slice(0, 12).map((project) => (
              <CommandItem
                key={project.id}
                value={`${project.name} ${project.code} ${project.client}`}
                onSelect={() => go(`/projects/${project.id}/overview`)}
              >
                <BriefcaseBusinessIcon />
                <span className="truncate">{project.name}</span>
                <span className="ml-auto font-readout text-[11px] text-muted-foreground">
                  {project.code}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        <CommandSeparator />
        <CommandGroup heading="Workspace">
          <CommandItem
            onSelect={() => {
              const next = theme === "dark" ? "light" : "dark"
              setTheme(next)
              setDarkMode(next === "dark")
              onOpenChange(false)
            }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            Toggle dark mode
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              void signOut().then(() => navigate("/login"))
            }}
          >
            <LogOutIcon />
            Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return { open, setOpen }
}
