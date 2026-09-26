import { Navigate, useNavigate, useParams } from "react-router-dom"
import { useEffect } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { StageBadge } from "@/shared/StageBadge"
import { useWorkspaceStore } from "@/store/workspace"
import { OverviewPanel } from "./OverviewPanel"
import { PersonnelPanel } from "./PersonnelPanel"
import { DocumentsPanel } from "@/features/documents/DocumentsPanel"
import { BoqPanel } from "@/features/boq/BoqPanel"
import { SchedulingPanel } from "@/features/scheduling"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "personnel", label: "Key Personnel" },
  { id: "documents", label: "Documents" },
  { id: "boq", label: "Bill of Quantities" },
  { id: "scheduling", label: "Scheduling" },
]

export function ProjectDetail() {
  const { projectId, tab = "overview" } = useParams()
  const navigate = useNavigate()
  const project = useWorkspaceStore((state) =>
    state.projects.find((row) => row.id === projectId && !row.deletedAt),
  )
  const ensureNetwork = useWorkspaceStore((state) => state.ensureNetwork)
  const refreshProjectRecords = useWorkspaceStore((state) => state.refreshProjectRecords)

  useEffect(() => {
    if (projectId) {
      void ensureNetwork(projectId)
      void refreshProjectRecords(projectId)
    }
  }, [projectId, ensureNetwork, refreshProjectRecords])

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  const activeTab = TABS.some((item) => item.id === tab) ? tab : "overview"

  return (
    <div className="flex min-h-0 flex-1 flex-col py-4">
      <header className="mb-4">
        <Button
          variant="link"
          className="mb-2 h-auto px-0 text-xs text-muted-foreground"
          onClick={() => navigate("/projects")}
        >
          ← All projects
        </Button>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-[22px] font-normal">{project.name}</h1>
            <p className="text-xs text-muted-foreground">
              {project.code} · {project.client} · Updated{" "}
              {new Date(project.updatedAt).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <StageBadge stage={project.stage} />
          </div>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={(value) => navigate(`/projects/${project.id}/${value}`)}
          className="gap-0"
        >
          <TabsList variant="line" className="h-auto w-full justify-start">
            {TABS.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="px-4 py-2.5 text-[13px]"
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      {activeTab === "scheduling" ? (
        <SchedulingPanel projectId={project.id} />
      ) : (
        <div className="min-h-0 flex-1 pb-8">
          {activeTab === "overview" ? <OverviewPanel project={project} /> : null}
          {activeTab === "personnel" ? <PersonnelPanel projectId={project.id} /> : null}
          {activeTab === "documents" ? <DocumentsPanel projectId={project.id} /> : null}
          {activeTab === "boq" ? <BoqPanel projectId={project.id} /> : null}
        </div>
      )}
    </div>
  )
}
