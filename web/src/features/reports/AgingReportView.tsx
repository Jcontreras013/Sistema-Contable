import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { reportsApi } from "@/api/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney, todayIso } from "@/lib/format";

export function AgingReportView() {
  const [asOf, setAsOf] = useState(todayIso());
  const { data, isLoading } = useQuery({ queryKey: ["aging-report", asOf], queryFn: () => reportsApi.agingReport(asOf) });
  const exportMutation = useMutation({ mutationFn: () => reportsApi.exportAgingReport(asOf) });

  return (
    <div>
      <div className="mb-4 flex items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="agingAsOf">Corte al</Label>
          <Input id="agingAsOf" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
          <Download className="h-4 w-4" /> Exportar Excel
        </Button>
      </div>
      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : data.lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay saldos pendientes a esta fecha.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Corriente</TableHead>
              <TableHead className="text-right">1-30 días</TableHead>
              <TableHead className="text-right">31-60 días</TableHead>
              <TableHead className="text-right">61-90 días</TableHead>
              <TableHead className="text-right">+90 días</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.lines.map((line) => (
              <TableRow key={line.partyId}>
                <TableCell>{line.partyName}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(line.current)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(line.days1To30)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(line.days31To60)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(line.days61To90)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(line.daysOver90)}</TableCell>
                <TableCell className="text-right font-mono font-semibold">{formatMoney(line.total)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell>Totales</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(data.totalCurrent)}</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(data.totalDays1To30)}</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(data.totalDays31To60)}</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(data.totalDays61To90)}</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(data.totalDaysOver90)}</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(data.grandTotal)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  );
}
