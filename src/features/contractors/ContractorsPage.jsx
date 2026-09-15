import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useWorkspaceStore } from "@/store/workspace"

export function ContractorsPage() {
  const contractors = useWorkspaceStore((state) => state.contractors)

  return (
    <div className="overflow-auto p-[22px]">
      <h1 className="font-heading text-2xl font-normal">Contractors</h1>
      <p className="mb-[18px] text-xs text-muted-foreground">Registry · stub until the Contractors epic</p>
      <Table className="border border-border bg-card text-[13px]">
        <TableHeader>
          <TableRow className="bg-[#ECEEF0] hover:bg-[#ECEEF0]">
            <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Contractor</TableHead>
            <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Specialty</TableHead>
            <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Certifications</TableHead>
            <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Current</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contractors.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.specialty}</TableCell>
              <TableCell>{row.certifications}</TableCell>
              <TableCell>{row.currentProject}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
