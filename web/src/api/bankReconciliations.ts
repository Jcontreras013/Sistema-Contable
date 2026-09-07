import { api } from "@/api/client";
import type { BankReconciliation } from "@/types/domain";

export interface StartBankReconciliationRequest {
  accountId: string;
  statementDate: string;
  statementBalance: string;
}

export const bankReconciliationsApi = {
  listByAccount: (accountId: string) =>
    api.get<BankReconciliation[]>("/bank-reconciliations", { accountId }),
  get: (id: string) => api.get<BankReconciliation>(`/bank-reconciliations/${id}`),
  start: (request: StartBankReconciliationRequest) =>
    api.post<BankReconciliation>("/bank-reconciliations", request),
  setLineReconciled: (id: string, lineId: string, reconciled: boolean) =>
    api.post<BankReconciliation>(`/bank-reconciliations/${id}/lines/${lineId}`, { reconciled }),
  complete: (id: string) => api.post<BankReconciliation>(`/bank-reconciliations/${id}/complete`),
  cancel: (id: string) => api.post<BankReconciliation>(`/bank-reconciliations/${id}/cancel`),
};
