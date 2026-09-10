package com.proyectofinanzas.backend.domain.periodclose

import com.proyectofinanzas.backend.common.BusinessRuleException
import com.proyectofinanzas.backend.common.MoneyUtils
import com.proyectofinanzas.backend.common.NotFoundException
import com.proyectofinanzas.backend.domain.account.AccountRepository
import com.proyectofinanzas.backend.domain.account.AccountSystemRole
import com.proyectofinanzas.backend.domain.account.AccountType
import com.proyectofinanzas.backend.domain.journal.JournalEntryLineRepository
import com.proyectofinanzas.backend.domain.journal.JournalSourceType
import com.proyectofinanzas.backend.domain.journal.PostingLine
import com.proyectofinanzas.backend.domain.journal.PostingService
import com.proyectofinanzas.backend.domain.user.UserRepository
import com.proyectofinanzas.backend.security.SecurityUtils
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/** Fecha sentinela usada como "desde el inicio" en el primer cierre: muy anterior a cualquier
 * dato real, pero dentro del rango soportado por el tipo DATE de Postgres (a diferencia de
 * LocalDate.MIN, que desborda ese rango). */
private val INCEPTION_DATE: LocalDate = LocalDate.of(1900, 1, 1)

@Service
@Transactional
class PeriodCloseService(
    private val periodCloseRepository: PeriodCloseRepository,
    private val accountRepository: AccountRepository,
    private val journalEntryLineRepository: JournalEntryLineRepository,
    private val userRepository: UserRepository,
    private val postingService: PostingService,
) {

    /**
     * Cierra el periodo hasta periodEndDate: lleva a cero cada cuenta de ingreso/gasto con
     * actividad desde el último cierre (o desde el inicio si nunca se ha cerrado) y traslada
     * el neto a Utilidades Retenidas, en un único asiento.
     */
    fun close(request: ClosePeriodRequest): PeriodCloseResponse {
        val periodEndDate = request.periodEndDate
        val lastClose = periodCloseRepository.findTopByOrderByPeriodEndDateDesc()
        if (lastClose != null && periodEndDate.compareTo(lastClose.periodEndDate) <= 0) {
            throw BusinessRuleException(
                "Ya existe un cierre al ${lastClose.periodEndDate}; elige una fecha de corte posterior"
            )
        }
        val rangeStart = lastClose?.periodEndDate?.plusDays(1) ?: INCEPTION_DATE

        val retainedEarningsAccount = accountRepository.findBySystemRole(AccountSystemRole.RETAINED_EARNINGS)
            .orElseThrow { NotFoundException("No hay una cuenta configurada con rol RETAINED_EARNINGS") }

        val figures = journalEntryLineRepository.trialBalanceBetween(rangeStart, periodEndDate)
            .associate { row -> (row[0] as UUID) to Pair(MoneyUtils.round(row[1] as BigDecimal), MoneyUtils.round(row[2] as BigDecimal)) }
        val accountsById = accountRepository.findAllByOrderByCodeAsc().associateBy { it.id }

        val lines = mutableListOf<PostingLine>()
        var totalIncome = BigDecimal.ZERO
        var totalExpense = BigDecimal.ZERO

        for ((accountId, figure) in figures) {
            val account = accountsById[accountId] ?: continue
            val (debit, credit) = figure
            when (account.type) {
                AccountType.INCOME -> {
                    val net = credit - debit
                    if (net.signum() == 0) continue
                    totalIncome += net
                    if (net.signum() > 0) {
                        lines.add(PostingLine(accountId = accountId, debit = net, description = "Cierre de periodo al $periodEndDate"))
                    } else {
                        lines.add(PostingLine(accountId = accountId, credit = net.negate(), description = "Cierre de periodo al $periodEndDate"))
                    }
                }
                AccountType.EXPENSE -> {
                    val net = debit - credit
                    if (net.signum() == 0) continue
                    totalExpense += net
                    if (net.signum() > 0) {
                        lines.add(PostingLine(accountId = accountId, credit = net, description = "Cierre de periodo al $periodEndDate"))
                    } else {
                        lines.add(PostingLine(accountId = accountId, debit = net.negate(), description = "Cierre de periodo al $periodEndDate"))
                    }
                }
                else -> continue
            }
        }

        if (lines.isEmpty()) {
            throw BusinessRuleException("No hay actividad de ingresos o gastos para cerrar en este periodo")
        }

        val netIncome = MoneyUtils.round(totalIncome - totalExpense)
        if (netIncome.signum() > 0) {
            lines.add(
                PostingLine(
                    accountId = requireNotNull(retainedEarningsAccount.id),
                    credit = netIncome,
                    description = "Utilidad del periodo al $periodEndDate",
                ),
            )
        } else if (netIncome.signum() < 0) {
            lines.add(
                PostingLine(
                    accountId = requireNotNull(retainedEarningsAccount.id),
                    debit = netIncome.negate(),
                    description = "Pérdida del periodo al $periodEndDate",
                ),
            )
        }

        val createdById = SecurityUtils.currentUserId()
        val entry = postingService.post(
            entryDate = periodEndDate,
            description = "Cierre del periodo al $periodEndDate",
            sourceType = JournalSourceType.PERIOD_CLOSE,
            sourceId = null,
            lines = lines,
            createdById = createdById,
        )

        val closedBy = userRepository.findById(createdById).orElseThrow { NotFoundException("Usuario no encontrado") }
        val periodClose = PeriodClose(
            periodEndDate = periodEndDate,
            netIncome = netIncome,
            journalEntry = entry,
            closedBy = closedBy,
        )
        return PeriodCloseResponse.from(periodCloseRepository.save(periodClose))
    }

    @Transactional(readOnly = true)
    fun list(): List<PeriodCloseResponse> =
        periodCloseRepository.findAllByOrderByPeriodEndDateDesc().map { PeriodCloseResponse.from(it) }
}
