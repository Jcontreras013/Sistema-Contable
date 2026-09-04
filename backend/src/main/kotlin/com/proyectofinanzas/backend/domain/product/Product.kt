package com.proyectofinanzas.backend.domain.product

import com.proyectofinanzas.backend.common.BaseEntity
import com.proyectofinanzas.backend.domain.account.Account
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

/**
 * Producto/servicio de compra del catálogo. Cada uno queda enlazado a una cuenta contable, para
 * que al usarlo en un gasto la cuenta correcta se seleccione (y contabilice) sola.
 */
@Entity
@Table(name = "products")
class Product(
    @Column(nullable = false)
    var description: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    var account: Account,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,
) : BaseEntity()
