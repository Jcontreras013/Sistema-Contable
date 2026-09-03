package com.proyectofinanzas.backend.domain.fiscal

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder
import com.proyectofinanzas.backend.common.Currency
import com.proyectofinanzas.backend.common.HtmlUtils.escape
import com.proyectofinanzas.backend.domain.invoice.Invoice
import com.proyectofinanzas.backend.domain.invoice.InvoiceLine
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream
import java.math.BigDecimal
import java.text.DecimalFormat
import java.time.format.DateTimeFormatter

@Service
class InvoicePdfService {
    private val dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    private val moneyFmt = DecimalFormat("#,##0.00")

    fun render(invoice: Invoice, lines: List<InvoiceLine>, company: CompanyProfile?): ByteArray {
        val html = buildHtml(invoice, lines, company)
        val out = ByteArrayOutputStream()
        PdfRendererBuilder()
            .useFastMode()
            .withHtmlContent(html, null)
            .toStream(out)
            .run()
        return out.toByteArray()
    }

    private fun money(amount: BigDecimal, currency: Currency): String {
        val symbol = if (currency == Currency.USD) "$" else "L"
        return "$symbol ${moneyFmt.format(amount)}"
    }

    private fun buildHtml(invoice: Invoice, lines: List<InvoiceLine>, company: CompanyProfile?): String {
        val party = invoice.party
        val linesHtml = lines.joinToString("") { line ->
            """
            <tr>
                <td>${escape(line.description)}</td>
                <td class="num">${moneyFmt.format(line.quantity)}</td>
                <td class="num">${money(line.unitPrice, invoice.currency)}</td>
                <td class="num">${moneyFmt.format(line.taxRate)}%</td>
                <td class="num">${money(line.lineTotal, invoice.currency)}</td>
            </tr>
            """.trimIndent()
        }
        val companyName = escape(company?.legalName ?: "(Configura los datos de tu empresa en Configuración fiscal)")
        val companyRtn = escape(company?.rtn ?: "—")
        val companyAddress = escape(company?.address ?: "")
        val companyPhone = escape(company?.phone ?: "")
        val correlativo = escape(invoice.correlativo ?: "—")
        val caiCode = escape(invoice.caiCode ?: "—")
        val caiLimit = invoice.caiEmissionLimitDate?.format(dateFmt) ?: "—"

        return """
        <html>
        <head>
        <meta charset="UTF-8"/>
        <style>
            @page { size: letter; margin: 2cm; }
            body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; color: #1a1a1a; }
            h1 { font-size: 16pt; margin: 0 0 2pt 0; }
            .muted { color: #555555; }
            .header { width: 100%; border-bottom: 2pt solid #1a1a1a; padding-bottom: 10pt; margin-bottom: 14pt; }
            .header td { vertical-align: top; }
            .fiscal-box { border: 1pt solid #1a1a1a; padding: 8pt; font-size: 9pt; }
            .bill-to { margin-bottom: 14pt; }
            table.lines { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
            table.lines th { text-align: left; background: #eeeeee; padding: 6pt; font-size: 9pt; border-bottom: 1pt solid #999999; }
            table.lines td { padding: 6pt; border-bottom: 0.5pt solid #cccccc; font-size: 9.5pt; }
            .num { text-align: right; }
            table.totals { width: 260pt; margin-left: auto; }
            table.totals td { padding: 3pt 6pt; }
            table.totals tr.grand td { font-weight: bold; font-size: 11pt; border-top: 1pt solid #1a1a1a; }
            .footer { margin-top: 24pt; font-size: 8pt; color: #555555; border-top: 0.5pt solid #cccccc; padding-top: 8pt; }
        </style>
        </head>
        <body>
            <table class="header">
                <tr>
                    <td style="width: 60%;">
                        <h1>$companyName</h1>
                        <div class="muted">RTN: $companyRtn</div>
                        <div class="muted">$companyAddress</div>
                        <div class="muted">$companyPhone</div>
                    </td>
                    <td style="width: 40%;">
                        <div class="fiscal-box">
                            <div><strong>FACTURA</strong></div>
                            <div>No. $correlativo</div>
                            <div>CAI: $caiCode</div>
                            <div>Fecha límite de emisión: $caiLimit</div>
                            <div>Fecha de emisión: ${invoice.issueDate.format(dateFmt)}</div>
                            <div>Fecha de vencimiento: ${invoice.dueDate.format(dateFmt)}</div>
                        </div>
                    </td>
                </tr>
            </table>

            <div class="bill-to">
                <strong>Cliente:</strong> ${escape(party.name)}<br/>
                RTN: ${escape(party.rtn ?: "—")}<br/>
                ${escape(party.address ?: "")}<br/>
                ${escape(party.email ?: "")} ${escape(party.phone ?: "")}
            </div>

            <table class="lines">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th class="num">Cantidad</th>
                        <th class="num">Precio unitario</th>
                        <th class="num">ISV</th>
                        <th class="num">Total</th>
                    </tr>
                </thead>
                <tbody>
                    $linesHtml
                </tbody>
            </table>

            <table class="totals">
                <tr><td>Subtotal</td><td class="num">${money(invoice.subtotal, invoice.currency)}</td></tr>
                <tr><td>ISV</td><td class="num">${money(invoice.taxAmount, invoice.currency)}</td></tr>
                <tr class="grand"><td>Total</td><td class="num">${money(invoice.total, invoice.currency)}</td></tr>
            </table>

            <div class="footer">
                Documento generado por Sistema Contable. El código CAI autoriza la emisión de este
                documento ante el SAR de Honduras dentro del rango y fecha límite indicados arriba.
            </div>
        </body>
        </html>
        """.trimIndent()
    }
}
