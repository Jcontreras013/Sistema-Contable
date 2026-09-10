package com.proyectofinanzas.backend.domain.periodclose

import com.proyectofinanzas.backend.common.CreatedOnlyEntity
import com.proyectofinanzas.backend.domain.journal.JournalEntry
import com.proyectofinanzas.backend.domain.user.User
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDate

/**
 * Registro inmutable de un cierre contable: una vez creado, PostingService rechaza cualquier
 * asiento con fecha <= periodEndDate del cierre más reciente.
 */
@Entity
@Table(name = "period_closes")
class PeriodClose(
    @Column(name = "period_end_date", nullable = false, unique = true)
    var periodEndDate: LocalDate,

    @Column(name = "net_income", nullable = false, precision = 19, scale = 4)
    var netIncome: BigDecimal,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id")
    var journalEntry: JournalEntry?,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "closed_by", nullable = false)
    var closedBy: User,
) : CreatedOnlyEntity()
