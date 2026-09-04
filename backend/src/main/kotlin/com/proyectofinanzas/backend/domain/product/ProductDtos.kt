package com.proyectofinanzas.backend.domain.product

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

data class ProductRequest(
    @field:NotBlank val description: String,
    @field:NotNull val accountId: UUID,
    val isActive: Boolean = true,
)

data class ProductResponse(
    val id: UUID,
    val description: String,
    val accountId: UUID,
    val accountCode: String,
    val accountName: String,
    val isActive: Boolean,
    val createdAt: Instant,
) {
    companion object {
        fun from(product: Product) = ProductResponse(
            id = requireNotNull(product.id),
            description = product.description,
            accountId = requireNotNull(product.account.id),
            accountCode = product.account.code,
            accountName = product.account.name,
            isActive = product.isActive,
            createdAt = requireNotNull(product.createdAt),
        )
    }
}
