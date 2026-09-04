package com.proyectofinanzas.backend.domain.expense

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ExpenseRepository : JpaRepository<Expense, UUID> {
    fun findAllByOrderByExpenseDateDescExpenseNumberDesc(pageable: Pageable): Page<Expense>
    fun findAllByPartyIdOrderByExpenseDateDescExpenseNumberDesc(partyId: UUID, pageable: Pageable): Page<Expense>
}
