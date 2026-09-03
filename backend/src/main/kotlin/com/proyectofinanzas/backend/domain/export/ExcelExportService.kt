package com.proyectofinanzas.backend.domain.export

import com.proyectofinanzas.backend.domain.invoice.InvoiceResponse
import com.proyectofinanzas.backend.domain.report.BalanceSheetResponse
import com.proyectofinanzas.backend.domain.report.GeneralLedgerResponse
import com.proyectofinanzas.backend.domain.report.IncomeStatementResponse
import com.proyectofinanzas.backend.domain.report.TrialBalanceResponse
import org.apache.poi.ss.usermodel.Cell
import org.apache.poi.ss.usermodel.CellStyle
import org.apache.poi.ss.usermodel.Sheet
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream
import java.math.BigDecimal

/**
 * Export a .xlsx. No usa autoSizeColumn a propósito: esa función de Apache POI mide texto con
 * AWT/fontconfig, que no está garantizado en la imagen JRE Alpine donde corre el backend — en su
 * lugar se fijan anchos de columna razonables.
 */
@Service
class ExcelExportService {

    fun trialBalance(report: TrialBalanceResponse): ByteArray = buildWorkbook("Balance de comprobación") { sheet, style ->
        header(sheet, style, "Código", "Cuenta", "Tipo", "Débito", "Crédito")
        report.lines.forEachIndexed { i, l ->
            row(sheet, i + 1, l.code, l.name, l.type.name, l.debit, l.credit)
        }
        row(sheet, report.lines.size + 1, "", "", "TOTAL", report.totalDebit, report.totalCredit)
        widths(sheet, 12, 40, 14, 16, 16)
    }

    fun balanceSheet(report: BalanceSheetResponse): ByteArray = buildWorkbook("Balance general") { sheet, style ->
        header(sheet, style, "Código", "Cuenta", "Saldo")
        var r = 1
        row(sheet, r++, "", "ACTIVOS", "")
        report.assets.forEach { row(sheet, r++, it.code, it.name, it.balance) }
        row(sheet, r++, "", "Total activos", report.totalAssets)
        r++
        row(sheet, r++, "", "PASIVOS", "")
        report.liabilities.forEach { row(sheet, r++, it.code, it.name, it.balance) }
        row(sheet, r++, "", "Total pasivos", report.totalLiabilities)
        r++
        row(sheet, r++, "", "PATRIMONIO", "")
        report.equity.forEach { row(sheet, r++, it.code, it.name, it.balance) }
        row(sheet, r++, "", "Total patrimonio", report.totalEquity)
        row(sheet, r++, "", "Utilidad del ejercicio (no cerrada)", report.currentYearEarnings)
        widths(sheet, 12, 44, 16)
    }

    fun incomeStatement(report: IncomeStatementResponse): ByteArray = buildWorkbook("Estado de resultados") { sheet, style ->
        header(sheet, style, "Código", "Cuenta", "Monto")
        var r = 1
        row(sheet, r++, "", "INGRESOS", "")
        report.income.forEach { row(sheet, r++, it.code, it.name, it.amount) }
        row(sheet, r++, "", "Total ingresos", report.totalIncome)
        r++
        row(sheet, r++, "", "GASTOS", "")
        report.expenses.forEach { row(sheet, r++, it.code, it.name, it.amount) }
        row(sheet, r++, "", "Total gastos", report.totalExpenses)
        r++
        row(sheet, r++, "", "Utilidad neta", report.netIncome)
        widths(sheet, 12, 44, 16)
    }

    fun generalLedger(report: GeneralLedgerResponse): ByteArray =
        buildWorkbook("Mayor - ${report.accountCode}") { sheet, style ->
            header(sheet, style, "Asiento", "Fecha", "Descripción", "Débito", "Crédito", "Saldo")
            row(sheet, 1, "", "", "Saldo inicial", "", "", report.openingBalance)
            report.lines.forEachIndexed { i, l ->
                row(sheet, i + 2, l.entryNumber, l.entryDate.toString(), l.description, l.debit, l.credit, l.runningBalance)
            }
            row(sheet, report.lines.size + 2, "", "", "Saldo final", "", "", report.closingBalance)
            widths(sheet, 10, 12, 40, 14, 14, 16)
        }

    fun invoices(invoices: List<InvoiceResponse>): ByteArray = buildWorkbook("Facturas") { sheet, style ->
        header(
            sheet, style, "No.", "Correlativo", "Cliente", "Emisión", "Vencimiento",
            "Moneda", "Total", "Saldo pendiente", "Estado",
        )
        invoices.forEachIndexed { i, inv ->
            row(
                sheet, i + 1, inv.invoiceNumber, inv.correlativo ?: "", inv.partyName,
                inv.issueDate.toString(), inv.dueDate.toString(), inv.currency.name,
                inv.total, inv.balanceInBase, inv.status.name,
            )
        }
        widths(sheet, 8, 20, 30, 12, 12, 8, 14, 16, 14)
    }

    private fun buildWorkbook(sheetName: String, fill: (Sheet, CellStyle) -> Unit): ByteArray {
        XSSFWorkbook().use { wb ->
            val sheet = wb.createSheet(sheetName)
            val headerStyle = wb.createCellStyle().apply {
                setFont(wb.createFont().apply { bold = true })
            }
            fill(sheet, headerStyle)
            val out = ByteArrayOutputStream()
            wb.write(out)
            return out.toByteArray()
        }
    }

    private fun header(sheet: Sheet, style: CellStyle, vararg values: String) {
        val row = sheet.createRow(0)
        values.forEachIndexed { i, v -> row.createCell(i).apply { setCellValue(v); cellStyle = style } }
    }

    private fun row(sheet: Sheet, index: Int, vararg values: Any?) {
        val row = sheet.createRow(index)
        values.forEachIndexed { i, v -> setCell(row.createCell(i), v) }
    }

    private fun setCell(cell: Cell, value: Any?) {
        when (value) {
            null -> cell.setCellValue("")
            is BigDecimal -> cell.setCellValue(value.toDouble())
            is Long -> cell.setCellValue(value.toDouble())
            is Int -> cell.setCellValue(value.toDouble())
            else -> cell.setCellValue(value.toString())
        }
    }

    private fun widths(sheet: Sheet, vararg charWidths: Int) {
        charWidths.forEachIndexed { i, w -> sheet.setColumnWidth(i, w * 256) }
    }
}
