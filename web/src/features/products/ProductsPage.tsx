import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { accountsApi } from "@/api/accounts";
import { productsApi, type ProductRequest } from "@/api/products";
import { ApiRequestError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product } from "@/types/domain";

const emptyForm: ProductRequest = { description: "", accountId: "", isActive: true };

export function ProductsPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole("ADMIN", "ACCOUNTANT");
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useQuery({ queryKey: ["products"], queryFn: productsApi.list });
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: accountsApi.list });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductRequest>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const postingAccounts = useMemo(
    () => (accounts ?? []).filter((a) => a.allowsPosting && a.isActive),
    [accounts],
  );

  const saveMutation = useMutation({
    mutationFn: () => (editingId ? productsApi.update(editingId, form) : productsApi.create(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo guardar el producto"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => productsApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({ description: product.description, accountId: product.accountId, isActive: product.isActive });
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader
        title="Catálogo de productos"
        description="Productos y servicios de compra, cada uno enlazado a su cuenta contable."
        actions={
          canEdit ? (
            <Button onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}>
              <Plus className="h-4 w-4" /> Nuevo producto
            </Button>
          ) : undefined
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
            >
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account">Cuenta contable</Label>
                <Select
                  id="account"
                  required
                  value={form.accountId}
                  onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                >
                  <option value="">Selecciona</option>
                  {postingAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </Select>
              </div>
              <label className="flex items-center gap-2 self-end text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Activo
              </label>

              {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}

              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
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
              <TableHead>Cuenta contable</TableHead>
              <TableHead>Estado</TableHead>
              {canEdit && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(products ?? []).map((product) => (
              <TableRow key={product.id} className={!product.isActive ? "opacity-50" : undefined}>
                <TableCell className="font-medium">{product.description}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <span className="font-mono">{product.accountCode}</span> {product.accountName}
                </TableCell>
                <TableCell>{product.isActive ? "Activo" : "Inactivo"}</TableCell>
                {canEdit && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(product)}>Editar</Button>
                      {product.isActive && (
                        <Button variant="ghost" size="sm" onClick={() => deactivateMutation.mutate(product.id)}>
                          Desactivar
                        </Button>
                      )}
                    </div>
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
