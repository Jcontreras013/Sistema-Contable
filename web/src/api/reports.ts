import { api, downloadFile } from "@/api/client";
import type {
  BalanceSheetResponse,
  DashboardKpisResponse,
  GeneralLedgerResponse,
  IncomeStatementResponse,
  TrialBalanceResponse,
} from "@/types/reports";

export const reportsApi = {
  trialBalance: (asOf?: string) => api.get<TrialBalanceResponse>("/reports/trial-balance", { asOf }),
  balanceSheet: (asOf?: string) => api.get<BalanceSheetResponse>("/reports/balance-sheet", { asOf }),
  incomeStatement: (from?: string, to?: string) =>
    api.get<IncomeStatementResponse>("/reports/income-statement", { from, to }),
  generalLedger: (accountId: string, from?: string, to?: string) =>
    api.get<GeneralLedgerResponse>(`/reports/general-ledger/${accountId}`, { from, to }),
  dashboardKpis: (from?: string, to?: string) =>
    api.get<DashboardKpisResponse>("/reports/dashboard-kpis", { from, to }),
  exportTrialBalance: (asOf?: string) => downloadFile("/reports/trial-balance/export", { asOf }),
  exportBalanceSheet: (asOf?: string) => downloadFile("/reports/balance-sheet/export", { asOf }),
  exportIncomeStatement: (from?: string, to?: string) =>
    downloadFile("/reports/income-statement/export", { from, to }),
  exportGeneralLedger: (accountId: string, from?: string, to?: string) =>
    downloadFile(`/reports/general-ledger/${accountId}/export`, { from, to }),
};
