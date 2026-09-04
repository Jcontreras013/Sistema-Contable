package com.proyectofinanzas.backend.domain.invoice

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface InvoiceRepository : JpaRepository<Invoice, UUID> {
    fun findAllByOrderByIssueDateDescInvoiceNumberDesc(pageable: Pageable): Page<Invoice>
    fun findAllByOrderByIssueDateDescInvoiceNumberDesc(): List<Invoice>

    @Query(
        """
        select i from Invoice i
        where (:search is null or :search = ''
            or lower(i.party.name) like lower(concat('%', :search, '%'))
            or lower(i.correlativo) like lower(concat('%', :search, '%'))
            or str(i.invoiceNumber) like concat('%', :search, '%'))
        order by i.issueDate desc, i.invoiceNumber desc
        """
    )
    fun search(@Param("search") search: String?, pageable: Pageable): Page<Invoice>
}

interface InvoiceLineRepository : JpaRepository<InvoiceLine, UUID> {
    fun findByInvoiceIdOrderByLineNumberAsc(invoiceId: UUID): List<InvoiceLine>
}
