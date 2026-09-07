import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/auth/RequireAuth";
import { RequireRole } from "@/auth/RequireRole";
import { LoginPage } from "@/auth/LoginPage";
import { ForbiddenPage, NotFoundPage } from "@/app/StatusPages";
import { AccountsPage } from "@/features/accounts/AccountsPage";
import { PartiesPage } from "@/features/parties/PartiesPage";
import { PartyDetailPage } from "@/features/parties/PartyDetailPage";
import { ProductsPage } from "@/features/products/ProductsPage";
import { ExchangeRatesPage } from "@/features/exchange-rates/ExchangeRatesPage";
import { BankReconciliationPage } from "@/features/bank-reconciliation/BankReconciliationPage";
import { JournalEntriesListPage } from "@/features/journal-entries/JournalEntriesListPage";
import { JournalEntryNewPage } from "@/features/journal-entries/JournalEntryNewPage";
import { JournalEntryDetailPage } from "@/features/journal-entries/JournalEntryDetailPage";
import { InvoicesListPage } from "@/features/invoices/InvoicesListPage";
import { InvoiceNewPage } from "@/features/invoices/InvoiceNewPage";
import { InvoiceDetailPage } from "@/features/invoices/InvoiceDetailPage";
import { ExpensesListPage } from "@/features/expenses/ExpensesListPage";
import { ExpenseNewPage } from "@/features/expenses/ExpenseNewPage";
import { ExpenseDetailPage } from "@/features/expenses/ExpenseDetailPage";
import { ReportsPage } from "@/features/reports/ReportsPage";
import { GeneralLedgerPage } from "@/features/reports/GeneralLedgerPage";
import { UsersPage } from "@/features/users/UsersPage";
import { AuditLogPage } from "@/features/audit-log/AuditLogPage";
import { FiscalSettingsPage } from "@/features/fiscal/FiscalSettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/reports" replace />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="parties" element={<PartiesPage />} />
          <Route path="parties/:id" element={<PartyDetailPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="journal-entries" element={<JournalEntriesListPage />} />
          <Route path="journal-entries/new" element={<JournalEntryNewPage />} />
          <Route path="journal-entries/:id" element={<JournalEntryDetailPage />} />
          <Route path="invoices" element={<InvoicesListPage />} />
          <Route path="invoices/new" element={<InvoiceNewPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="expenses" element={<ExpensesListPage />} />
          <Route path="expenses/new" element={<ExpenseNewPage />} />
          <Route path="expenses/:id" element={<ExpenseDetailPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/general-ledger/:accountId" element={<GeneralLedgerPage />} />

          <Route element={<RequireRole roles={["ADMIN", "ACCOUNTANT"]} />}>
            <Route path="exchange-rates" element={<ExchangeRatesPage />} />
            <Route path="bank-reconciliation" element={<BankReconciliationPage />} />
          </Route>
          <Route element={<RequireRole roles={["ADMIN"]} />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="fiscal-settings" element={<FiscalSettingsPage />} />
          </Route>
          <Route element={<RequireRole roles={["ADMIN", "AUDITOR"]} />}>
            <Route path="audit-log" element={<AuditLogPage />} />
          </Route>

          <Route path="403" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
