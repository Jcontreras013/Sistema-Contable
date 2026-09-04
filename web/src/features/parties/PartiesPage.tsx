import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Search, X } from "lucide-react";
import { partiesApi, type PartyRequest } from "@/api/parties";
import { ApiRequestError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Party, PartyType, TaxRegime } from "@/types/domain";

const PARTY_TYPE_LABELS: Record<PartyType, string> = {
  CUSTOMER: "Cliente",
  VENDOR: "Proveedor",
  BOTH: "Cliente y proveedor",
};

const TAX_REGIME_LABELS: Record<TaxRegime, string> = {
  ORDINARIO: "Ordinario",
  SIMPLIFICADO: "Simplificado",
};

const emptyForm: PartyRequest = {
  type: "CUSTOMER",
  name: "",
  rtn: "",
  email: "",
  phone: "",
  address: "",
  isActive: true,
  taxRegime: null,
  isrWithholdingAgent: false,
  isvWithholdingAgent: false,
  withholdingRate: "",
  additionalEmails: [],
};

export function PartiesPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole("ADMIN", "ACCOUNTANT");
  const queryClient = useQueryClient();
  const { data: parties, isLoading } = useQuery({ queryKey: ["parties"], queryFn: partiesApi.list });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartyRequest>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredParties = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parties ?? [];
    return (parties ?? []).filter(
      (p) => p.name.toLowerCase().includes(q) || (p.rtn ?? "").toLowerCase().includes(q),
    );
  }, [parties, search]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, additionalEmails: form.additionalEmails.filter((e) => e.trim() !== "") };
      return editingId ? partiesApi.update(editingId, payload) : partiesApi.create(payload);
    },
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
      taxRegime: party.taxRegime,
      isrWithholdingAgent: party.isrWithholdingAgent,
      isvWithholdingAgent: party.isvWithholdingAgent,
      withholdingRate: party.withholdingRate ?? "",
      additionalEmails: [...party.additionalEmails],
    });
    setShowForm(true);
  };

  const isWithholdingAgent = form.isrWithholdingAgent || form.isvWithholdingAgent;

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
                <Label htmlFor="email">Correo principal</Label>
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

              <div className="space-y-1.5 sm:col-span-3">
                <Label>Correos adicionales</Label>
                <div className="space-y-2">
                  {form.additionalEmails.map((email, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        type="email"
                        value={email}
                        placeholder="correo@ejemplo.com"
                        onChange={(e) => {
                          const next = [...form.additionalEmails];
                          next[i] = e.target.value;
                          setForm({ ...form, additionalEmails: next });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setForm({ ...form, additionalEmails: form.additionalEmails.filter((_, j) => j !== i) })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm({ ...form, additionalEmails: [...form.additionalEmails, ""] })}
                  >
                    <Plus className="h-4 w-4" /> Agregar correo
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-3">
                <p className="text-sm font-medium">Información fiscal</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxRegime">Régimen fiscal</Label>
                <Select
                  id="taxRegime"
                  value={form.taxRegime ?? ""}
                  onChange={(e) => setForm({ ...form, taxRegime: (e.target.value || null) as TaxRegime | null })}
                >
                  <option value="">— Sin especificar —</option>
                  {Object.entries(TAX_REGIME_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>
              <label className="flex items-center gap-2 self-end text-sm">
                <input
                  type="checkbox"
                  checked={form.isrWithholdingAgent}
                  onChange={(e) => setForm({ ...form, isrWithholdingAgent: e.target.checked })}
                />
                Agente retenedor de ISR
              </label>
              <label className="flex items-center gap-2 self-end text-sm">
                <input
                  type="checkbox"
                  checked={form.isvWithholdingAgent}
                  onChange={(e) => setForm({ ...form, isvWithholdingAgent: e.target.checked })}
                />
                Agente retenedor de ISV
              </label>
              {isWithholdingAgent && (
                <div className="space-y-1.5">
                  <Label htmlFor="withholdingRate">% de retención aplicable</Label>
                  <Input
                    id="withholdingRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.withholdingRate ?? ""}
                    onChange={(e) => setForm({ ...form, withholdingRate: e.target.value })}
                  />
                </div>
              )}

              <label className="flex items-center gap-2 self-end text-sm">
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

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Buscar por nombre o RTN..."
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
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>RTN</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParties.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
            {filteredParties.map((party) => (
              <TableRow key={party.id} className={!party.isActive ? "opacity-50" : undefined}>
                <TableCell className="font-medium">{party.name}</TableCell>
                <TableCell>{PARTY_TYPE_LABELS[party.type]}</TableCell>
                <TableCell className="font-mono text-xs">{party.rtn || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{party.email || party.phone || "—"}</TableCell>
                <TableCell>{party.isActive ? "Activo" : "Inactivo"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to={`/parties/${party.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      Detalle
                    </Link>
                    {canEdit && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(party)}>Editar</Button>
                        {party.isActive && (
                          <Button variant="ghost" size="sm" onClick={() => deactivateMutation.mutate(party.id)}>Desactivar</Button>
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
