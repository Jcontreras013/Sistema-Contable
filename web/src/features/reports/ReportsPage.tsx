import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { BalanceSheetView } from "@/features/reports/BalanceSheetView";
import { DashboardView } from "@/features/reports/DashboardView";
import { IncomeStatementView } from "@/features/reports/IncomeStatementView";
import { TrialBalanceView } from "@/features/reports/TrialBalanceView";

const TABS = [
  { key: "panel", label: "Panel" },
  { key: "trial-balance", label: "Balance de comprobación" },
  { key: "balance-sheet", label: "Balance general" },
  { key: "income-statement", label: "Estado de resultados" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ReportsPage() {
  const [tab, setTab] = useState<TabKey>("panel");

  return (
    <div>
      <PageHeader title="Reportes financieros" description="Panel general y estados financieros de la empresa." />

      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "panel" && <DashboardView />}
      {tab === "trial-balance" && <TrialBalanceView />}
      {tab === "balance-sheet" && <BalanceSheetView />}
      {tab === "income-statement" && <IncomeStatementView />}
    </div>
  );
}
