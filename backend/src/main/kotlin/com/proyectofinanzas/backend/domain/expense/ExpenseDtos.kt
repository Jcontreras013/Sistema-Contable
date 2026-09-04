package com.proyectofinanzas.backend.domain.expense

import com.proyectofinanzas.backend.common.Currency
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class CreateExpenseRequest(
    val partyId: UUID? = null,
    @field:NotNull val expenseDate: LocalDate,
    @field:NotNull val currency: Currency,
    val exchangeRate: BigDecimal? = null,
    /** Si se envía, la cuenta se toma del producto (ignora accountId). */
    val productId: UUID? = null,
    val accountId: UUID? = null,
    @field:NotBlank val description: String,
    @field:NotNull val paymentMethod: ExpensePaymentMethod,
    @field:NotNull @field:DecimalMin(value = "0.0001") val amount: BigDecimal,
)

data class ExpenseResponse(
    val id: UUID,
    val expenseNumber: Long,
    val partyId: UUID?,
    val partyName: String?,
    val expenseDate: LocalDate,
    val currency: Currency,
    val exchangeRate: BigDecimal,
    val accountId: UUID,
    val accountName: String,
    val productId: UUID?,
    val productDescription: String?,
    val description: String,
    val paymentMethod: ExpensePaymentMethod,
    val amount: BigDecimal,
    val amountInBase: BigDecimal,
    val paidInBase: BigDecimal,
    val balanceInBase: BigDecimal,
    val status: ExpenseStatus,
    val journalEntryId: UUID?,
    val createdAt: Instant,
)
