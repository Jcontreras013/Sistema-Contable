import { api } from "@/api/client";
import type { DepreciationRunResult, FixedAsset } from "@/types/domain";

export interface CreateFixedAssetRequest {
  description: string;
  accountId: string;
  depreciationExpenseAccountId: string;
  accumulatedDepreciationAccountId: string;
  acquisitionDate: string;
  cost: string;
  residualValue: string;
  usefulLifeMonths: number;
}

export const fixedAssetsApi = {
  list: () => api.get<FixedAsset[]>("/fixed-assets"),
  get: (id: string) => api.get<FixedAsset>(`/fixed-assets/${id}`),
  create: (request: CreateFixedAssetRequest) => api.post<FixedAsset>("/fixed-assets", request),
  dispose: (id: string) => api.post<FixedAsset>(`/fixed-assets/${id}/dispose`),
  runDepreciation: (periodDate: string) =>
    api.post<DepreciationRunResult>("/fixed-assets/depreciation/run", { periodDate }),
};
