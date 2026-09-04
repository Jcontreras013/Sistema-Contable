package com.proyectofinanzas.backend.domain.expense

import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/expenses")
class ExpenseController(
    private val expenseService: ExpenseService,
) {
    @GetMapping
    fun list(pageable: Pageable, @RequestParam(required = false) partyId: UUID?): Page<ExpenseResponse> =
        expenseService.list(pageable, partyId)

    @GetMapping("/{id}")
    fun get(@PathVariable id: UUID): ExpenseResponse = expenseService.get(id)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    fun create(@Valid @RequestBody request: CreateExpenseRequest): ExpenseResponse = expenseService.create(request)

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    fun cancel(@PathVariable id: UUID): ExpenseResponse = expenseService.cancel(id)
}
