package com.proyectofinanzas.backend.domain.party

import com.proyectofinanzas.backend.common.BaseEntity
import jakarta.persistence.CollectionTable
import jakarta.persistence.Column
import jakarta.persistence.ElementCollection
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.JoinColumn
import jakarta.persistence.Table
import java.math.BigDecimal

enum class PartyType {
    CUSTOMER,
    VENDOR,
    BOTH,
}

/** Régimen fiscal del tercero ante la SAR. Ilustrativo, no asesoría fiscal formal. */
enum class TaxRegime {
    ORDINARIO,
    SIMPLIFICADO,
}

@Entity
@Table(name = "parties")
class Party(
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    var type: PartyType,

    @Column(nullable = false)
    var name: String,

    @Column(length = 20)
    var rtn: String? = null,

    var email: String? = null,

    var phone: String? = null,

    var address: String? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Enumerated(EnumType.STRING)
    @Column(name = "tax_regime", length = 20)
    var taxRegime: TaxRegime? = null,

    @Column(name = "isr_withholding_agent", nullable = false)
    var isrWithholdingAgent: Boolean = false,

    @Column(name = "isv_withholding_agent", nullable = false)
    var isvWithholdingAgent: Boolean = false,

    @Column(name = "withholding_rate", precision = 5, scale = 2)
    var withholdingRate: BigDecimal? = null,

    /** Correos adicionales, más allá del correo principal (ej. contacto de compras/cobranza). */
    @ElementCollection
    @CollectionTable(name = "party_emails", joinColumns = [JoinColumn(name = "party_id")])
    @Column(name = "email", nullable = false)
    var additionalEmails: MutableList<String> = mutableListOf(),
) : BaseEntity()
