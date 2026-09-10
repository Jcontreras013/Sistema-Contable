package com.proyectofinanzas.backend.domain.periodclose

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
@RequestMapping("/api/v1/period-closes")
class PeriodCloseController(
    private val periodCloseService: PeriodCloseService,
) {
    @GetMapping
    fun list(): List<PeriodCloseResponse> = periodCloseService.list()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    fun close(@Valid @RequestBody request: ClosePeriodRequest): PeriodCloseResponse =
        periodCloseService.close(request)
}
