package com.proyectofinanzas.backend.domain.invoice

import com.proyectofinanzas.backend.common.Currency
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class InvoiceLineRequest(
    @field:NotBlank val description: String,
    @field:NotNull @field:Positive val quantity: BigDecimal,
    @field:NotNull @field:DecimalMin(value = "0") val unitPrice: BigDecimal,
    @field:NotNull @field:DecimalMin(value = "0") val taxRate: BigDecimal = BigDecimal("15.00"),
    @field:NotNull val accountId: UUID,
)

data class CreateInvoiceRequest(
    @field:NotNull val partyId: UUID,
    @field:NotNull val issueDate: LocalDate,
    @field:NotNull val dueDate: LocalDate,
    @field:NotNull val currency: Currency,
    /** Solo aplica si currency = USD; si se omite se usa la tasa vigente registrada. */
    val exchangeRate: BigDecimal? = null,
    val notes: String? = null,
    @field:NotEmpty @field:Valid val lines: List<InvoiceLineRequest>,
)

data class InvoiceLineResponse(
    val id: UUID,
    val lineNumber: Int,
    val description: String,
    val quantity: BigDecimal,
    val unitPrice: BigDecimal,
    val taxRate: BigDecimal,
    val lineTotal: BigDecimal,
    val accountId: UUID,
    val accountName: String,
)

data class InvoiceResponse(
    val id: UUID,
    val invoiceNumber: Long,
    val partyId: UUID,
    val partyName: String,
    val issueDate: LocalDate,
    val dueDate: LocalDate,
    val currency: Currency,
    val exchangeRate: BigDecimal,
    val subtotal: BigDecimal,
    val taxAmount: BigDecimal,
    val total: BigDecimal,
    val amountInBase: BigDecimal,
    val paidInBase: BigDecimal,
    val balanceInBase: BigDecimal,
    val status: InvoiceStatus,
    val journalEntryId: UUID?,
    val notes: String?,
    val createdAt: Instant,
    val lines: List<InvoiceLineResponse>,
    val correlativo: String?,
    val caiCode: String?,
    val caiEmissionLimitDate: LocalDate?,
)
