import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { can } from "@/lib/permissions"
import { STAGE_META } from "@/shared/StageBadge"
import { useSessionStore } from "@/store/session"
import { useWorkspaceStore } from "@/store/workspace"

const PRIORITIES = [
  { value: "1", label: "High" },
  { value: "2", label: "Medium" },
  { value: "3", label: "Low" },
]

/** Mounted only while open, so the form always starts from the saved project. */
export function ProjectDetailsDialog({ project, onClose }) {
  const navigate = useNavigate()
  const role = useSessionStore((state) => state.staff?.role)
  const updateProject = useWorkspaceStore((state) => state.updateProject)
  const archiveProject = useWorkspaceStore((state) => state.archiveProject)
  const [form, setForm] = useState({
    name: project.name,
    client: project.client || "",
    site: project.site || "",
    stage: project.stage,
    priority: String(project.priority === 1 || project.priority === 3 ? project.priority : 2),
    budget: project.budget == null ? "" : String(project.budget),
    startDate: project.startDate || "",
    targetEndDate: project.targetEndDate || "",
  })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setError("")
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    const name = form.name.trim()
    const budget = form.budget.trim() === "" ? null : Number(form.budget)
    if (!name) return setError("Enter a project name.")
    if (budget != null && (!Number.isFinite(budget) || budget < 0)) {
      return setError("Budget must be a number of zero or more. Leave it blank if it is not set.")
    }
    if (form.startDate && form.targetEndDate && form.targetEndDate < form.startDate) {
      return setError("Target end date cannot be before the start date.")
    }
    setSaving(true)
    try {
      await updateProject(project.id, {
        name,
        client: form.client.trim(),
        site: form.site.trim(),
        stage: form.stage,
        priority: Number(form.priority),
        budget,
        startDate: form.startDate || null,
        targetEndDate: form.targetEndDate || null,
      })
      toast.success("Project details saved")
      onClose()
    } catch (saveError) {
      setError(saveError.message || "Could not save the project details. Try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive() {
    setSaving(true)
    try {
      await archiveProject(project.id)
      toast.success(`Archived ${project.code}`)
      navigate("/projects", { replace: true })
    } catch (archiveError) {
      setError(archiveError.message || "Could not archive the project. Try again.")
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open && !saving) onClose()
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Project details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-name">Name</FieldLabel>
                <Input
                  id="edit-name"
                  value={form.name}
                  onChange={(event) => change("name", event.target.value)}
                  maxLength={120}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-client">Client / owner</FieldLabel>
                <Input
                  id="edit-client"
                  value={form.client}
                  onChange={(event) => change("client", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-site">Site</FieldLabel>
                <Input
                  id="edit-site"
                  value={form.site}
                  onChange={(event) => change("site", event.target.value)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Stage</FieldLabel>
                  <Select value={form.stage} onValueChange={(value) => change("stage", value)}>
                    <SelectTrigger className="w-full" aria-label="Stage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.entries(STAGE_META).map(([id, meta]) => (
                          <SelectItem key={id} value={id}>
                            {meta.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Priority</FieldLabel>
                  <Select value={form.priority} onValueChange={(value) => change("priority", value)}>
                    <SelectTrigger className="w-full" aria-label="Priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {PRIORITIES.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-start">Start date</FieldLabel>
                  <Input
                    id="edit-start"
                    type="date"
                    value={form.startDate}
                    onChange={(event) => change("startDate", event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-end">Target end date</FieldLabel>
                  <Input
                    id="edit-end"
                    type="date"
                    value={form.targetEndDate}
                    onChange={(event) => change("targetEndDate", event.target.value)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="edit-budget">Budget (PHP)</FieldLabel>
                <Input
                  id="edit-budget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Not set"
                  value={form.budget}
                  onChange={(event) => change("budget", event.target.value)}
                />
              </Field>
            </FieldGroup>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              {can(role, "archiveProject") ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="mr-auto text-destructive"
                  disabled={saving}
                  onClick={() => setConfirmArchive(true)}
                >
                  Archive project
                </Button>
              ) : null}
              <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={`Archive ${project.name.trim() || project.code}?`}
        description="The project leaves the directory for every Staff Member. Its data is kept, but there is no restore screen yet: bringing it back needs an Admin with database access."
        confirmLabel="Archive project"
        onConfirm={() => void handleArchive()}
      />
    </>
  )
}
