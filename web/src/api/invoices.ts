import { api, downloadFile } from "@/api/client";
import type { Currency, PageResponse } from "@/types/common";
import type { Invoice } from "@/types/domain";

export interface InvoiceLineRequest {
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  accountId: string;
}

export interface CreateInvoiceRequest {
  partyId: string;
  issueDate: string;
  dueDate: string;
  currency: Currency;
  exchangeRate?: string | null;
  notes?: string;
  lines: InvoiceLineRequest[];
}

export const invoicesApi = {
  list: (page = 0, size = 20) => api.get<PageResponse<Invoice>>("/invoices", { page, size }),
  get: (id: string) => api.get<Invoice>(`/invoices/${id}`),
  create: (request: CreateInvoiceRequest) => api.post<Invoice>("/invoices", request),
  cancel: (id: string) => api.post<Invoice>(`/invoices/${id}/cancel`),
  sendEmail: (id: string) => api.post<Invoice>(`/invoices/${id}/send-email`),
  downloadPdf: (id: string) => downloadFile(`/invoices/${id}/pdf`),
  downloadExcel: () => downloadFile("/invoices/export"),
};
