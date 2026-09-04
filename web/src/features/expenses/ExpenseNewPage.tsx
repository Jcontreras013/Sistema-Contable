import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { accountsApi } from "@/api/accounts";
import { partiesApi } from "@/api/parties";
import { productsApi } from "@/api/products";
import { ApiRequestError } from "@/api/client";
import { expensesApi } from "@/api/expenses";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { todayIso } from "@/lib/format";
import type { Currency } from "@/types/common";
import type { ExpensePaymentMethod } from "@/types/domain";

export function ExpenseNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: accountsApi.list });
  const { data: parties } = useQuery({ queryKey: ["parties"], queryFn: partiesApi.list });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: productsApi.list });

  const [partyId, setPartyId] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayIso());
  const [currency, setCurrency] = useState<Currency>("HNL");
  const [exchangeRate, setExchangeRate] = useState("");
  const [productId, setProductId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>("BANK");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeProducts = useMemo(() => (products ?? []).filter((p) => p.isActive), [products]);
  const selectedProduct = useMemo(
    () => activeProducts.find((p) => p.id === productId),
    [activeProducts, productId],
  );
  const expenseAccounts = useMemo(
    () => (accounts ?? []).filter((a) => a.type === "EXPENSE" && a.allowsPosting && a.isActive),
    [accounts],
  );
  const vendors = useMemo(() => (parties ?? []).filter((p) => p.type === "VENDOR" || p.type === "BOTH"), [parties]);

  const createMutation = useMutation({
    mutationFn: () =>
      expensesApi.create({
        partyId: partyId || undefined,
        expenseDate,
        currency,
        exchangeRate: currency === "USD" && exchangeRate ? exchangeRate : undefined,
        productId: productId || undefined,
        accountId: productId ? undefined : accountId,
        description,
        paymentMethod,
        amount,
      }),
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      navigate(`/expenses/${expense.id}`);
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo registrar el gasto"),
  });

  return (
    <div>
      <PageHeader title="Nuevo gasto" description="Se contabiliza automáticamente al guardar." />
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" required value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product">Producto (opcional)</Label>
              <Select id="product" value={productId} onChange={(e) => { setProductId(e.target.value); setAccountId(""); }}>
                <option value="">— Elegir cuenta manualmente —</option>
                {activeProducts.map((p) => <option key={p.id} value={p.id}>{p.description}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account">Cuenta de gasto</Label>
              {selectedProduct ? (
                <p className="flex h-9 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                  <span className="font-mono">{selectedProduct.accountCode}</span>&nbsp;{selectedProduct.accountName}
                </p>
              ) : (
                <Select id="account" required value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  <option value="">Selecciona</option>
                  {expenseAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor">Proveedor (opcional)</Label>
              <Select id="vendor" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                <option value="">—</option>
                {vendors.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expenseDate">Fecha</Label>
              <Input id="expenseDate" type="date" required value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Monto</Label>
              <Input id="amount" type="number" step="0.01" min="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda</Label>
              <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                <option value="HNL">Lempiras (HNL)</option>
                <option value="USD">Dólares (USD)</option>
              </Select>
            </div>
            {currency === "USD" && (
              <div className="space-y-1.5">
                <Label htmlFor="exchangeRate">Tasa de cambio (opcional)</Label>
                <Input id="exchangeRate" type="number" step="0.0001" placeholder="Usa la tasa vigente" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="paymentMethod">Forma de pago</Label>
              <Select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as ExpensePaymentMethod)}>
                <option value="BANK">Transferencia/Banco</option>
                <option value="CASH">Efectivo</option>
                <option value="CREDIT">Crédito (Cuentas por pagar)</option>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Guardando..." : "Registrar gasto"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
