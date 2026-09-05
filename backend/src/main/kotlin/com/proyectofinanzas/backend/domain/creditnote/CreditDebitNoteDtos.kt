package com.proyectofinanzas.backend.domain.creditnote

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class CreateCreditDebitNoteRequest(
    @field:NotNull val invoiceId: UUID,
    @field:NotNull val type: NoteType,
    @field:NotNull val issueDate: LocalDate,
    @field:NotBlank val reason: String,
    @field:NotNull val accountId: UUID,
    @field:NotNull @field:DecimalMin(value = "0.0001") val subtotal: BigDecimal,
    @field:DecimalMin(value = "0") val taxAmount: BigDecimal = BigDecimal.ZERO,
)

data class CreditDebitNoteResponse(
    val id: UUID,
    val noteNumber: Long,
    val invoiceId: UUID,
    val invoiceNumber: Long,
    val type: NoteType,
    val issueDate: LocalDate,
    val reason: String,
    val accountId: UUID,
    val accountName: String,
    val subtotal: BigDecimal,
    val taxAmount: BigDecimal,
    val total: BigDecimal,
    val amountInBase: BigDecimal,
    val status: NoteStatus,
    val journalEntryId: UUID?,
    val correlativo: String?,
    val caiCode: String?,
    val caiEmissionLimitDate: LocalDate?,
    val createdAt: Instant,
) {
    companion object {
        fun from(note: CreditDebitNote) = CreditDebitNoteResponse(
            id = requireNotNull(note.id),
            noteNumber = note.noteNumber,
            invoiceId = requireNotNull(note.invoice.id),
            invoiceNumber = note.invoice.invoiceNumber,
            type = note.type,
            issueDate = note.issueDate,
            reason = note.reason,
            accountId = requireNotNull(note.account.id),
            accountName = note.account.name,
            subtotal = note.subtotal,
            taxAmount = note.taxAmount,
            total = note.total,
            amountInBase = note.amountInBase,
            status = note.status,
            journalEntryId = note.journalEntry?.id,
            correlativo = note.correlativo,
            caiCode = note.caiCode,
            caiEmissionLimitDate = note.caiEmissionLimitDate,
            createdAt = requireNotNull(note.createdAt),
        )
    }
}
