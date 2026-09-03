import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Download, Plus } from "lucide-react";
import { invoicesApi } from "@/api/invoices";
import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format";

export function InvoicesListPage() {
  const { hasRole } = useAuth();
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery({ queryKey: ["invoices", page], queryFn: () => invoicesApi.list(page) });
  const exportMutation = useMutation({ mutationFn: invoicesApi.downloadExcel });

  return (
    <div>
      <PageHeader
        title="Facturas"
        description="Facturación de ventas con cuentas por cobrar."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
              <Download className="h-4 w-4" /> Exportar Excel
            </Button>
            {hasRole("ADMIN", "ACCOUNTANT") && (
              <Link to="/invoices/new" className={buttonVariants({})}><Plus className="h-4 w-4" /> Nueva factura</Link>
            )}
          </div>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.content.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                  <TableCell className="font-medium">{invoice.partyName}</TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(invoice.total, invoice.currency)}</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(invoice.balanceInBase)}</TableCell>
                  <TableCell><StatusBadge status={invoice.status} /></TableCell>
                  <TableCell className="text-right">
                    <Link to={`/invoices/${invoice.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>Detalle</Link>
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
