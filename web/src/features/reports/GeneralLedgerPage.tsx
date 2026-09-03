import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Download } from "lucide-react";
import { reportsApi } from "@/api/reports";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney, todayIso } from "@/lib/format";

export function GeneralLedgerPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const [from, setFrom] = useState(todayIso().slice(0, 8) + "01");
  const [to, setTo] = useState(todayIso());

  const { data, isLoading } = useQuery({
    queryKey: ["general-ledger", accountId, from, to],
    queryFn: () => reportsApi.generalLedger(accountId!, from, to),
    enabled: !!accountId,
  });
  const exportMutation = useMutation({ mutationFn: () => reportsApi.exportGeneralLedger(accountId!, from, to) });

  return (
    <div>
      <PageHeader
        title={data ? `Mayor — ${data.accountCode} ${data.accountName}` : "Mayor de cuenta"}
        description="Movimientos y saldo acumulado de la cuenta en el rango seleccionado."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="from">Desde</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to">Hasta</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
          <Download className="h-4 w-4" /> Exportar Excel
        </Button>
      </div>

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Asiento</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Débito</TableHead>
              <TableHead className="text-right">Crédito</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground">Saldo inicial</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(data.openingBalance)}</TableCell>
            </TableRow>
            {data.lines.map((line, i) => (
              <TableRow key={`${line.journalEntryId}-${i}`}>
                <TableCell>{formatDate(line.entryDate)}</TableCell>
                <TableCell>
                  <Link to={`/journal-entries/${line.journalEntryId}`} className="text-primary underline">
                    #{line.entryNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{line.description}</TableCell>
                <TableCell className="text-right font-mono">{Number(line.debit) > 0 ? formatMoney(line.debit) : ""}</TableCell>
                <TableCell className="text-right font-mono">{Number(line.credit) > 0 ? formatMoney(line.credit) : ""}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(line.runningBalance)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell colSpan={5}>Saldo final</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(data.closingBalance)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  );
}
