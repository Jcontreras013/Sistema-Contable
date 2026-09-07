import { api } from "@/api/client";
import type { User } from "@/types/domain";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  requiresTwoFactor: boolean;
  pendingToken?: string;
  token?: string;
  user?: User;
}

export interface VerifyTwoFactorRequest {
  pendingToken: string;
  code: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  otpAuthUri: string;
}

export const authApi = {
  login: (request: LoginRequest) => api.post<LoginResponse>("/auth/login", request),
  verifyTwoFactor: (request: VerifyTwoFactorRequest) => api.post<LoginResponse>("/auth/login/verify-2fa", request),
  me: () => api.get<User>("/auth/me"),
  setupTwoFactor: () => api.post<TwoFactorSetupResponse>("/auth/2fa/setup"),
  enableTwoFactor: (code: string) => api.post<User>("/auth/2fa/enable", { code }),
  disableTwoFactor: (code: string) => api.post<User>("/auth/2fa/disable", { code }),
};
