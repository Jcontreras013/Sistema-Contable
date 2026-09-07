import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { expensesApi } from "@/api/expenses";
import { ApiRequestError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { PaymentHistory } from "@/features/payments/PaymentHistory";
import { RegisterPaymentForm } from "@/features/payments/RegisterPaymentForm";
import { formatDate, formatMoney } from "@/lib/format";

export function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: expense, isLoading } = useQuery({
    queryKey: ["expenses", id],
    queryFn: () => expensesApi.get(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => expensesApi.cancel(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", id] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo cancelar el gasto"),
  });

  if (isLoading || !expense) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  const canManage = hasRole("ADMIN", "ACCOUNTANT");
  const canPay = canManage && expense.paymentMethod === "CREDIT" && expense.status !== "CANCELLED" && expense.status !== "PAID";
  const canCancel = canManage && expense.status !== "CANCELLED" && Number(expense.paidInBase) === 0;

  return (
    <div>
      <PageHeader
        title={`Gasto #${expense.expenseNumber}`}
        description={`${expense.description} · ${formatDate(expense.expenseDate)}`}
        actions={
          <div className="flex gap-2">
            {expense.journalEntryId && (
              <Link to={`/journal-entries/${expense.journalEntryId}`} className="self-center text-sm text-primary underline">
                Ver asiento contable
              </Link>
            )}
            {canCancel && (
              <Button variant="destructive" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
                Cancelar gasto
              </Button>
            )}
          </div>
        }
      />

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryStat label="Estado" value={<StatusBadge status={expense.status} />} />
        <SummaryStat label="Cuenta" value={expense.accountName} />
        {expense.productDescription && <SummaryStat label="Producto" value={expense.productDescription} />}
        <SummaryStat label="Total" value={formatMoney(expense.amount, expense.currency)} />
        {Number(expense.withheldInBase) > 0 && (
          <SummaryStat label="Retención aplicada" value={formatMoney(expense.withheldInBase)} />
        )}
        <SummaryStat label="Saldo" value={formatMoney(expense.balanceInBase)} />
      </div>

      {expense.paymentMethod === "CREDIT" && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pagos a proveedor</h2>
            {canPay && (
              <Button variant="outline" size="sm" onClick={() => setShowPaymentForm((v) => !v)}>
                Registrar pago
              </Button>
            )}
          </div>
          {showPaymentForm && (
            <div className="mb-4">
              <RegisterPaymentForm
                expenseId={expense.id}
                currency={expense.currency}
                maxAmount={Number(expense.balanceInBase)}
                invalidateKey={["expenses", id]}
                onRegistered={() => setShowPaymentForm(false)}
              />
            </div>
          )}
          <PaymentHistory expenseId={expense.id} />
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
