import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, ScrollText, Search } from "lucide-react";
import { accountsApi, type AccountRequest } from "@/api/accounts";
import { ApiRequestError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Account, AccountSystemRole, AccountType } from "@/types/domain";

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ASSET: "Activo",
  LIABILITY: "Pasivo",
  EQUITY: "Patrimonio",
  INCOME: "Ingreso",
  EXPENSE: "Gasto",
};

const SYSTEM_ROLE_LABELS: Record<AccountSystemRole, string> = {
  ACCOUNTS_RECEIVABLE: "Cuentas por cobrar",
  ACCOUNTS_PAYABLE: "Cuentas por pagar",
  SALES_REVENUE_DEFAULT: "Ingreso por ventas (por defecto)",
  TAX_PAYABLE: "ISV por pagar",
  CASH_HNL: "Caja/Banco en Lempiras",
  CASH_USD: "Caja/Banco en Dólares",
};

const emptyForm: AccountRequest = {
  code: "",
  name: "",
  type: "ASSET",
  parentId: null,
  allowsPosting: true,
  systemRole: null,
  isActive: true,
};

export function AccountsPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole("ADMIN", "ACCOUNTANT");
  const queryClient = useQueryClient();
  const { data: accounts, isLoading } = useQuery({ queryKey: ["accounts"], queryFn: accountsApi.list });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AccountRequest>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => [...(accounts ?? [])].sort((a, b) => a.code.localeCompare(b.code)), [accounts]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
  }, [sorted, search]);

  const saveMutation = useMutation({
    mutationFn: () => (editingId ? accountsApi.update(editingId, form) : accountsApi.create(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo guardar la cuenta"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => accountsApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });

  const startEdit = (account: Account) => {
    setEditingId(account.id);
    setForm({
      code: account.code,
      name: account.name,
      type: account.type,
      parentId: account.parentId,
      allowsPosting: account.allowsPosting,
      systemRole: account.systemRole,
      isActive: account.isActive,
    });
    setShowForm(true);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader
        title="Libro mayor"
        description="Plan de cuentas: selecciona una cuenta para ver su mayor (movimientos y saldo)."
        actions={canEdit ? <Button onClick={startCreate}><Plus className="h-4 w-4" /> Nueva cuenta</Button> : undefined}
      />

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="code">Código</Label>
                <Input id="code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  id="type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as AccountType })}
                >
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parent">Cuenta padre</Label>
                <Select
                  id="parent"
                  value={form.parentId ?? ""}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value || null })}
                >
                  <option value="">(ninguna, cuenta raíz)</option>
                  {sorted.filter((a) => a.id !== editingId).map((a) => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="systemRole">Rol especial (opcional)</Label>
                <Select
                  id="systemRole"
                  value={form.systemRole ?? ""}
                  onChange={(e) => setForm({ ...form, systemRole: (e.target.value || null) as AccountSystemRole | null })}
                >
                  <option value="">(ninguno)</option>
                  {Object.entries(SYSTEM_ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.allowsPosting}
                  onChange={(e) => setForm({ ...form, allowsPosting: e.target.checked })}
                />
                Admite movimientos directos
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Activa
              </label>

              {error && <p className="text-sm text-destructive sm:col-span-3">{error}</p>}

              <div className="flex gap-2 sm:col-span-3">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Buscar por código o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Rol especial</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((account) => (
              <TableRow key={account.id} className={!account.isActive ? "opacity-50" : undefined}>
                <TableCell className="font-mono">{account.code}</TableCell>
                <TableCell className={account.allowsPosting ? "" : "font-semibold"}>{account.name}</TableCell>
                <TableCell>{ACCOUNT_TYPE_LABELS[account.type]}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {account.systemRole ? SYSTEM_ROLE_LABELS[account.systemRole] : "—"}
                </TableCell>
                <TableCell>{account.isActive ? "Activa" : "Inactiva"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link
                      to={`/reports/general-ledger/${account.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      title="Ver mayor"
                    >
                      <ScrollText className="h-4 w-4" />
                    </Link>
                    {canEdit && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(account)}>Editar</Button>
                        {account.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deactivateMutation.mutate(account.id)}
                          >
                            Desactivar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
