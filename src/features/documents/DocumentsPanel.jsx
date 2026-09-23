import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { getDocumentUrl, isSupabaseConfigured, MAX_DOCUMENT_BYTES } from "@/data/documents"
import { can } from "@/lib/permissions"
import { useSessionStore } from "@/store/session"
import { useWorkspaceStore } from "@/store/workspace"

const EMPTY_DOCS = []

export function DocumentsPanel({ projectId }) {
  const role = useSessionStore((state) => state.staff?.role)
  const allDocs = useWorkspaceStore((state) => state.documentsByProject[projectId] ?? EMPTY_DOCS)
  const docs = allDocs.filter((doc) => !doc.deletedAt)
  const addDocument = useWorkspaceStore((state) => state.addDocument)
  const removeDocument = useWorkspaceStore((state) => state.removeDocument)
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [title, setTitle] = useState("")
  const [contentType, setContentType] = useState("Engineering")
  const [file, setFile] = useState(null)
  const [pendingArchive, setPendingArchive] = useState(null)

  function resetForm() {
    setTitle("")
    setContentType("Engineering")
    setFile(null)
  }

  function handleFile(event) {
    const next = event.target.files?.[0]
    if (!next) return
    if (next.size > MAX_DOCUMENT_BYTES) {
      toast.error("File exceeds the 50 MB Free-tier maximum.")
      event.target.value = ""
      return
    }
    setFile(next)
    setTitle((current) => current || next.name)
  }

  async function handleAdd(event) {
    event.preventDefault()
    if (!file) {
      toast.error("Choose a file to upload.")
      return
    }
    setPending(true)
    try {
      await addDocument(projectId, { title, contentType, file })
      toast.success(
        isSupabaseConfigured
          ? "Document uploaded"
          : "Document recorded locally (set VITE_SUPABASE_* to store bytes)",
      )
      setOpen(false)
      resetForm()
    } catch (error) {
      toast.error(error.message || "Upload failed.")
    } finally {
      setPending(false)
    }
  }

  async function handleDownload(doc) {
    if (!isSupabaseConfigured || !doc.storagePath) {
      toast.error("No stored file in this mock session.")
      return
    }
    try {
      const url = await getDocumentUrl(doc)
      if (!url) {
        toast.error("Could not open this document.")
        return
      }
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (error) {
      toast.error(error.message || "Could not open this document.")
    }
  }

  async function handleArchive(doc) {
    try {
      await removeDocument(projectId, doc.id)
      toast.success("Document archived")
    } catch (error) {
      toast.error(error.message || "Could not archive this document.")
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {can(role, "uploadDocuments") ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setOpen(true)}>
            Upload document
          </Button>
        </div>
      ) : null}

      {docs.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No documents on this Project</EmptyTitle>
            <EmptyDescription>
              Files go to private Storage at {"{project_id}/{doc_id}"}. Max 50 MB per file.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Updated</TableHead>
              {can(role, "uploadDocuments") ? <TableHead className="w-40" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>{doc.contentType}</TableCell>
                <TableCell>{doc.updatedAt}</TableCell>
                {can(role, "uploadDocuments") ? (
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDownload(doc)}
                    >
                      Open
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setPendingArchive(doc)}
                    >
                      Archive
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => void handleAdd(event)} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="doc-file">File</FieldLabel>
                <Input id="doc-file" type="file" required onChange={handleFile} />
                <FieldDescription>Private bucket. 50 MB cap.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="doc-title">Title</FieldLabel>
                <Input id="doc-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="doc-type">Type</FieldLabel>
                <Input id="doc-type" value={contentType} onChange={(event) => setContentType(event.target.value)} />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending || !file}>
                {pending ? "Uploading…" : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingArchive)}
        onOpenChange={(next) => {
          if (!next) setPendingArchive(null)
        }}
        title="Archive this document?"
        description={
          pendingArchive
            ? `${pendingArchive.title} will be soft-deleted from this Project. The stored file is not restored from this screen.`
            : ""
        }
        confirmLabel="Archive"
        onConfirm={() => {
          if (pendingArchive) void handleArchive(pendingArchive)
          setPendingArchive(null)
        }}
      />
    </div>
  )
}
