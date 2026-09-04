import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { partiesApi, type PartyRequest } from "@/api/parties";
import { ApiRequestError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Party, PartyType } from "@/types/domain";

const PARTY_TYPE_LABELS: Record<PartyType, string> = {
  CUSTOMER: "Cliente",
  VENDOR: "Proveedor",
  BOTH: "Cliente y proveedor",
};

const emptyForm: PartyRequest = { type: "CUSTOMER", name: "", rtn: "", email: "", phone: "", address: "", isActive: true };

export function PartiesPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole("ADMIN", "ACCOUNTANT");
  const queryClient = useQueryClient();
  const { data: parties, isLoading } = useQuery({ queryKey: ["parties"], queryFn: partiesApi.list });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartyRequest>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => (editingId ? partiesApi.update(editingId, form) : partiesApi.create(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo guardar el tercero"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => partiesApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["parties"] }),
  });

  const startEdit = (party: Party) => {
    setEditingId(party.id);
    setForm({
      type: party.type,
      name: party.name,
      rtn: party.rtn ?? "",
      email: party.email ?? "",
      phone: party.phone ?? "",
      address: party.address ?? "",
      isActive: party.isActive,
    });
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader
        title="Proveedores"
        description="Proveedores y clientes para gastos y facturación."
        actions={
          canEdit ? (
            <Button onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}>
              <Plus className="h-4 w-4" /> Nuevo tercero
            </Button>
          ) : undefined
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
            >
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">Nombre / Razón social</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Tipo</Label>
                <Select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PartyType })}>
                  {Object.entries(PARTY_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rtn">RTN</Label>
                <Input id="rtn" value={form.rtn ?? ""} onChange={(e) => setForm({ ...form, rtn: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Activo
              </label>

              {error && <p className="text-sm text-destructive sm:col-span-3">{error}</p>}

              <div className="flex gap-2 sm:col-span-3">
                <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Guardando..." : "Guardar"}</Button>
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
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>RTN</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              {canEdit && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(parties ?? []).map((party) => (
              <TableRow key={party.id} className={!party.isActive ? "opacity-50" : undefined}>
                <TableCell className="font-medium">{party.name}</TableCell>
                <TableCell>{PARTY_TYPE_LABELS[party.type]}</TableCell>
                <TableCell className="font-mono text-xs">{party.rtn || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{party.email || party.phone || "—"}</TableCell>
                <TableCell>{party.isActive ? "Activo" : "Inactivo"}</TableCell>
                {canEdit && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(party)}>Editar</Button>
                      {party.isActive && (
                        <Button variant="ghost" size="sm" onClick={() => deactivateMutation.mutate(party.id)}>Desactivar</Button>
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
