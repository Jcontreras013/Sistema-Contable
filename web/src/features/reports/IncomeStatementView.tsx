import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { reportsApi } from "@/api/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatMoney, todayIso } from "@/lib/format";

export function IncomeStatementView() {
  const [from, setFrom] = useState(todayIso().slice(0, 8) + "01");
  const [to, setTo] = useState(todayIso());
  const { data, isLoading } = useQuery({
    queryKey: ["income-statement", from, to],
    queryFn: () => reportsApi.incomeStatement(from, to),
  });
  const exportMutation = useMutation({ mutationFn: () => reportsApi.exportIncomeStatement(from, to) });

  return (
    <div>
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
          <TableBody>
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell colSpan={2}>Ingresos</TableCell>
            </TableRow>
            {data.income.map((line) => (
              <TableRow key={line.accountId}>
                <TableCell className="pl-6">{line.name}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(line.amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell>Total ingresos</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(data.totalIncome)}</TableCell>
            </TableRow>

            <TableRow className="bg-muted/50 font-semibold">
              <TableCell colSpan={2}>Gastos</TableCell>
            </TableRow>
            {data.expenses.map((line) => (
              <TableRow key={line.accountId}>
                <TableCell className="pl-6">{line.name}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(line.amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell>Total gastos</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(data.totalExpenses)}</TableCell>
            </TableRow>

            <TableRow className="text-base font-bold">
              <TableCell>Utilidad neta</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(data.netIncome)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  );
}
