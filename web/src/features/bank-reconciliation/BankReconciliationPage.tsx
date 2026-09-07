import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "@/api/accounts";
import { bankReconciliationsApi } from "@/api/bankReconciliations";
import { ApiRequestError } from "@/api/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney, todayIso } from "@/lib/format";

export function BankReconciliationPage() {
  const queryClient = useQueryClient();
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: accountsApi.list });
  const bankAccounts = useMemo(
    () => (accounts ?? []).filter((a) => a.systemRole === "CASH_HNL" || a.systemRole === "CASH_USD"),
    [accounts],
  );
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: history } = useQuery({
    queryKey: ["bank-reconciliations", accountId],
    queryFn: () => bankReconciliationsApi.listByAccount(accountId),
    enabled: !!accountId,
  });
  const openSummary = history?.find((r) => r.status === "OPEN");
  const completedHistory = (history ?? []).filter((r) => r.status !== "OPEN");

  const { data: open } = useQuery({
    queryKey: ["bank-reconciliations", "detail", openSummary?.id],
    queryFn: () => bankReconciliationsApi.get(openSummary!.id),
    enabled: !!openSummary,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["bank-reconciliations", accountId] });
    queryClient.invalidateQueries({ queryKey: ["bank-reconciliations", "detail"] });
  };

  const [statementDate, setStatementDate] = useState(todayIso());
  const [statementBalance, setStatementBalance] = useState("");

  const startMutation = useMutation({
    mutationFn: () => bankReconciliationsApi.start({ accountId, statementDate, statementBalance }),
    onSuccess: () => {
      setError(null);
      setStatementBalance("");
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo iniciar la conciliación"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ lineId, reconciled }: { lineId: string; reconciled: boolean }) =>
      bankReconciliationsApi.setLineReconciled(open!.id, lineId, reconciled),
    onSuccess: () => { setError(null); invalidate(); },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo actualizar la línea"),
  });

  const completeMutation = useMutation({
    mutationFn: () => bankReconciliationsApi.complete(open!.id),
    onSuccess: () => { setError(null); invalidate(); },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo completar la conciliación"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => bankReconciliationsApi.cancel(open!.id),
    onSuccess: () => { setError(null); invalidate(); },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo cancelar la conciliación"),
  });

  const difference = open ? Number(open.difference) : null;
  const canComplete = difference !== null && Math.abs(difference) < 0.005;

  return (
    <div>
      <PageHeader
        title="Conciliación bancaria"
        description="Compara los movimientos contables de una cuenta de Caja/Banco contra el saldo real de su estado de cuenta."
      />

      <div className="mb-6 max-w-sm space-y-1.5">
        <Label htmlFor="bank-account">Cuenta</Label>
        <Select id="bank-account" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          <option value="">Selecciona una cuenta</option>
          {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
        </Select>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {accountId && !openSummary && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form
              className="flex flex-wrap items-end gap-4"
              onSubmit={(e) => { e.preventDefault(); startMutation.mutate(); }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="statement-date">Fecha del estado de cuenta</Label>
                <Input id="statement-date" type="date" required value={statementDate} onChange={(e) => setStatementDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="statement-balance">Saldo final según el banco</Label>
                <Input
                  id="statement-balance"
                  type="number"
                  step="0.01"
                  required
                  value={statementBalance}
                  onChange={(e) => setStatementBalance(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={startMutation.isPending}>
                {startMutation.isPending ? "Iniciando..." : "Iniciar conciliación"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {accountId && open && (
        <div className="mb-8">
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <SummaryStat label="Saldo del estado de cuenta" value={formatMoney(open.statementBalance)} />
            <SummaryStat label="Saldo conciliado" value={formatMoney(open.clearedBalance)} />
            <SummaryStat
              label="Diferencia"
              value={formatMoney(open.difference)}
              highlight={!canComplete}
            />
          </div>

          <div className="mb-3 flex items-center gap-2">
            <Button onClick={() => completeMutation.mutate()} disabled={!canComplete || completeMutation.isPending}>
              {completeMutation.isPending ? "Completando..." : "Completar conciliación"}
            </Button>
            <Button variant="outline" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              Cancelar conciliación
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Débito</TableHead>
                <TableHead className="text-right">Crédito</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {open.lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hay movimientos pendientes de conciliar hasta esa fecha.
                  </TableCell>
                </TableRow>
              )}
              {open.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={line.reconciled}
                      disabled={toggleMutation.isPending}
                      onChange={(e) => toggleMutation.mutate({ lineId: line.id, reconciled: e.target.checked })}
                    />
                  </TableCell>
                  <TableCell>{formatDate(line.entryDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{line.description}</TableCell>
                  <TableCell className="text-right font-mono">{line.debit !== "0" && line.debit !== "0.0000" ? formatMoney(line.debit) : ""}</TableCell>
                  <TableCell className="text-right font-mono">{line.credit !== "0" && line.credit !== "0.0000" ? formatMoney(line.credit) : ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {accountId && completedHistory.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Historial</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha del estado de cuenta</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registrada por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedHistory.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDate(r.statementDate)}</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(r.statementBalance)}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{r.createdByName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className={`mt-1 text-lg font-semibold ${highlight ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}
