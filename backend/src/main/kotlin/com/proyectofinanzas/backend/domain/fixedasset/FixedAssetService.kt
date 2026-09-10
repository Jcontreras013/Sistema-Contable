package com.proyectofinanzas.backend.domain.fixedasset

import com.proyectofinanzas.backend.common.BusinessRuleException
import com.proyectofinanzas.backend.common.MoneyUtils
import com.proyectofinanzas.backend.common.NotFoundException
import com.proyectofinanzas.backend.domain.account.AccountRepository
import com.proyectofinanzas.backend.domain.journal.JournalSourceType
import com.proyectofinanzas.backend.domain.journal.PostingLine
import com.proyectofinanzas.backend.domain.journal.PostingService
import com.proyectofinanzas.backend.domain.user.UserRepository
import com.proyectofinanzas.backend.security.SecurityUtils
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class FixedAssetService(
    private val fixedAssetRepository: FixedAssetRepository,
    private val accountRepository: AccountRepository,
    private val userRepository: UserRepository,
    private val postingService: PostingService,
) {

    fun create(request: CreateFixedAssetRequest): FixedAssetResponse {
        val account = accountRepository.findById(request.accountId)
            .orElseThrow { NotFoundException("Cuenta de activo no encontrada") }
        val expenseAccount = accountRepository.findById(request.depreciationExpenseAccountId)
            .orElseThrow { NotFoundException("Cuenta de gasto de depreciación no encontrada") }
        val accumulatedAccount = accountRepository.findById(request.accumulatedDepreciationAccountId)
            .orElseThrow { NotFoundException("Cuenta de depreciación acumulada no encontrada") }

        val cost = MoneyUtils.round(request.cost)
        val residualValue = MoneyUtils.round(request.residualValue)
        if (residualValue.compareTo(cost) >= 0) {
            throw BusinessRuleException("El valor residual debe ser menor al costo del activo")
        }

        val createdBy = userRepository.findById(SecurityUtils.currentUserId())
            .orElseThrow { NotFoundException("Usuario no encontrado") }

        val asset = FixedAsset(
            description = request.description,
            account = account,
            depreciationExpenseAccount = expenseAccount,
            accumulatedDepreciationAccount = accumulatedAccount,
            acquisitionDate = request.acquisitionDate,
            cost = cost,
            residualValue = residualValue,
            usefulLifeMonths = request.usefulLifeMonths,
            createdBy = createdBy,
        )
        return FixedAssetResponse.from(fixedAssetRepository.save(asset))
    }

    fun dispose(id: UUID): FixedAssetResponse {
        val asset = findEntity(id)
        if (asset.status == FixedAssetStatus.DISPOSED) {
            throw BusinessRuleException("El activo ya está dado de baja")
        }
        asset.status = FixedAssetStatus.DISPOSED
        asset.disposalDate = LocalDate.now()
        return FixedAssetResponse.from(fixedAssetRepository.save(asset))
    }

    /**
     * Contabiliza la depreciación en línea recta del periodo indicado para todos los activos
     * ACTIVE que aún no se depreciaron en ese periodo: un asiento por activo
     * (Dr gasto de depreciación / Cr depreciación acumulada), topado al valor residual.
     */
    fun runDepreciation(request: RunDepreciationRequest): DepreciationRunResult {
        val period = request.periodDate.withDayOfMonth(1)
        val periodEnd = period.withDayOfMonth(period.lengthOfMonth())
        val createdById = SecurityUtils.currentUserId()

        val eligible = fixedAssetRepository.findAllByStatus(FixedAssetStatus.ACTIVE)
            .filter { it.acquisitionDate.compareTo(periodEnd) <= 0 }
            .filter { it.lastDepreciationPeriod == null || it.lastDepreciationPeriod!!.isBefore(period) }

        val items = mutableListOf<DepreciationRunItem>()
        for (asset in eligible) {
            val depreciableBase = asset.cost - asset.residualValue
            val remaining = depreciableBase - asset.accumulatedDepreciation
            if (remaining.signum() <= 0) {
                asset.status = FixedAssetStatus.FULLY_DEPRECIATED
                fixedAssetRepository.save(asset)
                continue
            }

            val monthly = MoneyUtils.round(depreciableBase.divide(BigDecimal(asset.usefulLifeMonths), 10, java.math.RoundingMode.HALF_UP))
            val amount = if (monthly.compareTo(remaining) > 0) remaining else monthly
            if (amount.signum() <= 0) continue

            val lines = listOf(
                PostingLine(
                    accountId = requireNotNull(asset.depreciationExpenseAccount.id),
                    debit = amount,
                    description = "Depreciación - ${asset.description}",
                ),
                PostingLine(
                    accountId = requireNotNull(asset.accumulatedDepreciationAccount.id),
                    credit = amount,
                    description = "Depreciación - ${asset.description}",
                ),
            )
            val entry = postingService.post(
                entryDate = periodEnd,
                description = "Depreciación de ${asset.description} - $period",
                sourceType = JournalSourceType.DEPRECIATION,
                sourceId = asset.id,
                lines = lines,
                createdById = createdById,
            )

            asset.accumulatedDepreciation += amount
            asset.lastDepreciationPeriod = period
            if (asset.accumulatedDepreciation.compareTo(depreciableBase) >= 0) {
                asset.status = FixedAssetStatus.FULLY_DEPRECIATED
            }
            fixedAssetRepository.save(asset)

            items.add(
                DepreciationRunItem(
                    fixedAssetId = requireNotNull(asset.id),
                    description = asset.description,
                    amount = amount,
                    journalEntryId = requireNotNull(entry.id),
                ),
            )
        }

        return DepreciationRunResult(period = period, items = items)
    }

    @Transactional(readOnly = true)
    fun list(): List<FixedAssetResponse> =
        fixedAssetRepository.findAllByOrderByAcquisitionDateDesc().map { FixedAssetResponse.from(it) }

    @Transactional(readOnly = true)
    fun get(id: UUID): FixedAssetResponse = FixedAssetResponse.from(findEntity(id))

    private fun findEntity(id: UUID): FixedAsset =
        fixedAssetRepository.findById(id).orElseThrow { NotFoundException("Activo fijo no encontrado") }
}
