package com.proyectofinanzas.backend.domain.fixedasset

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface FixedAssetRepository : JpaRepository<FixedAsset, UUID> {
    fun findAllByOrderByAcquisitionDateDesc(): List<FixedAsset>
    fun findAllByStatus(status: FixedAssetStatus): List<FixedAsset>
}
