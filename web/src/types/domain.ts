import type { Currency, Role } from "@/types/common";

export type { Role } from "@/types/common";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";

export type AccountSystemRole =
  | "ACCOUNTS_RECEIVABLE"
  | "ACCOUNTS_PAYABLE"
  | "SALES_REVENUE_DEFAULT"
  | "TAX_PAYABLE"
  | "CASH_HNL"
  | "CASH_USD";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId: string | null;
  allowsPosting: boolean;
  systemRole: AccountSystemRole | null;
  isActive: boolean;
  createdAt: string;
}

export type PartyType = "CUSTOMER" | "VENDOR" | "BOTH";
export type TaxRegime = "ORDINARIO" | "SIMPLIFICADO";

export interface Party {
  id: string;
  type: PartyType;
  name: string;
  rtn: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  taxRegime: TaxRegime | null;
  isrWithholdingAgent: boolean;
  isvWithholdingAgent: boolean;
  withholdingRate: string | null;
  additionalEmails: string[];
  createdAt: string;
}

export interface ExchangeRate {
  id: string;
  rateDate: string;
  rate: string;
  createdByName: string;
  createdAt: string;
}

export type JournalSourceType = "MANUAL" | "INVOICE" | "EXPENSE" | "PAYMENT" | "REVERSAL";

export interface JournalEntryLine {
  id: string;
  lineNumber: number;
  accountId: string;
  accountCode: string;
  accountName: string;
  partyId: string | null;
  partyName: string | null;
  debit: string;
  credit: string;
  description: string | null;
}

export interface JournalEntry {
  id: string;
  entryNumber: number;
  entryDate: string;
  description: string;
  sourceType: JournalSourceType;
  sourceId: string | null;
  reversalOfId: string | null;
  createdByName: string;
  createdAt: string;
  lines: JournalEntryLine[];
}

export type InvoiceStatus = "ISSUED" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";

export interface InvoiceLine {
  id: string;
  lineNumber: number;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  lineTotal: string;
  accountId: string;
  accountName: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: number;
  partyId: string;
  partyName: string;
  issueDate: string;
  dueDate: string;
  currency: Currency;
  exchangeRate: string;
  subtotal: string;
  taxAmount: string;
  total: string;
  amountInBase: string;
  paidInBase: string;
  creditedInBase: string;
  debitedInBase: string;
  balanceInBase: string;
  status: InvoiceStatus;
  journalEntryId: string | null;
  notes: string | null;
  createdAt: string;
  lines: InvoiceLine[];
  correlativo: string | null;
  caiCode: string | null;
  caiEmissionLimitDate: string | null;
}

export type NoteType = "CREDIT" | "DEBIT";
export type NoteStatus = "ISSUED" | "CANCELLED";

export interface CreditDebitNote {
  id: string;
  noteNumber: number;
  invoiceId: string;
  invoiceNumber: number;
  type: NoteType;
  issueDate: string;
  reason: string;
  accountId: string;
  accountName: string;
  subtotal: string;
  taxAmount: string;
  total: string;
  amountInBase: string;
  status: NoteStatus;
  journalEntryId: string | null;
  correlativo: string | null;
  caiCode: string | null;
  caiEmissionLimitDate: string | null;
  createdAt: string;
}

export interface CompanyProfile {
  legalName: string;
  rtn: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface CaiAuthorization {
  id: string;
  caiCode: string;
  establishmentCode: string;
  emissionPointCode: string;
  documentTypeCode: string;
  rangeStart: number;
  rangeEnd: number;
  currentNumber: number;
  emissionLimitDate: string;
  isActive: boolean;
  createdByName: string;
  createdAt: string;
}

export type ExpensePaymentMethod = "CASH" | "BANK" | "CREDIT";
export type ExpenseStatus = "POSTED" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";

export interface Expense {
  id: string;
  expenseNumber: number;
  partyId: string | null;
  partyName: string | null;
  expenseDate: string;
  currency: Currency;
  exchangeRate: string;
  accountId: string;
  accountName: string;
  productId: string | null;
  productDescription: string | null;
  description: string;
  paymentMethod: ExpensePaymentMethod;
  amount: string;
  amountInBase: string;
  withheldInBase: string;
  paidInBase: string;
  balanceInBase: string;
  status: ExpenseStatus;
  journalEntryId: string | null;
  createdAt: string;
}

export interface Product {
  id: string;
  description: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  isActive: boolean;
  createdAt: string;
}

export type PaymentMethod = "CASH" | "BANK";

export interface Payment {
  id: string;
  paymentNumber: number;
  invoiceId: string | null;
  expenseId: string | null;
  amount: string;
  currency: Currency;
  exchangeRate: string;
  amountInBase: string;
  paymentDate: string;
  method: PaymentMethod;
  journalEntryId: string | null;
  createdAt: string;
}

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export interface AuditLogEntry {
  id: string;
  entityName: string;
  entityId: string;
  action: AuditAction;
  userName: string;
  occurredAt: string;
  oldValue: string | null;
  newValue: string | null;
}
