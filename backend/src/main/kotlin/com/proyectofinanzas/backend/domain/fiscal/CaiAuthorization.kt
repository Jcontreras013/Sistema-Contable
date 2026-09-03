package com.proyectofinanzas.backend.domain.fiscal

import com.proyectofinanzas.backend.common.BaseEntity
import com.proyectofinanzas.backend.domain.user.User
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDate

/**
 * Autorización de Código de Autorización de Impresión (CAI) del SAR de Honduras. Habilita a la
 * empresa a emitir documentos fiscales dentro de un rango de correlativos y hasta una fecha
 * límite de emisión. El código CAI en sí lo asigna el SAR (trámite legal, no técnico); aquí solo
 * se registra para poder generar los correlativos que exige el Reglamento del Régimen de
 * Facturación (Acuerdo 481-2017).
 */
@Entity
@Table(name = "cai_authorizations")
class CaiAuthorization(
    @Column(name = "cai_code", nullable = false, length = 50)
    var caiCode: String,

    @Column(name = "establishment_code", nullable = false, length = 3)
    var establishmentCode: String,

    @Column(name = "emission_point_code", nullable = false, length = 3)
    var emissionPointCode: String,

    /** "01" = factura. Único tipo de documento soportado por ahora. */
    @Column(name = "document_type_code", nullable = false, length = 2)
    var documentTypeCode: String,

    @Column(name = "range_start", nullable = false)
    var rangeStart: Long,

    @Column(name = "range_end", nullable = false)
    var rangeEnd: Long,

    @Column(name = "current_number", nullable = false)
    var currentNumber: Long,

    @Column(name = "emission_limit_date", nullable = false)
    var emissionLimitDate: LocalDate,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    var createdBy: User,
) : BaseEntity()
