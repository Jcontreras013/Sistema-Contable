package com.proyectofinanzas.backend.domain.fiscal

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class CreateCaiAuthorizationRequest(
    @field:NotBlank val caiCode: String,
    @field:NotBlank @field:Pattern(regexp = "\\d{3}") val establishmentCode: String,
    @field:NotBlank @field:Pattern(regexp = "\\d{3}") val emissionPointCode: String,
    @field:NotBlank @field:Pattern(regexp = "\\d{2}") val documentTypeCode: String,
    @field:NotNull @field:Min(1) val rangeStart: Long,
    @field:NotNull @field:Min(1) val rangeEnd: Long,
    @field:NotNull val emissionLimitDate: LocalDate,
)

data class CaiAuthorizationResponse(
    val id: UUID,
    val caiCode: String,
    val establishmentCode: String,
    val emissionPointCode: String,
    val documentTypeCode: String,
    val rangeStart: Long,
    val rangeEnd: Long,
    val currentNumber: Long,
    val emissionLimitDate: LocalDate,
    val isActive: Boolean,
    val createdByName: String,
    val createdAt: Instant,
) {
    companion object {
        fun from(entity: CaiAuthorization) = CaiAuthorizationResponse(
            id = requireNotNull(entity.id),
            caiCode = entity.caiCode,
            establishmentCode = entity.establishmentCode,
            emissionPointCode = entity.emissionPointCode,
            documentTypeCode = entity.documentTypeCode,
            rangeStart = entity.rangeStart,
            rangeEnd = entity.rangeEnd,
            currentNumber = entity.currentNumber,
            emissionLimitDate = entity.emissionLimitDate,
            isActive = entity.isActive,
            createdByName = entity.createdBy.fullName,
            createdAt = requireNotNull(entity.createdAt),
        )
    }
}

data class CompanyProfileRequest(
    @field:NotBlank val legalName: String,
    @field:NotBlank val rtn: String,
    val address: String? = null,
    val phone: String? = null,
    val email: String? = null,
)

data class CompanyProfileResponse(
    val legalName: String,
    val rtn: String,
    val address: String?,
    val phone: String?,
    val email: String?,
) {
    companion object {
        fun from(entity: CompanyProfile) = CompanyProfileResponse(
            legalName = entity.legalName,
            rtn = entity.rtn,
            address = entity.address,
            phone = entity.phone,
            email = entity.email,
        )
    }
}
