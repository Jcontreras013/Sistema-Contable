import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { ApiRequestError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SecuritySettingsPage() {
  const { user, refreshUser } = useAuth();
  const [setupInfo, setSetupInfo] = useState<{ secret: string; otpAuthUri: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const setupMutation = useMutation({
    mutationFn: () => authApi.setupTwoFactor(),
    onSuccess: (data) => { setSetupInfo(data); setError(null); setMessage(null); },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo generar el código"),
  });

  const enableMutation = useMutation({
    mutationFn: () => authApi.enableTwoFactor(code),
    onSuccess: async () => {
      setSetupInfo(null);
      setCode("");
      setError(null);
      setMessage("Verificación en dos pasos activada.");
      await refreshUser();
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo activar"),
  });

  const disableMutation = useMutation({
    mutationFn: () => authApi.disableTwoFactor(code),
    onSuccess: async () => {
      setCode("");
      setError(null);
      setMessage("Verificación en dos pasos desactivada.");
      await refreshUser();
    },
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : "No se pudo desactivar"),
  });

  if (!user) return null;

  return (
    <div>
      <PageHeader
        title="Seguridad"
        description="Protege tu cuenta con verificación en dos pasos (2FA) usando una app autenticadora (Google Authenticator, Authy, etc.)."
      />

      <Card className="max-w-lg">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Verificación en dos pasos</p>
            <Badge variant={user.twoFactorEnabled ? "success" : "default"}>
              {user.twoFactorEnabled ? "Activada" : "Desactivada"}
            </Badge>
          </div>

          {message && <p className="text-sm text-success">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {!user.twoFactorEnabled && !setupInfo && (
            <Button onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending}>
              {setupMutation.isPending ? "Generando..." : "Activar verificación en dos pasos"}
            </Button>
          )}

          {!user.twoFactorEnabled && setupInfo && (
            <form
              className="space-y-3 rounded-md border border-border p-4"
              onSubmit={(e) => { e.preventDefault(); enableMutation.mutate(); }}
            >
              <p className="text-sm text-muted-foreground">
                Agrega esta cuenta a tu app autenticadora ingresando el siguiente código manualmente
                (o usa el enlace si tu app lo admite), luego confirma con el código de 6 dígitos que genere.
              </p>
              <div>
                <Label>Código secreto</Label>
                <p className="mt-1 break-all rounded bg-muted px-2 py-1.5 font-mono text-sm">{setupInfo.secret}</p>
              </div>
              <div>
                <Label>URI otpauth</Label>
                <p className="mt-1 break-all rounded bg-muted px-2 py-1.5 font-mono text-xs">{setupInfo.otpAuthUri}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="enable-code">Código de 6 dígitos</Label>
                <Input
                  id="enable-code"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                />
              </div>
              <Button type="submit" disabled={enableMutation.isPending}>
                {enableMutation.isPending ? "Activando..." : "Confirmar y activar"}
              </Button>
            </form>
          )}

          {user.twoFactorEnabled && (
            <form
              className="space-y-3 rounded-md border border-border p-4"
              onSubmit={(e) => { e.preventDefault(); disableMutation.mutate(); }}
            >
              <p className="text-sm text-muted-foreground">
                Para desactivarla, ingresa un código vigente de tu app autenticadora.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="disable-code">Código de 6 dígitos</Label>
                <Input
                  id="disable-code"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                />
              </div>
              <Button type="submit" variant="destructive" disabled={disableMutation.isPending}>
                {disableMutation.isPending ? "Desactivando..." : "Desactivar verificación en dos pasos"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
