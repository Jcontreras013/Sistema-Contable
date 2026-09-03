package com.proyectofinanzas.backend.domain.fiscal

import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional
import java.util.UUID

interface CaiAuthorizationRepository : JpaRepository<CaiAuthorization, UUID> {
    fun findAllByOrderByCreatedAtDesc(): List<CaiAuthorization>

    fun findFirstByDocumentTypeCodeAndIsActiveTrueOrderByCreatedAtDesc(
        documentTypeCode: String,
    ): Optional<CaiAuthorization>
}
