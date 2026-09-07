package com.proyectofinanzas.backend.domain.bankreconciliation

import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class StartBankReconciliationRequest(
    @field:NotNull val accountId: UUID,
    @field:NotNull val statementDate: LocalDate,
    @field:NotNull val statementBalance: BigDecimal,
)

data class SetLineReconciledRequest(
    @field:NotNull val reconciled: Boolean,
)

data class BankReconciliationLineResponse(
    val id: UUID,
    val journalEntryId: UUID,
    val entryDate: LocalDate,
    val description: String?,
    val debit: BigDecimal,
    val credit: BigDecimal,
    val reconciled: Boolean,
)

data class BankReconciliationResponse(
    val id: UUID,
    val accountId: UUID,
    val accountName: String,
    val statementDate: LocalDate,
    val statementBalance: BigDecimal,
    val clearedBalance: BigDecimal,
    val difference: BigDecimal,
    val status: BankReconciliationStatus,
    val createdByName: String,
    val createdAt: Instant,
    val lines: List<BankReconciliationLineResponse>,
)
