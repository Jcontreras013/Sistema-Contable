import { useQuery } from "@tanstack/react-query";
import { creditDebitNotesApi } from "@/api/creditDebitNotes";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format";

export function CreditDebitNoteHistory({ invoiceId }: { invoiceId: string }) {
  const { data: notes, isLoading } = useQuery({
    queryKey: ["credit-debit-notes", invoiceId],
    queryFn: () => creditDebitNotesApi.listByInvoice(invoiceId),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando notas...</p>;
  if (!notes || notes.length === 0) return <p className="text-sm text-muted-foreground">Sin notas de crédito/débito emitidas.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Correlativo</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {notes.map((n) => (
          <TableRow key={n.id}>
            <TableCell className="font-mono">{n.noteNumber}</TableCell>
            <TableCell>{n.type === "CREDIT" ? "Nota de crédito" : "Nota de débito"}</TableCell>
            <TableCell className="font-mono text-xs">{n.correlativo ?? "—"}</TableCell>
            <TableCell>{formatDate(n.issueDate)}</TableCell>
            <TableCell>{n.reason}</TableCell>
            <TableCell className="text-right font-mono">{formatMoney(n.amountInBase)}</TableCell>
            <TableCell><StatusBadge status={n.status} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
