package com.proyectofinanzas.backend.domain.creditnote

import jakarta.validation.Valid
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
@RequestMapping("/api/v1/credit-debit-notes")
class CreditDebitNoteController(
    private val creditDebitNoteService: CreditDebitNoteService,
) {
    @GetMapping
    fun list(@RequestParam(required = false) invoiceId: UUID?): List<CreditDebitNoteResponse> =
        if (invoiceId != null) creditDebitNoteService.listByInvoice(invoiceId) else emptyList()

    @GetMapping("/{id}")
    fun get(@PathVariable id: UUID): CreditDebitNoteResponse = creditDebitNoteService.get(id)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    fun create(@Valid @RequestBody request: CreateCreditDebitNoteRequest): CreditDebitNoteResponse =
        creditDebitNoteService.create(request)

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    fun cancel(@PathVariable id: UUID): CreditDebitNoteResponse = creditDebitNoteService.cancel(id)
}
