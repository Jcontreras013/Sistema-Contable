import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { accountsApi } from "@/api/accounts";
import { fixedAssetsApi, type CreateFixedAssetRequest } from "@/api/fixedAssets";
import { ApiRequestError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney, todayIso } from "@/lib/format";

const emptyForm: CreateFixedAssetRequest = {
  description: "",
  accountId: "",
  depreciationExpenseAccountId: "",
  accumulatedDepreciationAccountId: "",
  acquisitionDate: todayIso(),
  cost: "",
  residualValue: "0",
  usefulLifeMonths: 36,
};

export function FixedAssetsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "ACCOUNTANT");
  const queryClient = useQueryClient();
  const { data: assets, isLoading } = useQuery({ queryKey: ["fixed-assets"], queryFn: fixedAssetsApi.list });
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: accountsApi.list });

  const assetAccounts = useMemo(
    () => (accounts ?? []).filter((a) => a.type === "ASSET" && a.allowsPosting && a.isActive),
    [accounts],
  );
  const expenseAccounts = useMemo(
    () => (accounts ?? []).filter((a) => a.type === "EXPENSE" && a.allowsPosting && a.isActive),
    [accounts],
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateFixedAssetRequest>(emptyForm);
  const [periodDate, setPeriodDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => fixedAssetsApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
      setShowForm(false);
      setForm(emptyForm);
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo crear el activo"),
  });

  const disposeMutation = useMutation({
    mutationFn: (id: string) => fixedAssetsApi.dispose(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fixed-assets"] }),
  });

  const runDepreciationMutation = useMutation({
    mutationFn: () => fixedAssetsApi.runDepreciation(periodDate),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
      setError(null);
      setRunMessage(
        result.items.length === 0
          ? "No había activos pendientes de depreciar para ese periodo."
          : `Se contabilizó la depreciación de ${result.items.length} activo(s).`,
      );
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo correr la depreciación"),
  });

  return (
    <div>
      <PageHeader
        title="Activos fijos"
        description="Control de las inversiones en infraestructura y equipo de la empresa, con depreciación en línea recta."
        actions={
          canManage ? (
            <Button onClick={() => { setForm(emptyForm); setShowForm(true); }}>
              <Plus className="h-4 w-4" /> Nuevo activo
            </Button>
          ) : undefined
        }
      />

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
            >
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="fa-description">Descripción</Label>
                <Input
                  id="fa-description"
                  required
                  placeholder="OLT Huawei MA5800 - Nodo Coxen Hole"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fa-account">Cuenta del activo</Label>
                <Select
                  id="fa-account"
                  required
                  value={form.accountId}
                  onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                >
                  <option value="">Selecciona</option>
                  {assetAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fa-accumulated">Cuenta de depreciación acumulada</Label>
                <Select
                  id="fa-accumulated"
                  required
                  value={form.accumulatedDepreciationAccountId}
                  onChange={(e) => setForm({ ...form, accumulatedDepreciationAccountId: e.target.value })}
                >
                  <option value="">Selecciona</option>
                  {assetAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fa-expense">Cuenta de gasto de depreciación</Label>
                <Select
                  id="fa-expense"
                  required
                  value={form.depreciationExpenseAccountId}
                  onChange={(e) => setForm({ ...form, depreciationExpenseAccountId: e.target.value })}
                >
                  <option value="">Selecciona</option>
                  {expenseAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fa-acquisition">Fecha de adquisición</Label>
                <Input
                  id="fa-acquisition"
                  type="date"
                  required
                  value={form.acquisitionDate}
                  onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fa-cost">Costo</Label>
                <Input
                  id="fa-cost"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fa-residual">Valor residual</Label>
                <Input
                  id="fa-residual"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.residualValue}
                  onChange={(e) => setForm({ ...form, residualValue: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fa-life">Vida útil (meses)</Label>
                <Input
                  id="fa-life"
                  type="number"
                  min="1"
                  required
                  value={form.usefulLifeMonths}
                  onChange={(e) => setForm({ ...form, usefulLifeMonths: Number(e.target.value) })}
                />
              </div>

              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {canManage && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form
              className="flex flex-wrap items-end gap-4"
              onSubmit={(e) => { e.preventDefault(); runDepreciationMutation.mutate(); }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="fa-period">Correr depreciación del periodo</Label>
                <Input id="fa-period" type="date" value={periodDate} onChange={(e) => setPeriodDate(e.target.value)} />
              </div>
              <Button type="submit" variant="outline" disabled={runDepreciationMutation.isPending}>
                {runDepreciationMutation.isPending ? "Procesando..." : "Correr depreciación"}
              </Button>
            </form>
            {runMessage && <p className="mt-2 text-sm text-success">{runMessage}</p>}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Adquisición</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right">Depreciación acumulada</TableHead>
              <TableHead className="text-right">Valor en libros</TableHead>
              <TableHead>Estado</TableHead>
              {canManage && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(assets ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="text-center text-sm text-muted-foreground">
                  Sin activos fijos registrados.
                </TableCell>
              </TableRow>
            )}
            {(assets ?? []).map((asset) => (
              <TableRow key={asset.id} className={asset.status === "DISPOSED" ? "opacity-50" : undefined}>
                <TableCell className="font-medium">{asset.description}</TableCell>
                <TableCell>{formatDate(asset.acquisitionDate)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(asset.cost)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(asset.accumulatedDepreciation)}</TableCell>
                <TableCell className="text-right font-mono font-semibold">{formatMoney(asset.bookValue)}</TableCell>
                <TableCell><StatusBadge status={asset.status} /></TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    {asset.status !== "DISPOSED" && (
                      <Button variant="ghost" size="sm" onClick={() => disposeMutation.mutate(asset.id)}>
                        Dar de baja
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
