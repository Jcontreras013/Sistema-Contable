import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { reportsApi } from "@/api/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney, todayIso } from "@/lib/format";

export function TrialBalanceView() {
  const [asOf, setAsOf] = useState(todayIso());
  const { data, isLoading } = useQuery({ queryKey: ["trial-balance", asOf], queryFn: () => reportsApi.trialBalance(asOf) });
  const exportMutation = useMutation({ mutationFn: () => reportsApi.exportTrialBalance(asOf) });

  return (
    <div>
      <div className="mb-4 flex items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="asOf">Corte al</Label>
          <Input id="asOf" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
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
              <TableHead>Código</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead className="text-right">Débito</TableHead>
              <TableHead className="text-right">Crédito</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.lines.map((line) => (
              <TableRow key={line.accountId}>
                <TableCell className="font-mono">{line.code}</TableCell>
                <TableCell>{line.name}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(line.debit)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(line.credit)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell colSpan={2}>Totales</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(data.totalDebit)}</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(data.totalCredit)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  );
}
