package com.proyectofinanzas.backend.domain.journal

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

interface JournalEntryRepository : JpaRepository<JournalEntry, UUID> {
    fun findAllByOrderByEntryDateDescEntryNumberDesc(pageable: Pageable): Page<JournalEntry>
}

interface JournalEntryLineRepository : JpaRepository<JournalEntryLine, UUID> {
    fun findByJournalEntryIdOrderByLineNumberAsc(journalEntryId: UUID): List<JournalEntryLine>

    @Query(
        """
        select coalesce(sum(l.debit), 0), coalesce(sum(l.credit), 0)
        from JournalEntryLine l
        where l.account.id = :accountId and l.journalEntry.entryDate <= :asOf
        """
    )
    fun sumDebitCreditByAccountUpTo(
        @Param("accountId") accountId: UUID,
        @Param("asOf") asOf: LocalDate,
    ): List<Array<BigDecimal>>

    @Query(
        """
        select l.account.id, coalesce(sum(l.debit), 0), coalesce(sum(l.credit), 0)
        from JournalEntryLine l
        where l.journalEntry.entryDate <= :asOf
        group by l.account.id
        """
    )
    fun trialBalanceUpTo(@Param("asOf") asOf: LocalDate): List<Array<Any>>

    @Query(
        """
        select l.account.id, coalesce(sum(l.debit), 0), coalesce(sum(l.credit), 0)
        from JournalEntryLine l
        where l.journalEntry.entryDate between :from and :to
        group by l.account.id
        """
    )
    fun trialBalanceBetween(@Param("from") from: LocalDate, @Param("to") to: LocalDate): List<Array<Any>>

    fun findByAccountIdAndJournalEntry_EntryDateBetweenOrderByJournalEntry_EntryDateAsc(
        accountId: UUID,
        from: LocalDate,
        to: LocalDate,
    ): List<JournalEntryLine>

    // left join explícito: navegar l.reconciliation.id directo en el WHERE generaría un
    // INNER JOIN implícito, que descartaría toda línea sin conciliar (reconciliation_id NULL)
    // aun cuando el OR debería incluirla por reconciled = false.
    @Query(
        """
        select l from JournalEntryLine l
        left join l.reconciliation r
        where l.account.id = :accountId
          and l.journalEntry.entryDate <= :asOf
          and (l.reconciled = false or r.id = :reconciliationId)
        order by l.journalEntry.entryDate asc
        """
    )
    fun findReconciliationCandidates(
        @Param("accountId") accountId: UUID,
        @Param("asOf") asOf: LocalDate,
        @Param("reconciliationId") reconciliationId: UUID,
    ): List<JournalEntryLine>

    fun findByReconciliationIdOrderByJournalEntry_EntryDateAsc(reconciliationId: UUID): List<JournalEntryLine>

    @Query(
        """
        select coalesce(sum(l.debit), 0) - coalesce(sum(l.credit), 0)
        from JournalEntryLine l
        where l.account.id = :accountId and l.reconciled = true and l.journalEntry.entryDate <= :asOf
        """
    )
    fun clearedBalance(@Param("accountId") accountId: UUID, @Param("asOf") asOf: LocalDate): BigDecimal
}
