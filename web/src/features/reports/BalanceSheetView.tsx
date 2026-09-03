import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { reportsApi } from "@/api/reports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatMoney, todayIso } from "@/lib/format";
import type { BalanceSheetLine } from "@/types/reports";

function Section({ title, lines, total }: { title: string; lines: BalanceSheetLine[]; total: string }) {
  const byParent = new Map<string, number>();
  lines.forEach((l, i) => byParent.set(l.accountId, i));
  const depthOf = (line: BalanceSheetLine): number => {
    let depth = 0;
    let current: BalanceSheetLine | undefined = line;
    while (current?.parentId) {
      current = lines.find((l) => l.accountId === current!.parentId);
      depth += 1;
    }
    return depth;
  };

  return (
    <div className="mb-6">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <Table>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.accountId}>
              <TableCell style={{ paddingLeft: `${12 + depthOf(line) * 20}px` }}>
                <span className="font-mono text-xs text-muted-foreground">{line.code}</span> {line.name}
              </TableCell>
              <TableCell className="text-right font-mono">{formatMoney(line.balance)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="font-semibold">
            <TableCell>Total {title.toLowerCase()}</TableCell>
            <TableCell className="text-right font-mono">{formatMoney(total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

export function BalanceSheetView() {
  const [asOf, setAsOf] = useState(todayIso());
  const { data, isLoading } = useQuery({ queryKey: ["balance-sheet", asOf], queryFn: () => reportsApi.balanceSheet(asOf) });
  const exportMutation = useMutation({ mutationFn: () => reportsApi.exportBalanceSheet(asOf) });

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
        <>
          <div className="mb-4 flex items-center gap-2">
            <Badge variant={data.isBalanced ? "success" : "destructive"}>
              {data.isBalanced ? "Cuadrado: Activo = Pasivo + Patrimonio" : "No cuadra — revisar datos"}
            </Badge>
          </div>
          <Section title="Activo" lines={data.assets} total={data.totalAssets} />
          <Section title="Pasivo" lines={data.liabilities} total={data.totalLiabilities} />
          <Section title="Patrimonio" lines={data.equity} total={data.totalEquity} />
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <span className="font-medium">Utilidad del ejercicio (no cerrada):</span> {formatMoney(data.currentYearEarnings)}
            <p className="mt-1 text-xs text-muted-foreground">
              Calculada en vivo desde ingresos y gastos del año a la fecha; no proviene de un asiento de cierre contable.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
