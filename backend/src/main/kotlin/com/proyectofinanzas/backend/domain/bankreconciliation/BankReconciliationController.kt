package com.proyectofinanzas.backend.domain.bankreconciliation

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
@RequestMapping("/api/v1/bank-reconciliations")
class BankReconciliationController(
    private val bankReconciliationService: BankReconciliationService,
) {
    @GetMapping
    fun list(@RequestParam accountId: UUID): List<BankReconciliationResponse> =
        bankReconciliationService.listByAccount(accountId)

    @GetMapping("/{id}")
    fun get(@PathVariable id: UUID): BankReconciliationResponse = bankReconciliationService.get(id)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    fun start(@Valid @RequestBody request: StartBankReconciliationRequest): BankReconciliationResponse =
        bankReconciliationService.start(request)

    @PostMapping("/{id}/lines/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    fun setLineReconciled(
        @PathVariable id: UUID,
        @PathVariable lineId: UUID,
        @Valid @RequestBody request: SetLineReconciledRequest,
    ): BankReconciliationResponse = bankReconciliationService.setLineReconciled(id, lineId, request.reconciled)

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    fun complete(@PathVariable id: UUID): BankReconciliationResponse = bankReconciliationService.complete(id)

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    fun cancel(@PathVariable id: UUID): BankReconciliationResponse = bankReconciliationService.cancel(id)
}
