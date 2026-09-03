package com.proyectofinanzas.backend.domain.fiscal

import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional
import java.util.UUID

interface CompanyProfileRepository : JpaRepository<CompanyProfile, UUID> {
    fun findFirstByOrderByCreatedAtAsc(): Optional<CompanyProfile>
}
