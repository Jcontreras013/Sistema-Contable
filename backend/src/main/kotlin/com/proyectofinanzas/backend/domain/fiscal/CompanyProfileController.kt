package com.proyectofinanzas.backend.domain.fiscal

import jakarta.validation.Valid
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/company-profile")
class CompanyProfileController(
    private val companyProfileService: CompanyProfileService,
) {
    @GetMapping
    fun get(): CompanyProfileResponse? = companyProfileService.get()

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun upsert(@Valid @RequestBody request: CompanyProfileRequest): CompanyProfileResponse =
        companyProfileService.upsert(request)
}
