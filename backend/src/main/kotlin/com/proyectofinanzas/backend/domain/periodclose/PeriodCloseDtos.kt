package com.proyectofinanzas.backend.domain.periodclose

import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class ClosePeriodRequest(
    @field:NotNull val periodEndDate: LocalDate,
)

data class PeriodCloseResponse(
    val id: UUID,
    val periodEndDate: LocalDate,
    val netIncome: BigDecimal,
    val journalEntryId: UUID?,
    val closedByName: String,
    val createdAt: Instant,
) {
    companion object {
        fun from(periodClose: PeriodClose) = PeriodCloseResponse(
            id = requireNotNull(periodClose.id),
            periodEndDate = periodClose.periodEndDate,
            netIncome = periodClose.netIncome,
            journalEntryId = periodClose.journalEntry?.id,
            closedByName = periodClose.closedBy.fullName,
            createdAt = requireNotNull(periodClose.createdAt),
        )
    }
}
