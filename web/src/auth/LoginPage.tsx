import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Landmark } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { ApiRequestError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function LoginPage() {
  const { user, login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/";
    return <Navigate to={from} replace />;
  }

  const onSubmitCredentials = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.requiresTwoFactor) {
        setPendingToken(result.pendingToken ?? null);
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo iniciar sesión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!pendingToken) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await verifyTwoFactor(pendingToken, code);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo verificar el código");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <Landmark className="h-8 w-8 text-primary" />
            <h1 className="text-lg font-semibold">Sistema Contable</h1>
            <p className="text-sm text-muted-foreground">
              {pendingToken ? "Ingresa el código de tu app autenticadora" : "Ingresa con tu cuenta para continuar"}
            </p>
          </div>

          {!pendingToken ? (
            <form onSubmit={onSubmitCredentials} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={onSubmitCode} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Código de verificación</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Verificando..." : "Verificar"}
              </Button>
              <button
                type="button"
                className="w-full text-center text-xs text-muted-foreground underline"
                onClick={() => { setPendingToken(null); setCode(""); setError(null); }}
              >
                Volver a ingresar correo y contraseña
              </button>
            </form>
          )}

          {!pendingToken && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Demo: admin@demo.com · contador@demo.com · auditor@demo.com — clave Demo1234!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
