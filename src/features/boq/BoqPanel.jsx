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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BOQ_CSV_TEMPLATE, parseBoqCsv } from "@/data/mock/csv"
import { can } from "@/lib/permissions"
import { formatPhp } from "@/lib/money"
import { useSessionStore } from "@/store/session"
import { boqGrandTotal, useWorkspaceStore } from "@/store/workspace"

export function BoqPanel({ projectId }) {
  const role = useSessionStore((state) => state.staff?.role)
  const boq = useWorkspaceStore((state) => state.boqByProject[projectId])
  const replaceBoqFromCsv = useWorkspaceStore(
    (state) => state.replaceBoqFromCsv,
  )
  const [open, setOpen] = useState(false)
  const [csv, setCsv] = useState(BOQ_CSV_TEMPLATE)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  const total = boqGrandTotal(boq)

  async function handleReplace(event) {
    event.preventDefault()
    if (!preview) {
      const parsed = parseBoqCsv(csv)
      if (!parsed.ok) {
        setError(parsed.error)
        return
      }
      setPreview(parsed)
      setError("")
      return
    }
    if (saving) return
    setSaving(true)
    try {
      const result = await replaceBoqFromCsv(projectId, csv)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success("BOQ replaced / Phase Roots synced")
      setOpen(false)
      setPreview(null)
      setError("")
    } catch (error) {
      setError(error.message || "Could not replace the BOQ. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          View-only ·{" "}
          {boq ? (
            <>
              Grand total{" "}
              <strong className="text-foreground">{formatPhp(total)}</strong>
            </>
          ) : (
            "No approved BOQ"
          )}
        </p>
        {can(role, "seedBoq") ? (
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            Replace via CSV
          </Button>
        ) : null}
      </div>

      {!boq ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No approved BOQ</EmptyTitle>
            <EmptyDescription>
              Scheduling cannot seed Phase Roots until a Staff Member replaces
              the BOQ via CSV. The product UI never edits quantities.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table className="text-[13px] tabular-nums">
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boq.phases.map((phase) => (
              <BoqPhaseRows key={phase.id} phase={phase} />
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!saving) {
            setOpen(next)
            setPreview(null)
            setError("")
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Replace BOQ from CSV</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReplace} className="flex flex-col gap-4">
            {!preview ? (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="boq-file">Choose a CSV file</FieldLabel>
                  <Input
                    id="boq-file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={async (event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      try {
                        setCsv(await file.text())
                        setPreview(null)
                        setError("")
                      } catch {
                        setError("Could not read the file. Choose it again.")
                      }
                    }}
                  />
                </Field>
                <Field data-invalid={error ? true : undefined}>
                  <FieldLabel htmlFor="boq-csv">CSV</FieldLabel>
                  <Textarea
                    id="boq-csv"
                    value={csv}
                    aria-invalid={Boolean(error)}
                    onChange={(event) => {
                      setCsv(event.target.value)
                      setError("")
                    }}
                    className="min-h-40 font-readout text-sm"
                  />
                  <FieldDescription>
                    Columns: phase_code, phase_name, item_code, description,
                    unit, quantity, rate, amount.
                    {error ? ` ${error}` : ""}
                  </FieldDescription>
                </Field>
              </FieldGroup>
            ) : (
              <section
                aria-label="BOQ replacement preview"
                className="flex flex-col gap-3"
              >
                <p className="text-sm font-medium">
                  {preview.phases.length} phases /{" "}
                  {preview.phases.reduce(
                    (sum, phase) => sum + phase.lines.length,
                    0,
                  )}{" "}
                  line items / {formatPhp(boqGrandTotal(preview))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {boq
                    ? `This replaces the current BOQ of ${formatPhp(total)}. `
                    : "This creates the approved BOQ. "}
                  Removed phases and their schedule activities will be deleted.
                  Retained phases keep their activities.
                </p>
                <div className="max-h-64 overflow-auto rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phase / item</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.phases.map((phase) => (
                        <BoqPreviewRows key={phase.id} phase={phase} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setOpen(false)
                  setPreview(null)
                }}
              >
                Cancel
              </Button>
              {preview ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => setPreview(null)}
                >
                  Edit CSV
                </Button>
              ) : null}
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Replacing..."
                  : preview
                    ? "Confirm replacement"
                    : "Preview CSV"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BoqPhaseRows({ phase }) {
  const phaseTotal = phase.lines.reduce(
    (sum, line) => sum + Number(line.amount || 0),
    0,
  )
  return (
    <>
      <TableRow className="bg-muted font-semibold hover:bg-muted">
        <TableCell colSpan={4}>
          Part {phase.code} – {phase.name}
        </TableCell>
        <TableCell className="text-right">{formatPhp(phaseTotal)}</TableCell>
      </TableRow>
      {phase.lines.map((line) => (
        <TableRow key={line.id}>
          <TableCell>{line.itemCode}</TableCell>
          <TableCell>{line.description}</TableCell>
          <TableCell>{line.unit}</TableCell>
          <TableCell>{Number(line.quantity).toLocaleString("en-PH")}</TableCell>
          <TableCell className="text-right">{formatPhp(line.amount)}</TableCell>
        </TableRow>
      ))}
    </>
  )
}

function BoqPreviewRows({ phase }) {
  return (
    <>
      <TableRow className="bg-muted font-medium">
        <TableCell colSpan={2}>
          {phase.code} - {phase.name}
        </TableCell>
        <TableCell className="text-right">
          {formatPhp(phase.lines.reduce((sum, line) => sum + line.amount, 0))}
        </TableCell>
      </TableRow>
      {phase.lines.map((line) => (
        <TableRow key={line.id}>
          <TableCell>{line.itemCode}</TableCell>
          <TableCell>{line.description}</TableCell>
          <TableCell className="text-right">{formatPhp(line.amount)}</TableCell>
        </TableRow>
      ))}
    </>
  )
}
