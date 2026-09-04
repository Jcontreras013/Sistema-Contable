import { api } from "@/api/client";
import type { Currency, PageResponse } from "@/types/common";
import type { Expense, ExpensePaymentMethod } from "@/types/domain";

export interface CreateExpenseRequest {
  partyId?: string | null;
  expenseDate: string;
  currency: Currency;
  exchangeRate?: string | null;
  productId?: string | null;
  accountId?: string | null;
  description: string;
  paymentMethod: ExpensePaymentMethod;
  amount: string;
}

export const expensesApi = {
  list: (page = 0, size = 20, partyId?: string, search?: string) =>
    api.get<PageResponse<Expense>>("/expenses", { page, size, partyId, search }),
  get: (id: string) => api.get<Expense>(`/expenses/${id}`),
  create: (request: CreateExpenseRequest) => api.post<Expense>("/expenses", request),
  cancel: (id: string) => api.post<Expense>(`/expenses/${id}/cancel`),
};
