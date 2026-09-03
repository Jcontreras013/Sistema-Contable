package com.proyectofinanzas.backend.domain.invoice

import com.proyectofinanzas.backend.common.xlsxResponse
import com.proyectofinanzas.backend.domain.export.ExcelExportService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/invoices")
class InvoiceController(
    private val invoiceService: InvoiceService,
    private val excelExportService: ExcelExportService,
) {
    @GetMapping
    fun list(pageable: Pageable): Page<InvoiceResponse> = invoiceService.list(pageable)

    @GetMapping("/export")
    fun export(): ResponseEntity<ByteArray> {
        val bytes = excelExportService.invoices(invoiceService.listAll())
        return xlsxResponse(bytes, "facturas.xlsx")
    }

    @GetMapping("/{id}")
    fun get(@PathVariable id: UUID): InvoiceResponse = invoiceService.get(id)

    @GetMapping("/{id}/pdf", produces = [MediaType.APPLICATION_PDF_VALUE])
    fun pdf(@PathVariable id: UUID): ResponseEntity<ByteArray> {
        val bytes = invoiceService.renderPdf(id)
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"factura-$id.pdf\"")
            .contentType(MediaType.APPLICATION_PDF)
            .body(bytes)
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    fun create(@Valid @RequestBody request: CreateInvoiceRequest): InvoiceResponse = invoiceService.create(request)

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    fun cancel(@PathVariable id: UUID): InvoiceResponse = invoiceService.cancel(id)

    @PostMapping("/{id}/send-email")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    fun sendEmail(@PathVariable id: UUID): InvoiceResponse = invoiceService.sendByEmail(id)
}
