package com.proyectofinanzas.backend.domain.account

import com.proyectofinanzas.backend.common.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

enum class AccountType {
    ASSET,
    LIABILITY,
    EQUITY,
    INCOME,
    EXPENSE,
}

/** Cuentas con un rol especial que la lógica de contabilización busca por nombre, no por código. */
enum class AccountSystemRole {
    ACCOUNTS_RECEIVABLE,
    ACCOUNTS_PAYABLE,
    SALES_REVENUE_DEFAULT,
    TAX_PAYABLE,
    CASH_HNL,
    CASH_USD,
    WITHHOLDING_TAX_PAYABLE,
}

@Entity
@Table(name = "accounts")
class Account(
    @Column(nullable = false, unique = true)
    var code: String,

    @Column(nullable = false)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var type: AccountType,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    var parent: Account? = null,

    @Column(name = "allows_posting", nullable = false)
    var allowsPosting: Boolean = true,

    @Enumerated(EnumType.STRING)
    @Column(name = "system_role", length = 30)
    var systemRole: AccountSystemRole? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,
) : BaseEntity()
