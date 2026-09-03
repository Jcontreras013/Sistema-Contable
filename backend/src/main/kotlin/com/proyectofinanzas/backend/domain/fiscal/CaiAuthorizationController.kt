package com.proyectofinanzas.backend.domain.fiscal

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/cai-authorizations")
class CaiAuthorizationController(
    private val caiAuthorizationService: CaiAuthorizationService,
) {
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'AUDITOR')")
    fun list(): List<CaiAuthorizationResponse> = caiAuthorizationService.list()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    fun create(@Valid @RequestBody request: CreateCaiAuthorizationRequest): CaiAuthorizationResponse =
        caiAuthorizationService.create(request)
}
