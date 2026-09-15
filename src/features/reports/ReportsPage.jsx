import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useWorkspaceStore } from "@/store/workspace"

export function ReportsPage() {
  const reports = useWorkspaceStore((state) => state.reports)

  return (
    <div className="overflow-auto p-[22px]">
      <h1 className="font-heading text-2xl font-normal">Reports</h1>
      <p className="mb-[18px] text-xs text-muted-foreground">
        Inbox-style project mail · stub until the Reports epic
      </p>
      <Table className="border border-border bg-card text-[13px]">
        <TableHeader>
          <TableRow className="bg-[#ECEEF0] hover:bg-[#ECEEF0]">
            <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">From</TableHead>
            <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Subject</TableHead>
            <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Type</TableHead>
            <TableHead className="text-[10px] tracking-wider text-muted-foreground uppercase">Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.from}</TableCell>
              <TableCell className="font-medium">{row.subject}</TableCell>
              <TableCell>
                <Badge variant="outline" className="rounded-none">
                  {row.type}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(row.received).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
