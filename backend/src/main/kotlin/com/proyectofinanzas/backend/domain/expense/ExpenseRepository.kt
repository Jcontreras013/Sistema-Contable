package com.proyectofinanzas.backend.domain.expense

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface ExpenseRepository : JpaRepository<Expense, UUID> {

    /**
     * left join explícito: e.party es opcional (gastos sin proveedor), y navegar "e.party.id"
     * directo en el where generaría un inner join implícito que descartaría esos gastos incluso
     * sin filtro de proveedor.
     */
    @Query(
        """
        select e from Expense e
        left join e.party p
        where (:partyId is null or (p is not null and p.id = :partyId))
        and (:search is null or :search = ''
            or lower(e.description) like lower(concat('%', :search, '%'))
            or (p is not null and lower(p.name) like lower(concat('%', :search, '%')))
            or str(e.expenseNumber) like concat('%', :search, '%'))
        order by e.expenseDate desc, e.expenseNumber desc
        """
    )
    fun search(
        @Param("partyId") partyId: UUID?,
        @Param("search") search: String?,
        pageable: Pageable,
    ): Page<Expense>
}
