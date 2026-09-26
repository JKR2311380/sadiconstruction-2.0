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
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BOQ_CSV_TEMPLATE } from "@/data/mock/csv"
import { can } from "@/lib/permissions"
import { formatPhp } from "@/lib/money"
import { useSessionStore } from "@/store/session"
import { boqGrandTotal, useWorkspaceStore } from "@/store/workspace"

export function BoqPanel({ projectId }) {
  const role = useSessionStore((state) => state.staff?.role)
  const boq = useWorkspaceStore((state) => state.boqByProject[projectId])
  const replaceBoqFromCsv = useWorkspaceStore((state) => state.replaceBoqFromCsv)
  const [open, setOpen] = useState(false)
  const [csv, setCsv] = useState(BOQ_CSV_TEMPLATE)
  const [error, setError] = useState("")

  const total = boqGrandTotal(boq)

  async function handleReplace(event) {
    event.preventDefault()
    const result = await replaceBoqFromCsv(projectId, csv)
    if (!result.ok) {
      setError(result.error)
      return
    }
    toast.success("BOQ replaced · Phase Roots synced")
    setOpen(false)
    setError("")
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          View-only · {boq ? <>Grand total <strong className="text-foreground">{formatPhp(total)}</strong></> : "No approved BOQ"}
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
              Scheduling cannot seed Phase Roots until a Staff Member replaces the BOQ via CSV. The product UI never edits quantities.
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Replace BOQ from CSV</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReplace} className="flex flex-col gap-4">
            <FieldGroup>
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
                  className="min-h-40 font-readout text-xs"
                />
                <FieldDescription>
                  Columns: phase_code, phase_name, item_code, description, unit, quantity, rate, amount.
                  {error ? ` ${error}` : ""}
                </FieldDescription>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Replace BOQ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BoqPhaseRows({ phase }) {
  const phaseTotal = phase.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0)
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
