package com.proyectofinanzas.backend.domain.report

import com.proyectofinanzas.backend.common.xlsxResponse
import com.proyectofinanzas.backend.domain.export.ExcelExportService
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/v1/reports")
class ReportController(
    private val reportService: ReportService,
    private val excelExportService: ExcelExportService,
) {

    @GetMapping("/trial-balance")
    fun trialBalance(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) asOf: LocalDate?,
    ): TrialBalanceResponse = reportService.trialBalance(asOf ?: LocalDate.now())

    @GetMapping("/trial-balance/export")
    fun trialBalanceExport(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) asOf: LocalDate?,
    ): ResponseEntity<ByteArray> {
        val report = reportService.trialBalance(asOf ?: LocalDate.now())
        return xlsxResponse(excelExportService.trialBalance(report), "balance-comprobacion.xlsx")
    }

    @GetMapping("/balance-sheet")
    fun balanceSheet(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) asOf: LocalDate?,
    ): BalanceSheetResponse = reportService.balanceSheet(asOf ?: LocalDate.now())

    @GetMapping("/balance-sheet/export")
    fun balanceSheetExport(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) asOf: LocalDate?,
    ): ResponseEntity<ByteArray> {
        val report = reportService.balanceSheet(asOf ?: LocalDate.now())
        return xlsxResponse(excelExportService.balanceSheet(report), "balance-general.xlsx")
    }

    @GetMapping("/income-statement")
    fun incomeStatement(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
    ): IncomeStatementResponse {
        val effectiveTo = to ?: LocalDate.now()
        val effectiveFrom = from ?: effectiveTo.withDayOfMonth(1)
        return reportService.incomeStatement(effectiveFrom, effectiveTo)
    }

    @GetMapping("/income-statement/export")
    fun incomeStatementExport(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
    ): ResponseEntity<ByteArray> {
        val effectiveTo = to ?: LocalDate.now()
        val effectiveFrom = from ?: effectiveTo.withDayOfMonth(1)
        val report = reportService.incomeStatement(effectiveFrom, effectiveTo)
        return xlsxResponse(excelExportService.incomeStatement(report), "estado-resultados.xlsx")
    }

    @GetMapping("/general-ledger/{accountId}")
    fun generalLedger(
        @PathVariable accountId: UUID,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
    ): GeneralLedgerResponse {
        val effectiveTo = to ?: LocalDate.now()
        val effectiveFrom = from ?: effectiveTo.withDayOfMonth(1)
        return reportService.generalLedger(accountId, effectiveFrom, effectiveTo)
    }

    @GetMapping("/general-ledger/{accountId}/export")
    fun generalLedgerExport(
        @PathVariable accountId: UUID,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
    ): ResponseEntity<ByteArray> {
        val effectiveTo = to ?: LocalDate.now()
        val effectiveFrom = from ?: effectiveTo.withDayOfMonth(1)
        val report = reportService.generalLedger(accountId, effectiveFrom, effectiveTo)
        return xlsxResponse(excelExportService.generalLedger(report), "mayor-${report.accountCode}.xlsx")
    }

    @GetMapping("/dashboard-kpis")
    fun dashboardKpis(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
    ): DashboardKpisResponse {
        val effectiveTo = to ?: LocalDate.now()
        val effectiveFrom = from ?: effectiveTo.withDayOfMonth(1)
        return reportService.dashboardKpis(effectiveFrom, effectiveTo)
    }
}
