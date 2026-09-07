package com.proyectofinanzas.backend.domain.bankreconciliation

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface BankReconciliationRepository : JpaRepository<BankReconciliation, UUID> {
    fun findByAccountIdAndStatus(accountId: UUID, status: BankReconciliationStatus): BankReconciliation?
    fun findAllByAccountIdOrderByStatementDateDesc(accountId: UUID): List<BankReconciliation>
}
