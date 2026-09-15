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
import { can } from "@/lib/permissions"
import { useSessionStore } from "@/store/session"
import { useWorkspaceStore } from "@/store/workspace"

const MAX_BYTES = 50 * 1024 * 1024

export function DocumentsPanel({ projectId }) {
  const role = useSessionStore((state) => state.staff?.role)
  const docs = useWorkspaceStore((state) =>
    (state.documentsByProject[projectId] || []).filter((doc) => !doc.deletedAt),
  )
  const addDocument = useWorkspaceStore((state) => state.addDocument)
  const removeDocument = useWorkspaceStore((state) => state.removeDocument)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [contentType, setContentType] = useState("Engineering")
  const [byteSize, setByteSize] = useState(0)

  function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_BYTES) {
      toast.error("File exceeds the 50 MB Free-tier maximum.")
      return
    }
    setTitle((current) => current || file.name)
    setByteSize(file.size)
  }

  function handleAdd(event) {
    event.preventDefault()
    addDocument(projectId, { title, contentType, byteSize })
    toast.success("Document recorded (metadata only in this prototype)")
    setOpen(false)
    setTitle("")
    setContentType("Engineering")
    setByteSize(0)
  }

  return (
    <div className="flex flex-col gap-3">
      {can(role, "uploadDocuments") ? (
        <div className="flex justify-end">
          <Button type="button" variant="secondary" className="rounded-none" onClick={() => setOpen(true)}>
            Upload document
          </Button>
        </div>
      ) : null}

      {docs.length === 0 ? (
        <Empty className="rounded-none border border-dashed border-border">
          <EmptyHeader>
            <EmptyTitle>No documents on this Project</EmptyTitle>
            <EmptyDescription>
              Metadata is stored locally. Bytes will go to Storage when the backend is wired. Max 50 MB per file.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table className="border border-border bg-card text-[13px]">
          <TableHeader>
            <TableRow className="bg-[#ECEEF0] hover:bg-[#ECEEF0]">
              <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Document</TableHead>
              <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Type</TableHead>
              <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Updated</TableHead>
              {can(role, "uploadDocuments") ? <TableHead className="w-24" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>{doc.contentType}</TableCell>
                <TableCell>{doc.updatedAt}</TableCell>
                {can(role, "uploadDocuments") ? (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-none text-destructive"
                      onClick={() => {
                        removeDocument(projectId, doc.id)
                        toast.success("Document archived")
                      }}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="doc-file">File</FieldLabel>
                <Input id="doc-file" type="file" onChange={handleFile} className="rounded-none" />
                <FieldDescription>Prototype keeps name and size only. 50 MB cap.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="doc-title">Title</FieldLabel>
                <Input id="doc-title" value={title} onChange={(event) => setTitle(event.target.value)} required className="rounded-none" />
              </Field>
              <Field>
                <FieldLabel htmlFor="doc-type">Type</FieldLabel>
                <Input id="doc-type" value={contentType} onChange={(event) => setContentType(event.target.value)} className="rounded-none" />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-none" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="secondary" className="rounded-none">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
