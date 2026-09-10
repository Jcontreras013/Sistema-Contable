package com.proyectofinanzas.backend.domain.journal

import com.proyectofinanzas.backend.common.BusinessRuleException
import com.proyectofinanzas.backend.common.NotFoundException
import com.proyectofinanzas.backend.domain.account.AccountRepository
import com.proyectofinanzas.backend.domain.audit.AuditAction
import com.proyectofinanzas.backend.domain.audit.AuditService
import com.proyectofinanzas.backend.domain.party.PartyRepository
import com.proyectofinanzas.backend.domain.periodclose.PeriodCloseRepository
import com.proyectofinanzas.backend.domain.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

data class PostingLine(
    val accountId: UUID,
    val partyId: UUID? = null,
    val debit: BigDecimal = BigDecimal.ZERO,
    val credit: BigDecimal = BigDecimal.ZERO,
    val description: String? = null,
)

/**
 * Único punto donde se crean asientos contables. Todo movimiento (manual, factura, gasto,
 * pago o reversión) pasa por aquí para garantizar que nunca se persista un asiento
 * descuadrado.
 */
@Service
class PostingService(
    private val journalEntryRepository: JournalEntryRepository,
    private val journalEntryLineRepository: JournalEntryLineRepository,
    private val accountRepository: AccountRepository,
    private val partyRepository: PartyRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
    private val periodCloseRepository: PeriodCloseRepository,
) {

    @Transactional
    fun post(
        entryDate: LocalDate,
        description: String,
        sourceType: JournalSourceType,
        sourceId: UUID?,
        lines: List<PostingLine>,
        createdById: UUID,
        reversalOf: JournalEntry? = null,
    ): JournalEntry {
        require(lines.size >= 2) { "Un asiento contable requiere al menos dos líneas" }

        val lastClose = periodCloseRepository.findTopByOrderByPeriodEndDateDesc()
        if (lastClose != null && entryDate.compareTo(lastClose.periodEndDate) <= 0) {
            throw BusinessRuleException(
                "No se puede contabilizar en un periodo ya cerrado (cerrado hasta ${lastClose.periodEndDate})"
            )
        }

        val totalDebit = lines.fold(BigDecimal.ZERO) { acc, l -> acc + l.debit }
        val totalCredit = lines.fold(BigDecimal.ZERO) { acc, l -> acc + l.credit }
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw BusinessRuleException(
                "El asiento no está balanceado: débitos=$totalDebit, créditos=$totalCredit"
            )
        }
        if (totalDebit.compareTo(BigDecimal.ZERO) == 0) {
            throw BusinessRuleException("El asiento no puede tener monto total en cero")
        }

        val createdBy = userRepository.findById(createdById)
            .orElseThrow { NotFoundException("Usuario no encontrado") }

        val entry = JournalEntry(
            entryDate = entryDate,
            description = description,
            sourceType = sourceType,
            sourceId = sourceId,
            reversalOf = reversalOf,
            createdBy = createdBy,
        )
        val savedEntry = journalEntryRepository.save(entry)

        lines.forEachIndexed { index, line ->
            val hasDebit = line.debit.compareTo(BigDecimal.ZERO) > 0
            val hasCredit = line.credit.compareTo(BigDecimal.ZERO) > 0
            if (hasDebit == hasCredit) {
                throw BusinessRuleException("Cada línea debe tener débito O crédito, no ambos ni ninguno")
            }

            val account = accountRepository.findById(line.accountId)
                .orElseThrow { NotFoundException("Cuenta no encontrada: ${line.accountId}") }
            if (!account.allowsPosting) {
                throw BusinessRuleException("La cuenta ${account.code} - ${account.name} no admite movimientos directos")
            }

            val party = line.partyId?.let {
                partyRepository.findById(it).orElseThrow { NotFoundException("Tercero no encontrado: $it") }
            }

            val entryLine = JournalEntryLine(
                journalEntry = savedEntry,
                lineNumber = index + 1,
                account = account,
                party = party,
                debit = line.debit,
                credit = line.credit,
                description = line.description,
            )
            journalEntryLineRepository.save(entryLine)
        }

        auditService.record(
            entityName = "journal_entries",
            entityId = requireNotNull(savedEntry.id),
            action = AuditAction.CREATE,
            userId = createdById,
            newValue = mapOf(
                "entryNumber" to savedEntry.entryNumber,
                "entryDate" to entryDate.toString(),
                "description" to description,
                "sourceType" to sourceType.name,
                "lines" to lines.map {
                    mapOf("accountId" to it.accountId, "debit" to it.debit, "credit" to it.credit)
                },
            ),
        )

        return savedEntry
    }

    @Transactional
    fun reverse(original: JournalEntry, entryDate: LocalDate, reason: String, createdById: UUID): JournalEntry {
        val originalLines = journalEntryLineRepository.findByJournalEntryIdOrderByLineNumberAsc(
            requireNotNull(original.id)
        )
        val reversedLines = originalLines.map {
            PostingLine(
                accountId = requireNotNull(it.account.id),
                partyId = it.party?.id,
                debit = it.credit,
                credit = it.debit,
                description = it.description,
            )
        }
        return post(
            entryDate = entryDate,
            description = "Reversión de asiento #${original.entryNumber}: $reason",
            sourceType = JournalSourceType.REVERSAL,
            sourceId = original.id,
            lines = reversedLines,
            createdById = createdById,
            reversalOf = original,
        )
    }
}
