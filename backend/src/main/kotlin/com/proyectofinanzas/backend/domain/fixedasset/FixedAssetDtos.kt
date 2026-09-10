package com.proyectofinanzas.backend.domain.fixedasset

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.PositiveOrZero
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class CreateFixedAssetRequest(
    @field:NotBlank val description: String,
    @field:NotNull val accountId: UUID,
    @field:NotNull val depreciationExpenseAccountId: UUID,
    @field:NotNull val accumulatedDepreciationAccountId: UUID,
    @field:NotNull val acquisitionDate: LocalDate,
    @field:NotNull @field:DecimalMin(value = "0.0001") val cost: BigDecimal,
    @field:PositiveOrZero val residualValue: BigDecimal = BigDecimal.ZERO,
    @field:Min(1) val usefulLifeMonths: Int,
)

data class RunDepreciationRequest(
    @field:NotNull val periodDate: LocalDate,
)

data class DepreciationRunItem(
    val fixedAssetId: UUID,
    val description: String,
    val amount: BigDecimal,
    val journalEntryId: UUID,
)

data class DepreciationRunResult(
    val period: LocalDate,
    val items: List<DepreciationRunItem>,
)

data class FixedAssetResponse(
    val id: UUID,
    val description: String,
    val accountId: UUID,
    val accountName: String,
    val depreciationExpenseAccountId: UUID,
    val depreciationExpenseAccountName: String,
    val accumulatedDepreciationAccountId: UUID,
    val accumulatedDepreciationAccountName: String,
    val acquisitionDate: LocalDate,
    val cost: BigDecimal,
    val residualValue: BigDecimal,
    val usefulLifeMonths: Int,
    val monthlyDepreciation: BigDecimal,
    val accumulatedDepreciation: BigDecimal,
    val bookValue: BigDecimal,
    val lastDepreciationPeriod: LocalDate?,
    val status: FixedAssetStatus,
    val disposalDate: LocalDate?,
    val createdAt: Instant,
) {
    companion object {
        fun from(asset: FixedAsset): FixedAssetResponse {
            val monthlyDepreciation = (asset.cost - asset.residualValue)
                .divide(BigDecimal(asset.usefulLifeMonths), 4, java.math.RoundingMode.HALF_UP)
            return FixedAssetResponse(
                id = requireNotNull(asset.id),
                description = asset.description,
                accountId = requireNotNull(asset.account.id),
                accountName = asset.account.name,
                depreciationExpenseAccountId = requireNotNull(asset.depreciationExpenseAccount.id),
                depreciationExpenseAccountName = asset.depreciationExpenseAccount.name,
                accumulatedDepreciationAccountId = requireNotNull(asset.accumulatedDepreciationAccount.id),
                accumulatedDepreciationAccountName = asset.accumulatedDepreciationAccount.name,
                acquisitionDate = asset.acquisitionDate,
                cost = asset.cost,
                residualValue = asset.residualValue,
                usefulLifeMonths = asset.usefulLifeMonths,
                monthlyDepreciation = monthlyDepreciation,
                accumulatedDepreciation = asset.accumulatedDepreciation,
                bookValue = asset.cost - asset.accumulatedDepreciation,
                lastDepreciationPeriod = asset.lastDepreciationPeriod,
                status = asset.status,
                disposalDate = asset.disposalDate,
                createdAt = requireNotNull(asset.createdAt),
            )
        }
    }
}
