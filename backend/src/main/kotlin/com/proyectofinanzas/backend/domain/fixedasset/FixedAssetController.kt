package com.proyectofinanzas.backend.domain.fixedasset

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/fixed-assets")
class FixedAssetController(
    private val fixedAssetService: FixedAssetService,
) {
    @GetMapping
    fun list(): List<FixedAssetResponse> = fixedAssetService.list()

    @GetMapping("/{id}")
    fun get(@PathVariable id: UUID): FixedAssetResponse = fixedAssetService.get(id)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    fun create(@Valid @RequestBody request: CreateFixedAssetRequest): FixedAssetResponse =
        fixedAssetService.create(request)

    @PostMapping("/{id}/dispose")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    fun dispose(@PathVariable id: UUID): FixedAssetResponse = fixedAssetService.dispose(id)

    @PostMapping("/depreciation/run")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    fun runDepreciation(@Valid @RequestBody request: RunDepreciationRequest): DepreciationRunResult =
        fixedAssetService.runDepreciation(request)
}
