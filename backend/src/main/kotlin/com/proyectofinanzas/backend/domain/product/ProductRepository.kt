package com.proyectofinanzas.backend.domain.product

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ProductRepository : JpaRepository<Product, UUID> {
    fun findAllByOrderByDescriptionAsc(): List<Product>
}
