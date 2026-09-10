import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { periodClosesApi } from "@/api/periodCloses";
import { ApiRequestError } from "@/api/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney, todayIso } from "@/lib/format";

export function PeriodClosePage() {
  const queryClient = useQueryClient();
  const { data: closes, isLoading } = useQuery({ queryKey: ["period-closes"], queryFn: periodClosesApi.list });
  const [periodEndDate, setPeriodEndDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const closeMutation = useMutation({
    mutationFn: () => periodClosesApi.close(periodEndDate),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["period-closes"] });
      setError(null);
      setMessage(`Periodo cerrado al ${formatDate(result.periodEndDate)}. Utilidad trasladada a Utilidades Retenidas: ${formatMoney(result.netIncome)}.`);
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiRequestError ? err.message : "No se pudo cerrar el periodo");
    },
  });

  return (
    <div>
      <PageHeader
        title="Cierre contable"
        description="Traslada el resultado de ingresos y gastos acumulado a Utilidades Retenidas y bloquea el periodo cerrado contra nuevos asientos."
      />

      <Card className="mb-6 max-w-lg">
        <CardContent className="pt-6">
          <form
            className="flex flex-wrap items-end gap-4"
            onSubmit={(e) => { e.preventDefault(); closeMutation.mutate(); }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="periodEndDate">Fecha de corte</Label>
              <Input
                id="periodEndDate"
                type="date"
                required
                value={periodEndDate}
                onChange={(e) => setPeriodEndDate(e.target.value)}
              />
            </div>
            <Button type="submit" variant="destructive" disabled={closeMutation.isPending}>
              {closeMutation.isPending ? "Cerrando..." : "Cerrar periodo"}
            </Button>
          </form>
          {message && <p className="mt-3 text-sm text-success">{message}</p>}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <p className="mt-3 text-xs text-muted-foreground">
            Esta acción es irreversible: una vez cerrado, no se pueden registrar ni facturas, ni gastos,
            ni asientos manuales con fecha igual o anterior a la fecha de corte.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cerrado al</TableHead>
              <TableHead className="text-right">Utilidad del periodo</TableHead>
              <TableHead>Cerrado por</TableHead>
              <TableHead>Fecha de cierre</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(closes ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  Aún no se ha cerrado ningún periodo.
                </TableCell>
              </TableRow>
            )}
            {(closes ?? []).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{formatDate(c.periodEndDate)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(c.netIncome)}</TableCell>
                <TableCell className="text-muted-foreground">{c.closedByName}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(c.createdAt.slice(0, 10))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
