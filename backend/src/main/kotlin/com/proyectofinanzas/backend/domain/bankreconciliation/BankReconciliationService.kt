package com.proyectofinanzas.backend.domain.bankreconciliation

import com.proyectofinanzas.backend.common.BusinessRuleException
import com.proyectofinanzas.backend.common.MoneyUtils
import com.proyectofinanzas.backend.common.NotFoundException
import com.proyectofinanzas.backend.domain.account.AccountRepository
import com.proyectofinanzas.backend.domain.account.AccountSystemRole
import com.proyectofinanzas.backend.domain.journal.JournalEntryLineRepository
import com.proyectofinanzas.backend.domain.user.UserRepository
import com.proyectofinanzas.backend.security.SecurityUtils
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

private val BANK_ACCOUNT_ROLES = setOf(AccountSystemRole.CASH_HNL, AccountSystemRole.CASH_USD)

@Service
@Transactional
class BankReconciliationService(
    private val bankReconciliationRepository: BankReconciliationRepository,
    private val accountRepository: AccountRepository,
    private val journalEntryLineRepository: JournalEntryLineRepository,
    private val userRepository: UserRepository,
) {

    fun start(request: StartBankReconciliationRequest): BankReconciliationResponse {
        val account = accountRepository.findById(request.accountId)
            .orElseThrow { NotFoundException("Cuenta no encontrada") }
        if (account.systemRole !in BANK_ACCOUNT_ROLES) {
            throw BusinessRuleException("Solo se pueden conciliar cuentas de Caja/Banco")
        }
        if (bankReconciliationRepository.findByAccountIdAndStatus(request.accountId, BankReconciliationStatus.OPEN) != null) {
            throw BusinessRuleException("Ya hay una conciliación abierta para esta cuenta; complétala o cancélala antes de iniciar otra")
        }
        val createdBy = userRepository.findById(SecurityUtils.currentUserId())
            .orElseThrow { NotFoundException("Usuario no encontrado") }

        val reconciliation = BankReconciliation(
            account = account,
            statementDate = request.statementDate,
            statementBalance = MoneyUtils.round(request.statementBalance),
            status = BankReconciliationStatus.OPEN,
            createdBy = createdBy,
        )
        return toResponse(bankReconciliationRepository.save(reconciliation))
    }

    fun setLineReconciled(reconciliationId: UUID, lineId: UUID, reconciled: Boolean): BankReconciliationResponse {
        val reconciliation = findOpen(reconciliationId)
        val line = journalEntryLineRepository.findById(lineId)
            .orElseThrow { NotFoundException("Línea de asiento no encontrada") }
        if (line.account.id != reconciliation.account.id) {
            throw BusinessRuleException("La línea no pertenece a la cuenta de esta conciliación")
        }
        if (reconciled) {
            if (line.journalEntry.entryDate > reconciliation.statementDate) {
                throw BusinessRuleException("No puedes conciliar un movimiento posterior a la fecha del estado de cuenta")
            }
            line.reconciled = true
            line.reconciliation = reconciliation
        } else {
            line.reconciled = false
            line.reconciliation = null
        }
        journalEntryLineRepository.save(line)
        return toResponse(reconciliation)
    }

    fun complete(id: UUID): BankReconciliationResponse {
        val reconciliation = findOpen(id)
        val clearedBalance = journalEntryLineRepository.clearedBalance(
            requireNotNull(reconciliation.account.id),
            reconciliation.statementDate,
        )
        val difference = reconciliation.statementBalance - clearedBalance
        if (difference.signum() != 0) {
            throw BusinessRuleException(
                "El saldo conciliado ($clearedBalance) no coincide con el saldo del estado de cuenta " +
                    "(${reconciliation.statementBalance}); diferencia de $difference"
            )
        }
        reconciliation.status = BankReconciliationStatus.COMPLETED
        return toResponse(bankReconciliationRepository.save(reconciliation))
    }

    fun cancel(id: UUID): BankReconciliationResponse {
        val reconciliation = findOpen(id)
        val lines = journalEntryLineRepository.findByReconciliationIdOrderByJournalEntry_EntryDateAsc(id)
        lines.forEach {
            it.reconciled = false
            it.reconciliation = null
        }
        journalEntryLineRepository.saveAll(lines)
        bankReconciliationRepository.delete(reconciliation)
        return toResponse(reconciliation, includeLines = false)
    }

    @Transactional(readOnly = true)
    fun get(id: UUID): BankReconciliationResponse = toResponse(findEntity(id))

    @Transactional(readOnly = true)
    fun listByAccount(accountId: UUID): List<BankReconciliationResponse> =
        bankReconciliationRepository.findAllByAccountIdOrderByStatementDateDesc(accountId)
            .map { toResponse(it, includeLines = false) }

    private fun findEntity(id: UUID): BankReconciliation =
        bankReconciliationRepository.findById(id).orElseThrow { NotFoundException("Conciliación no encontrada") }

    private fun findOpen(id: UUID): BankReconciliation {
        val reconciliation = findEntity(id)
        if (reconciliation.status != BankReconciliationStatus.OPEN) {
            throw BusinessRuleException("Esta conciliación ya está completada")
        }
        return reconciliation
    }

    private fun toResponse(reconciliation: BankReconciliation, includeLines: Boolean = true): BankReconciliationResponse {
        val accountId = requireNotNull(reconciliation.account.id)
        val clearedBalance = journalEntryLineRepository.clearedBalance(accountId, reconciliation.statementDate)
        val lines = if (!includeLines) {
            emptyList()
        } else if (reconciliation.status == BankReconciliationStatus.OPEN) {
            journalEntryLineRepository.findReconciliationCandidates(
                accountId,
                reconciliation.statementDate,
                requireNotNull(reconciliation.id),
            )
        } else {
            journalEntryLineRepository.findByReconciliationIdOrderByJournalEntry_EntryDateAsc(requireNotNull(reconciliation.id))
        }
        return BankReconciliationResponse(
            id = requireNotNull(reconciliation.id),
            accountId = accountId,
            accountName = reconciliation.account.name,
            statementDate = reconciliation.statementDate,
            statementBalance = reconciliation.statementBalance,
            clearedBalance = clearedBalance,
            difference = reconciliation.statementBalance - clearedBalance,
            status = reconciliation.status,
            createdByName = reconciliation.createdBy.fullName,
            createdAt = requireNotNull(reconciliation.createdAt),
            lines = lines.map {
                BankReconciliationLineResponse(
                    id = requireNotNull(it.id),
                    journalEntryId = requireNotNull(it.journalEntry.id),
                    entryDate = it.journalEntry.entryDate,
                    description = it.description ?: it.journalEntry.description,
                    debit = it.debit,
                    credit = it.credit,
                    reconciled = it.reconciled,
                )
            },
        )
    }
}
