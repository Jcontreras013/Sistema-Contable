package com.proyectofinanzas.backend.domain.journal

import com.proyectofinanzas.backend.common.CreatedOnlyEntity
import com.proyectofinanzas.backend.domain.account.Account
import com.proyectofinanzas.backend.domain.bankreconciliation.BankReconciliation
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

enum class JournalSourceType {
    MANUAL,
    INVOICE,
    EXPENSE,
    PAYMENT,
    REVERSAL,
    CREDIT_NOTE,
    DEBIT_NOTE,
    DEPRECIATION,
    PERIOD_CLOSE,
}

@Entity
@Table(name = "journal_entries")
class JournalEntry(
    @Generated(event = [EventType.INSERT])
    @Column(name = "entry_number", nullable = false, updatable = false, insertable = false)
    var entryNumber: Long = 0,

    @Column(name = "entry_date", nullable = false)
    var entryDate: LocalDate,

    @Column(nullable = false, length = 1000)
    var description: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 20)
    var sourceType: JournalSourceType,

    @Column(name = "source_id")
    var sourceId: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reversal_of_id")
    var reversalOf: JournalEntry? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    var createdBy: User,
) : CreatedOnlyEntity()

@Entity
@Table(name = "journal_entry_lines")
class JournalEntryLine(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id", nullable = false)
    var journalEntry: JournalEntry,

    @Column(name = "line_number", nullable = false)
    var lineNumber: Int,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    var account: Account,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "party_id")
    var party: Party? = null,

    @Column(nullable = false, precision = 19, scale = 4)
    var debit: BigDecimal = BigDecimal.ZERO,

    @Column(nullable = false, precision = 19, scale = 4)
    var credit: BigDecimal = BigDecimal.ZERO,

    @Column(length = 500)
    var description: String? = null,

    @Column(nullable = false)
    var reconciled: Boolean = false,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reconciliation_id")
    var reconciliation: BankReconciliation? = null,
) {
    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(nullable = false, updatable = false)
    var id: UUID? = null
}
