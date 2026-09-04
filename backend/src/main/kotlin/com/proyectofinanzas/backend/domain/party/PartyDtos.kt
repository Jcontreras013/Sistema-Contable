package com.proyectofinanzas.backend.domain.party

import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

data class PartyRequest(
    @field:NotNull val type: PartyType,
    @field:NotBlank val name: String,
    val rtn: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val address: String? = null,
    val isActive: Boolean = true,
    val taxRegime: TaxRegime? = null,
    val isrWithholdingAgent: Boolean = false,
    val isvWithholdingAgent: Boolean = false,
    @field:DecimalMin(value = "0") @field:DecimalMax(value = "100") val withholdingRate: BigDecimal? = null,
    val additionalEmails: List<String> = emptyList(),
)

data class PartyResponse(
    val id: UUID,
    val type: PartyType,
    val name: String,
    val rtn: String?,
    val email: String?,
    val phone: String?,
    val address: String?,
    val isActive: Boolean,
    val taxRegime: TaxRegime?,
    val isrWithholdingAgent: Boolean,
    val isvWithholdingAgent: Boolean,
    val withholdingRate: BigDecimal?,
    val additionalEmails: List<String>,
    val createdAt: Instant,
) {
    companion object {
        fun from(party: Party) = PartyResponse(
            id = requireNotNull(party.id),
            type = party.type,
            name = party.name,
            rtn = party.rtn,
            email = party.email,
            phone = party.phone,
            address = party.address,
            isActive = party.isActive,
            taxRegime = party.taxRegime,
            isrWithholdingAgent = party.isrWithholdingAgent,
            isvWithholdingAgent = party.isvWithholdingAgent,
            withholdingRate = party.withholdingRate,
            additionalEmails = party.additionalEmails.toList(),
            createdAt = requireNotNull(party.createdAt),
        )
    }
}
