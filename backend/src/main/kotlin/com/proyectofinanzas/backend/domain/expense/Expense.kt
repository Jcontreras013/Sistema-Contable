package com.proyectofinanzas.backend.domain.expense

import com.proyectofinanzas.backend.common.BaseEntity
import com.proyectofinanzas.backend.common.Currency
import com.proyectofinanzas.backend.domain.account.Account
import com.proyectofinanzas.backend.domain.journal.JournalEntry
import com.proyectofinanzas.backend.domain.party.Party
import com.proyectofinanzas.backend.domain.product.Product
import com.proyectofinanzas.backend.domain.user.User
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.annotations.Generated
import org.hibernate.generator.EventType
import java.math.BigDecimal
import java.time.LocalDate

enum class ExpensePaymentMethod {
    CASH,
    BANK,
    CREDIT,
}

enum class ExpenseStatus {
    POSTED,
    PARTIALLY_PAID,
    PAID,
    CANCELLED,
}

@Entity
@Table(name = "expenses")
class Expense(
    @Generated(event = [EventType.INSERT])
    @Column(name = "expense_number", nullable = false, updatable = false, insertable = false)
    var expenseNumber: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "party_id")
    var party: Party? = null,

    @Column(name = "expense_date", nullable = false)
    var expenseDate: LocalDate,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 3)
    var currency: Currency,

    @Column(name = "exchange_rate", nullable = false, precision = 12, scale = 6)
    var exchangeRate: BigDecimal,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    var account: Account,

    @Column(nullable = false, length = 500)
    var description: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 10)
    var paymentMethod: ExpensePaymentMethod,

    @Column(nullable = false, precision = 19, scale = 4)
    var amount: BigDecimal,

    @Column(name = "amount_in_base", nullable = false, precision = 19, scale = 4)
    var amountInBase: BigDecimal,

    /** Retención de ISR/ISV aplicada automáticamente si el proveedor es agente retenido. */
    @Column(name = "withheld_in_base", nullable = false, precision = 19, scale = 4)
    var withheldInBase: BigDecimal = BigDecimal.ZERO,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ExpenseStatus,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id")
    var journalEntry: JournalEntry? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    var createdBy: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    var product: Product? = null,
) : BaseEntity()
