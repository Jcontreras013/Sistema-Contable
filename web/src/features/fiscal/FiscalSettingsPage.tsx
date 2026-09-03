import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { caiAuthorizationsApi, companyProfileApi, type CreateCaiAuthorizationRequest } from "@/api/fiscal";
import { ApiRequestError } from "@/api/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, todayIso } from "@/lib/format";

export function FiscalSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Configuración fiscal"
        description="Datos de tu empresa y autorizaciones CAI del SAR para poder facturar."
      />
      <CompanyProfileCard />
      <CaiAuthorizationsCard />
    </div>
  );
}

function CompanyProfileCard() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({ queryKey: ["company-profile"], queryFn: companyProfileApi.get });

  const [legalName, setLegalName] = useState("");
  const [rtn, setRtn] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setLegalName(profile.legalName);
      setRtn(profile.rtn);
      setAddress(profile.address ?? "");
      setPhone(profile.phone ?? "");
      setEmail(profile.email ?? "");
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () => companyProfileApi.upsert({ legalName, rtn, address, phone, email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-profile"] });
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo guardar"),
  });

  if (isLoading) return <p className="mb-6 text-sm text-muted-foreground">Cargando...</p>;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h2 className="mb-4 text-lg font-semibold">Datos de tu empresa</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Se imprimen como emisor en el PDF de tus facturas.
        </p>
        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="legalName">Razón social</Label>
            <Input id="legalName" required value={legalName} onChange={(e) => setLegalName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rtn">RTN</Label>
            <Input id="rtn" required value={rtn} onChange={(e) => setRtn(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="companyEmail">Correo</Label>
            <Input id="companyEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const EMPTY_CAI: CreateCaiAuthorizationRequest = {
  caiCode: "",
  establishmentCode: "001",
  emissionPointCode: "001",
  documentTypeCode: "01",
  rangeStart: 1,
  rangeEnd: 5000,
  emissionLimitDate: todayIso(),
};

function CaiAuthorizationsCard() {
  const queryClient = useQueryClient();
  const { data: authorizations, isLoading } = useQuery({
    queryKey: ["cai-authorizations"],
    queryFn: caiAuthorizationsApi.list,
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCaiAuthorizationRequest>(EMPTY_CAI);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => caiAuthorizationsApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cai-authorizations"] });
      setShowForm(false);
      setForm(EMPTY_CAI);
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo registrar la autorización"),
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Autorizaciones CAI (SAR)</h2>
            <p className="text-sm text-muted-foreground">
              El código CAI lo asigna el SAR como trámite legal (autoimpresor). Regístralo aquí
              para que el sistema genere los correlativos de tus facturas.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancelar" : "Registrar CAI"}
          </Button>
        </div>

        {showForm && (
          <form
            className="mb-6 grid grid-cols-2 gap-4 rounded-md border border-border p-4 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <div className="space-y-1.5 sm:col-span-4">
              <Label htmlFor="caiCode">Código CAI</Label>
              <Input
                id="caiCode"
                required
                value={form.caiCode}
                onChange={(e) => setForm({ ...form, caiCode: e.target.value })}
                placeholder="El código de 32+ caracteres que te dio el SAR"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="establishmentCode">Establecimiento</Label>
              <Input
                id="establishmentCode"
                required
                pattern="\d{3}"
                title="3 dígitos"
                value={form.establishmentCode}
                onChange={(e) => setForm({ ...form, establishmentCode: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emissionPointCode">Punto de emisión</Label>
              <Input
                id="emissionPointCode"
                required
                pattern="\d{3}"
                title="3 dígitos"
                value={form.emissionPointCode}
                onChange={(e) => setForm({ ...form, emissionPointCode: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="documentTypeCode">Tipo de documento</Label>
              <Input
                id="documentTypeCode"
                required
                pattern="\d{2}"
                title="2 dígitos (01 = factura)"
                value={form.documentTypeCode}
                onChange={(e) => setForm({ ...form, documentTypeCode: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emissionLimitDate">Fecha límite de emisión</Label>
              <Input
                id="emissionLimitDate"
                type="date"
                required
                value={form.emissionLimitDate}
                onChange={(e) => setForm({ ...form, emissionLimitDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rangeStart">Rango desde</Label>
              <Input
                id="rangeStart"
                type="number"
                min={1}
                required
                value={form.rangeStart}
                onChange={(e) => setForm({ ...form, rangeStart: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rangeEnd">Rango hasta</Label>
              <Input
                id="rangeEnd"
                type="number"
                min={1}
                required
                value={form.rangeEnd}
                onChange={(e) => setForm({ ...form, rangeEnd: Number(e.target.value) })}
              />
            </div>
            {error && <p className="text-sm text-destructive sm:col-span-4">{error}</p>}
            <div className="sm:col-span-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Guardando..." : "Registrar"}
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CAI</TableHead>
                <TableHead>Establ.-Punto-Tipo</TableHead>
                <TableHead>Rango</TableHead>
                <TableHead>Correlativo actual</TableHead>
                <TableHead>Fecha límite</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(authorizations ?? []).map((cai) => (
                <TableRow key={cai.id}>
                  <TableCell className="font-mono text-xs">{cai.caiCode}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {cai.establishmentCode}-{cai.emissionPointCode}-{cai.documentTypeCode}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {cai.rangeStart}-{cai.rangeEnd}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{cai.currentNumber}</TableCell>
                  <TableCell>{formatDate(cai.emissionLimitDate)}</TableCell>
                  <TableCell>
                    <Badge variant={cai.isActive ? "success" : "default"}>
                      {cai.isActive ? "Activa" : "Reemplazada"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
