package com.proyectofinanzas.backend.domain.report

import com.proyectofinanzas.backend.domain.account.AccountType
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

data class TrialBalanceLine(
    val accountId: UUID,
    val code: String,
    val name: String,
    val type: AccountType,
    val debit: BigDecimal,
    val credit: BigDecimal,
)

data class TrialBalanceResponse(
    val asOf: LocalDate,
    val lines: List<TrialBalanceLine>,
    val totalDebit: BigDecimal,
    val totalCredit: BigDecimal,
)

data class BalanceSheetLine(
    val accountId: UUID,
    val code: String,
    val name: String,
    val parentId: UUID?,
    val balance: BigDecimal,
)

data class BalanceSheetResponse(
    val asOf: LocalDate,
    val assets: List<BalanceSheetLine>,
    val liabilities: List<BalanceSheetLine>,
    val equity: List<BalanceSheetLine>,
    val totalAssets: BigDecimal,
    val totalLiabilities: BigDecimal,
    val totalEquity: BigDecimal,
    /** Utilidad del ejercicio calculada en vivo (año a la fecha), no es un asiento de cierre. */
    val currentYearEarnings: BigDecimal,
    val isBalanced: Boolean,
)

data class IncomeStatementLine(
    val accountId: UUID,
    val code: String,
    val name: String,
    val amount: BigDecimal,
)

data class IncomeStatementResponse(
    val from: LocalDate,
    val to: LocalDate,
    val income: List<IncomeStatementLine>,
    val expenses: List<IncomeStatementLine>,
    val totalIncome: BigDecimal,
    val totalExpenses: BigDecimal,
    val netIncome: BigDecimal,
)

data class GeneralLedgerLine(
    val journalEntryId: UUID,
    val entryNumber: Long,
    val entryDate: LocalDate,
    val description: String,
    val debit: BigDecimal,
    val credit: BigDecimal,
    val runningBalance: BigDecimal,
)

data class GeneralLedgerResponse(
    val accountId: UUID,
    val accountCode: String,
    val accountName: String,
    val from: LocalDate,
    val to: LocalDate,
    val openingBalance: BigDecimal,
    val lines: List<GeneralLedgerLine>,
    val closingBalance: BigDecimal,
)

data class AgingReportLine(
    val partyId: UUID,
    val partyName: String,
    val current: BigDecimal,
    val days1To30: BigDecimal,
    val days31To60: BigDecimal,
    val days61To90: BigDecimal,
    val daysOver90: BigDecimal,
    val total: BigDecimal,
)

data class AgingReportResponse(
    val asOf: LocalDate,
    val lines: List<AgingReportLine>,
    val totalCurrent: BigDecimal,
    val totalDays1To30: BigDecimal,
    val totalDays31To60: BigDecimal,
    val totalDays61To90: BigDecimal,
    val totalDaysOver90: BigDecimal,
    val grandTotal: BigDecimal,
)

data class MonthlyPoint(
    val month: String,
    val revenue: BigDecimal,
    val expense: BigDecimal,
)

data class CategoryPoint(
    val accountName: String,
    val amount: BigDecimal,
)

data class DashboardKpisResponse(
    val from: LocalDate,
    val to: LocalDate,
    val revenueInPeriod: BigDecimal,
    val expensesInPeriod: BigDecimal,
    val netIncomeInPeriod: BigDecimal,
    val cashBalanceHnl: BigDecimal,
    val cashBalanceUsd: BigDecimal,
    val accountsReceivableOutstanding: BigDecimal,
    val accountsPayableOutstanding: BigDecimal,
    val monthlySeries: List<MonthlyPoint>,
    val expenseByCategory: List<CategoryPoint>,
)
