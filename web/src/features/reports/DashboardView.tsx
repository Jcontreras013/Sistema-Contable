import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownCircle, ArrowUpCircle, Landmark, Scale, Wallet } from "lucide-react";
import { reportsApi } from "@/api/reports";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";

export function DashboardView() {
  const { data: kpis, isLoading } = useQuery({ queryKey: ["dashboard-kpis"], queryFn: () => reportsApi.dashboardKpis() });

  if (isLoading || !kpis) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  const netIncome = Number(kpis.netIncomeInPeriod);
  const chartData = kpis.monthlySeries.map((m) => ({
    month: m.month,
    Ingresos: Number(m.revenue),
    Gastos: Number(m.expense),
  }));
  const categoryData = kpis.expenseByCategory.slice(0, 8).map((c) => ({
    name: c.accountName,
    Monto: Number(c.amount),
  }));

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">Del {kpis.from} al {kpis.to}</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Ingresos del período" value={formatMoney(kpis.revenueInPeriod)} icon={ArrowUpCircle} tone="positive" />
        <KpiCard label="Gastos del período" value={formatMoney(kpis.expensesInPeriod)} icon={ArrowDownCircle} tone="negative" />
        <KpiCard
          label="Utilidad neta del período"
          value={formatMoney(kpis.netIncomeInPeriod)}
          icon={Scale}
          tone={netIncome >= 0 ? "positive" : "negative"}
        />
        <KpiCard label="Caja en Lempiras" value={formatMoney(kpis.cashBalanceHnl, "HNL")} icon={Wallet} />
        <KpiCard label="Caja en Dólares" value={formatMoney(kpis.cashBalanceUsd, "USD")} icon={Wallet} />
        <KpiCard label="Cuentas por cobrar" value={formatMoney(kpis.accountsReceivableOutstanding)} icon={Landmark} />
        <KpiCard label="Cuentas por pagar" value={formatMoney(kpis.accountsPayableOutstanding)} icon={Landmark} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs. gastos por mes</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={2}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" width={40} />
                <Tooltip
                  formatter={(value) => formatMoney(Number(value))}
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Ingresos" fill="var(--color-chart-revenue)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Gastos" fill="var(--color-chart-expense)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoría (período)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {categoryData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">Sin gastos en el período.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={140}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip
                    formatter={(value) => formatMoney(Number(value))}
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="Monto" fill="var(--color-chart-expense)" radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
