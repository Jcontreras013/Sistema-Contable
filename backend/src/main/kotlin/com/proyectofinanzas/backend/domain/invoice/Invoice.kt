package com.proyectofinanzas.backend.domain.invoice

import com.proyectofinanzas.backend.common.BaseEntity
import com.proyectofinanzas.backend.common.Currency
import com.proyectofinanzas.backend.domain.account.Account
import com.proyectofinanzas.backend.domain.journal.JournalEntry
import com.proyectofinanzas.backend.domain.party.Party
import com.proyectofinanzas.backend.domain.user.User
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.annotations.Generated
import org.hibernate.annotations.UuidGenerator
import org.hibernate.generator.EventType
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

enum class InvoiceStatus {
    ISSUED,
    PARTIALLY_PAID,
    PAID,
    CANCELLED,
}

@Entity
@Table(name = "invoices")
class Invoice(
    @Generated(event = [EventType.INSERT])
    @Column(name = "invoice_number", nullable = false, updatable = false, insertable = false)
    var invoiceNumber: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "party_id", nullable = false)
    var party: Party,

    @Column(name = "issue_date", nullable = false)
    var issueDate: LocalDate,

    @Column(name = "due_date", nullable = false)
    var dueDate: LocalDate,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 3)
    var currency: Currency,

    @Column(name = "exchange_rate", nullable = false, precision = 12, scale = 6)
    var exchangeRate: BigDecimal,

    @Column(nullable = false, precision = 19, scale = 4)
    var subtotal: BigDecimal,

    @Column(name = "tax_amount", nullable = false, precision = 19, scale = 4)
    var taxAmount: BigDecimal,

    @Column(nullable = false, precision = 19, scale = 4)
    var total: BigDecimal,

    @Column(name = "amount_in_base", nullable = false, precision = 19, scale = 4)
    var amountInBase: BigDecimal,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: InvoiceStatus,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id")
    var journalEntry: JournalEntry? = null,

    @Column(length = 1000)
    var notes: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    var createdBy: User,

    /** Correlativo fiscal SAR (formato NNN-NNN-NN-NNNNNNNN) asignado al emitir. */
    @Column(length = 20, unique = true)
    var correlativo: String? = null,

    @Column(name = "cai_code", length = 50)
    var caiCode: String? = null,

    @Column(name = "cai_emission_limit_date")
    var caiEmissionLimitDate: LocalDate? = null,
) : BaseEntity()

@Entity
@Table(name = "invoice_lines")
class InvoiceLine(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    var invoice: Invoice,

    @Column(name = "line_number", nullable = false)
    var lineNumber: Int,

    @Column(nullable = false, length = 500)
    var description: String,

    @Column(nullable = false, precision = 19, scale = 4)
    var quantity: BigDecimal,

    @Column(name = "unit_price", nullable = false, precision = 19, scale = 4)
    var unitPrice: BigDecimal,

    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    var taxRate: BigDecimal,

    @Column(name = "line_total", nullable = false, precision = 19, scale = 4)
    var lineTotal: BigDecimal,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    var account: Account,
) {
    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(nullable = false, updatable = false)
    var id: UUID? = null
}
