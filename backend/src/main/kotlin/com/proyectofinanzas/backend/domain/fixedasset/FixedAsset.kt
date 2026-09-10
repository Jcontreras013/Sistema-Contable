package com.proyectofinanzas.backend.domain.fixedasset

import com.proyectofinanzas.backend.common.BaseEntity
import com.proyectofinanzas.backend.domain.account.Account
import com.proyectofinanzas.backend.domain.user.User
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDate

enum class FixedAssetStatus {
    ACTIVE,
    FULLY_DEPRECIATED,
    DISPOSED,
}

/**
 * Activo fijo con depreciación en línea recta. La baja (DISPOSED) solo detiene la depreciación
 * futura; no contabiliza una ganancia/pérdida por retiro (simplificación de esta fase, ver README).
 */
@Entity
@Table(name = "fixed_assets")
class FixedAsset(
    @Column(nullable = false)
    var description: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    var account: Account,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "depreciation_expense_account_id", nullable = false)
    var depreciationExpenseAccount: Account,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accumulated_depreciation_account_id", nullable = false)
    var accumulatedDepreciationAccount: Account,

    @Column(name = "acquisition_date", nullable = false)
    var acquisitionDate: LocalDate,

    @Column(nullable = false, precision = 19, scale = 4)
    var cost: BigDecimal,

    @Column(name = "residual_value", nullable = false, precision = 19, scale = 4)
    var residualValue: BigDecimal,

    @Column(name = "useful_life_months", nullable = false)
    var usefulLifeMonths: Int,

    @Column(name = "accumulated_depreciation", nullable = false, precision = 19, scale = 4)
    var accumulatedDepreciation: BigDecimal = BigDecimal.ZERO,

    @Column(name = "last_depreciation_period")
    var lastDepreciationPeriod: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: FixedAssetStatus = FixedAssetStatus.ACTIVE,

    @Column(name = "disposal_date")
    var disposalDate: LocalDate? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    var createdBy: User,
) : BaseEntity()
