package com.proyectofinanzas.backend.domain.fiscal

import com.proyectofinanzas.backend.common.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table

/** Datos del emisor (la empresa dueña del sistema) que se imprimen en las facturas. Fila única. */
@Entity
@Table(name = "company_profile")
class CompanyProfile(
    @Column(name = "legal_name", nullable = false)
    var legalName: String,

    @Column(nullable = false, length = 20)
    var rtn: String,

    @Column(length = 500)
    var address: String? = null,

    @Column(length = 50)
    var phone: String? = null,

    @Column(length = 255)
    var email: String? = null,
) : BaseEntity()
