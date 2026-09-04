import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { expensesApi } from "@/api/expenses";
import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format";

export function ExpensesListPage() {
  const { hasRole } = useAuth();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["expenses", page, search],
    queryFn: () => expensesApi.list(page, 20, undefined, search || undefined),
  });

  return (
    <div>
      <PageHeader
        title="Gastos"
        description="Egresos de la empresa con cuentas por pagar."
        actions={
          hasRole("ADMIN", "ACCOUNTANT") ? (
            <Link to="/expenses/new" className={buttonVariants({})}><Plus className="h-4 w-4" /> Nuevo gasto</Link>
          ) : undefined
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Buscar por descripción, proveedor o número..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.content.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    Sin resultados.
                  </TableCell>
                </TableRow>
              )}
              {data?.content.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-mono">{expense.expenseNumber}</TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>{expense.partyName ?? "—"}</TableCell>
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
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Página {(data?.number ?? 0) + 1} de {Math.max(data?.totalPages ?? 1, 1)}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(data?.number ?? 0) + 1 >= (data?.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
