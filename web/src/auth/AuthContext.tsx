import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi } from "@/api/auth";
import { tokenStorage } from "@/auth/tokenStorage";
import type { Role, User } from "@/types/domain";

export interface LoginResult {
  requiresTwoFactor: boolean;
  pendingToken?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyTwoFactor: (pendingToken: string, code: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  useEffect(() => {
    if (!tokenStorage.get()) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const response = await authApi.login({ email, password });
    if (response.requiresTwoFactor) {
      return { requiresTwoFactor: true, pendingToken: response.pendingToken };
    }
    tokenStorage.set(response.token!);
    setUser(response.user!);
    return { requiresTwoFactor: false };
  };

  const verifyTwoFactor = async (pendingToken: string, code: string) => {
    const response = await authApi.verifyTwoFactor({ pendingToken, code });
    tokenStorage.set(response.token!);
    setUser(response.user!);
  };

  const refreshUser = async () => {
    setUser(await authApi.me());
  };

  const hasRole = (...roles: Role[]) => (user ? roles.includes(user.role) : false);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, verifyTwoFactor, refreshUser, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
