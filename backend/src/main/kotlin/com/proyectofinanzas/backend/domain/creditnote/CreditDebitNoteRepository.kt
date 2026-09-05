package com.proyectofinanzas.backend.domain.creditnote

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.math.BigDecimal
import java.util.UUID

interface CreditDebitNoteRepository : JpaRepository<CreditDebitNote, UUID> {
    fun findAllByInvoiceIdOrderByIssueDateDescNoteNumberDesc(invoiceId: UUID): List<CreditDebitNote>

    @Query(
        """
        select coalesce(sum(n.amountInBase), 0) from CreditDebitNote n
        where n.invoice.id = :invoiceId and n.type = :type and n.status = 'ISSUED'
        """
    )
    fun sumAmountInBaseByInvoiceIdAndType(
        @Param("invoiceId") invoiceId: UUID,
        @Param("type") type: NoteType,
    ): BigDecimal
}
