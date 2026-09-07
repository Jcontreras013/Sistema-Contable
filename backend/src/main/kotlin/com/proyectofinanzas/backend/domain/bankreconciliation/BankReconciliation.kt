package com.proyectofinanzas.backend.domain.bankreconciliation

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

enum class BankReconciliationStatus {
    OPEN,
    COMPLETED,
}

/** Conciliación de una cuenta de Caja/Banco contra el saldo de un estado de cuenta real. */
@Entity
@Table(name = "bank_reconciliations")
class BankReconciliation(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    var account: Account,

    @Column(name = "statement_date", nullable = false)
    var statementDate: LocalDate,

    @Column(name = "statement_balance", nullable = false, precision = 19, scale = 4)
    var statementBalance: BigDecimal,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: BankReconciliationStatus,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    var createdBy: User,
) : BaseEntity()
