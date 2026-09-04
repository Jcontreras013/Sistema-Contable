import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FileText, Receipt, ScrollText } from "lucide-react";
import { invoicesApi } from "@/api/invoices";
import { expensesApi } from "@/api/expenses";
import { journalEntriesApi } from "@/api/journalEntries";
import { useAuth } from "@/auth/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";

export function HomeView() {
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "ACCOUNTANT");

  const { data: invoices } = useQuery({ queryKey: ["invoices", 0, 5], queryFn: () => invoicesApi.list(0, 5) });
  const { data: expenses } = useQuery({ queryKey: ["expenses", 0, 5], queryFn: () => expensesApi.list(0, 5) });
  const { data: entries } = useQuery({ queryKey: ["journal-entries", 0, 5], queryFn: () => journalEntriesApi.list(0, 5) });

  return (
    <div>
      {canManage && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link to="/invoices/new" className={buttonVariants({})}>
            <FileText className="h-4 w-4" /> Nueva factura
          </Link>
          <Link to="/expenses/new" className={buttonVariants({ variant: "outline" })}>
            <Receipt className="h-4 w-4" /> Nuevo gasto
          </Link>
          <Link to="/journal-entries/new" className={buttonVariants({ variant: "outline" })}>
            <ScrollText className="h-4 w-4" /> Nuevo asiento
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Facturas recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoices?.content.length === 0 && <p className="text-sm text-muted-foreground">Sin facturas todavía.</p>}
            {invoices?.content.map((inv) => (
              <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
                <span className="min-w-0 flex-1 truncate">#{inv.invoiceNumber} · {inv.partyName}</span>
                <StatusBadge status={inv.status} />
              </Link>
            ))}
            <Link to="/invoices" className="block text-xs text-primary hover:underline">Ver todas las facturas →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expenses?.content.length === 0 && <p className="text-sm text-muted-foreground">Sin gastos todavía.</p>}
            {expenses?.content.map((exp) => (
              <Link key={exp.id} to={`/expenses/${exp.id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
                <span className="min-w-0 flex-1 truncate">#{exp.expenseNumber} · {exp.description}</span>
                <span className="font-mono text-xs text-muted-foreground">{formatMoney(exp.amount, exp.currency)}</span>
              </Link>
            ))}
            <Link to="/expenses" className="block text-xs text-primary hover:underline">Ver todos los gastos →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asientos recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {entries?.content.length === 0 && <p className="text-sm text-muted-foreground">Sin asientos todavía.</p>}
            {entries?.content.map((je) => (
              <Link key={je.id} to={`/journal-entries/${je.id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
                <span className="min-w-0 flex-1 truncate">#{je.entryNumber} · {je.description}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(je.entryDate)}</span>
              </Link>
            ))}
            <Link to="/journal-entries" className="block text-xs text-primary hover:underline">Ver todos los asientos →</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
