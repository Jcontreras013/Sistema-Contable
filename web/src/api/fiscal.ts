import { api } from "@/api/client";
import type { CaiAuthorization, CompanyProfile } from "@/types/domain";

export interface CompanyProfileRequest {
  legalName: string;
  rtn: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface CreateCaiAuthorizationRequest {
  caiCode: string;
  establishmentCode: string;
  emissionPointCode: string;
  documentTypeCode: string;
  rangeStart: number;
  rangeEnd: number;
  emissionLimitDate: string;
}

export const companyProfileApi = {
  get: () => api.get<CompanyProfile | null>("/company-profile"),
  upsert: (request: CompanyProfileRequest) => api.post<CompanyProfile>("/company-profile", request),
};

export const caiAuthorizationsApi = {
  list: () => api.get<CaiAuthorization[]>("/cai-authorizations"),
  create: (request: CreateCaiAuthorizationRequest) =>
    api.post<CaiAuthorization>("/cai-authorizations", request),
};
