import { api } from "@/api/client";
import type { CreditDebitNote, NoteType } from "@/types/domain";

export interface CreateCreditDebitNoteRequest {
  invoiceId: string;
  type: NoteType;
  issueDate: string;
  reason: string;
  accountId: string;
  subtotal: string;
  taxAmount: string;
}

export const creditDebitNotesApi = {
  listByInvoice: (invoiceId: string) =>
    api.get<CreditDebitNote[]>("/credit-debit-notes", { invoiceId }),
  create: (request: CreateCreditDebitNoteRequest) =>
    api.post<CreditDebitNote>("/credit-debit-notes", request),
  cancel: (id: string) => api.post<CreditDebitNote>(`/credit-debit-notes/${id}/cancel`),
};
