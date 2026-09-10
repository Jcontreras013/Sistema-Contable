import type { AccountType } from "@/types/domain";

export interface TrialBalanceLine {
  accountId: string;
  code: string;
  name: string;
  type: AccountType;
  debit: string;
  credit: string;
}

export interface TrialBalanceResponse {
  asOf: string;
  lines: TrialBalanceLine[];
  totalDebit: string;
  totalCredit: string;
}

export interface BalanceSheetLine {
  accountId: string;
  code: string;
  name: string;
  parentId: string | null;
  balance: string;
}

export interface BalanceSheetResponse {
  asOf: string;
  assets: BalanceSheetLine[];
  liabilities: BalanceSheetLine[];
  equity: BalanceSheetLine[];
  totalAssets: string;
  totalLiabilities: string;
  totalEquity: string;
  currentYearEarnings: string;
  isBalanced: boolean;
}

export interface IncomeStatementLine {
  accountId: string;
  code: string;
  name: string;
  amount: string;
}

export interface IncomeStatementResponse {
  from: string;
  to: string;
  income: IncomeStatementLine[];
  expenses: IncomeStatementLine[];
  totalIncome: string;
  totalExpenses: string;
  netIncome: string;
}

export interface GeneralLedgerLine {
  journalEntryId: string;
  entryNumber: number;
  entryDate: string;
  description: string;
  debit: string;
  credit: string;
  runningBalance: string;
}

export interface GeneralLedgerResponse {
  accountId: string;
  accountCode: string;
  accountName: string;
  from: string;
  to: string;
  openingBalance: string;
  lines: GeneralLedgerLine[];
  closingBalance: string;
}

export interface AgingReportLine {
  partyId: string;
  partyName: string;
  current: string;
  days1To30: string;
  days31To60: string;
  days61To90: string;
  daysOver90: string;
  total: string;
}

export interface AgingReportResponse {
  asOf: string;
  lines: AgingReportLine[];
  totalCurrent: string;
  totalDays1To30: string;
  totalDays31To60: string;
  totalDays61To90: string;
  totalDaysOver90: string;
  grandTotal: string;
}

export interface MonthlyPoint {
  month: string;
  revenue: string;
  expense: string;
}

export interface CategoryPoint {
  accountName: string;
  amount: string;
}

export interface DashboardKpisResponse {
  from: string;
  to: string;
  revenueInPeriod: string;
  expensesInPeriod: string;
  netIncomeInPeriod: string;
  cashBalanceHnl: string;
  cashBalanceUsd: string;
  accountsReceivableOutstanding: string;
  accountsPayableOutstanding: string;
  monthlySeries: MonthlyPoint[];
  expenseByCategory: CategoryPoint[];
}
