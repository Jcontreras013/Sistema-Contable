package com.proyectofinanzas.backend.domain.invoice

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface InvoiceRepository : JpaRepository<Invoice, UUID> {
    fun findAllByOrderByIssueDateDescInvoiceNumberDesc(pageable: Pageable): Page<Invoice>
    fun findAllByOrderByIssueDateDescInvoiceNumberDesc(): List<Invoice>
}

interface InvoiceLineRepository : JpaRepository<InvoiceLine, UUID> {
    fun findByInvoiceIdOrderByLineNumberAsc(invoiceId: UUID): List<InvoiceLine>
}
