package com.proyectofinanzas.backend.domain.user

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

data class LoginRequest(
    @field:NotBlank @field:Email val email: String,
    @field:NotBlank val password: String,
)

data class LoginResponse(
    val requiresTwoFactor: Boolean = false,
    val pendingToken: String? = null,
    val token: String? = null,
    val user: UserResponse? = null,
)

data class VerifyTwoFactorRequest(
    @field:NotBlank val pendingToken: String,
    @field:NotBlank val code: String,
)

data class TwoFactorSetupResponse(
    val secret: String,
    val otpAuthUri: String,
)

data class EnableTwoFactorRequest(
    @field:NotBlank val code: String,
)

data class DisableTwoFactorRequest(
    @field:NotBlank val code: String,
)

data class UserResponse(
    val id: UUID,
    val email: String,
    val fullName: String,
    val role: Role,
    val active: Boolean,
    val twoFactorEnabled: Boolean,
    val createdAt: Instant,
) {
    companion object {
        fun from(user: User) = UserResponse(
            id = requireNotNull(user.id),
            email = user.email,
            fullName = user.fullName,
            role = user.role,
            active = user.active,
            twoFactorEnabled = user.twoFactorEnabled,
            createdAt = requireNotNull(user.createdAt),
        )
    }
}

data class CreateUserRequest(
    @field:NotBlank @field:Email val email: String,
    @field:NotBlank @field:Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres") val password: String,
    @field:NotBlank val fullName: String,
    val role: Role,
)

data class UpdateUserRequest(
    @field:NotBlank val fullName: String,
    val role: Role,
    val active: Boolean,
    @field:Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres") val password: String? = null,
)
