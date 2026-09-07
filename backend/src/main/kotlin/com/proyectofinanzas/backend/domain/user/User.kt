package com.proyectofinanzas.backend.domain.user

import com.proyectofinanzas.backend.common.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table

enum class Role {
    ADMIN,
    ACCOUNTANT,
    AUDITOR,
}

@Entity
@Table(name = "users")
class User(
    @Column(nullable = false, unique = true)
    var email: String,

    @Column(name = "password_hash", nullable = false)
    var passwordHash: String,

    @Column(name = "full_name", nullable = false)
    var fullName: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var role: Role,

    @Column(nullable = false)
    var active: Boolean = true,

    @Column(name = "two_factor_secret", length = 64)
    var twoFactorSecret: String? = null,

    @Column(name = "two_factor_enabled", nullable = false)
    var twoFactorEnabled: Boolean = false,
) : BaseEntity()
