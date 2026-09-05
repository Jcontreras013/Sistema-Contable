package com.proyectofinanzas.backend.domain.creditnote

import com.proyectofinanzas.backend.common.BaseEntity
import com.proyectofinanzas.backend.domain.account.Account
import com.proyectofinanzas.backend.domain.invoice.Invoice
import com.proyectofinanzas.backend.domain.journal.JournalEntry
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

enum class NoteType {
    /** Reduce lo que el cliente debe (devolución, descuento, corrección a la baja). */
    CREDIT,

    /** Aumenta lo que el cliente debe (cargo adicional, corrección al alza). */
    DEBIT,
}

enum class NoteStatus {
    ISSUED,
    CANCELLED,
}

/**
 * Ajuste fiscal sobre una factura ya emitida. No modifica la factura original
 * (es inmutable, como toda transacción contabilizada): es su propio documento, con su
 * propio correlativo SAR (requiere una autorización CAI para su tipo de documento,
 * distinta a la de facturas) y su propio asiento contable.
 */
@Entity
@Table(name = "credit_debit_notes")
class CreditDebitNote(
    @Generated(event = [EventType.INSERT])
    @Column(name = "note_number", nullable = false, updatable = false, insertable = false)
    var noteNumber: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    var invoice: Invoice,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    var type: NoteType,

    @Column(name = "issue_date", nullable = false)
    var issueDate: LocalDate,

    @Column(nullable = false, length = 500)
    var reason: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    var account: Account,

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
    var status: NoteStatus,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id")
    var journalEntry: JournalEntry? = null,

    @Column(length = 20, unique = true)
    var correlativo: String? = null,

    @Column(name = "cai_code", length = 50)
    var caiCode: String? = null,

    @Column(name = "cai_emission_limit_date")
    var caiEmissionLimitDate: LocalDate? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    var createdBy: User,
) : BaseEntity()
