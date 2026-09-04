import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { partiesApi } from "@/api/parties";
import { expensesApi } from "@/api/expenses";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format";
import type { PartyType, TaxRegime } from "@/types/domain";

const PARTY_TYPE_LABELS: Record<PartyType, string> = {
  CUSTOMER: "Cliente",
  VENDOR: "Proveedor",
  BOTH: "Cliente y proveedor",
};

const TAX_REGIME_LABELS: Record<TaxRegime, string> = {
  ORDINARIO: "Ordinario",
  SIMPLIFICADO: "Simplificado",
};

export function PartyDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: party, isLoading } = useQuery({
    queryKey: ["parties", id],
    queryFn: () => partiesApi.get(id!),
    enabled: !!id,
  });
  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ["expenses", "by-party", id],
    queryFn: () => expensesApi.list(0, 50, id),
    enabled: !!id,
  });

  if (isLoading || !party) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  const allEmails = [party.email, ...party.additionalEmails].filter((e): e is string => !!e);
  const isWithholdingAgent = party.isrWithholdingAgent || party.isvWithholdingAgent;

  return (
    <div>
      <PageHeader
        title={party.name}
        description={PARTY_TYPE_LABELS[party.type]}
        actions={
          <Link to="/parties" className={buttonVariants({ variant: "outline" })}>
            Volver a Proveedores
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 pt-6 text-sm">
            <h2 className="font-semibold">Datos generales</h2>
            <Row label="Estado" value={<Badge variant={party.isActive ? "success" : "default"}>{party.isActive ? "Activo" : "Inactivo"}</Badge>} />
            <Row label="RTN" value={party.rtn || "—"} />
            <Row label="Teléfono" value={party.phone || "—"} />
            <Row label="Dirección" value={party.address || "—"} />
            <Row
              label="Correos"
              value={
                allEmails.length > 0 ? (
                  <div className="space-y-0.5">{allEmails.map((e) => <div key={e}>{e}</div>)}</div>
                ) : (
                  "—"
                )
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6 text-sm">
            <h2 className="font-semibold">Información fiscal</h2>
            <Row label="Régimen fiscal" value={party.taxRegime ? TAX_REGIME_LABELS[party.taxRegime] : "Sin especificar"} />
            <Row label="Agente retenedor ISR" value={party.isrWithholdingAgent ? "Sí" : "No"} />
            <Row label="Agente retenedor ISV" value={party.isvWithholdingAgent ? "Sí" : "No"} />
            {isWithholdingAgent && (
              <Row label="% de retención" value={`${party.withholdingRate ?? "—"}%`} />
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Gastos registrados</h2>
      {loadingExpenses || !expenses ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : expenses.content.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin gastos registrados a este tercero todavía.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Ver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.content.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-mono">{expense.expenseNumber}</TableCell>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(expense.amount, expense.currency)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(expense.balanceInBase)}</TableCell>
                <TableCell><StatusBadge status={expense.status} /></TableCell>
                <TableCell className="text-right">
                  <Link to={`/expenses/${expense.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>Detalle</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
