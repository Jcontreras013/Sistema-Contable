package com.proyectofinanzas.backend.domain.user

import com.proyectofinanzas.backend.common.BusinessRuleException
import com.proyectofinanzas.backend.common.NotFoundException
import com.proyectofinanzas.backend.security.SecurityUtils
import com.proyectofinanzas.backend.security.TotpService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/** Cada usuario administra su propia verificación en dos pasos (2FA); no hay un 2FA forzado por un ADMIN sobre otro usuario. */
@Service
@Transactional
class TwoFactorService(
    private val userRepository: UserRepository,
    private val totpService: TotpService,
) {

    fun setup(): TwoFactorSetupResponse {
        val user = currentUser()
        val secret = totpService.generateSecret()
        user.twoFactorSecret = secret
        user.twoFactorEnabled = false
        userRepository.save(user)
        return TwoFactorSetupResponse(secret = secret, otpAuthUri = totpService.otpAuthUri(secret, user.email))
    }

    fun enable(request: EnableTwoFactorRequest): UserResponse {
        val user = currentUser()
        val secret = user.twoFactorSecret
            ?: throw BusinessRuleException("Primero genera un código con /2fa/setup")
        if (!totpService.verifyCode(secret, request.code)) {
            throw BusinessRuleException("Código de verificación inválido")
        }
        user.twoFactorEnabled = true
        return UserResponse.from(userRepository.save(user))
    }

    fun disable(request: DisableTwoFactorRequest): UserResponse {
        val user = currentUser()
        val secret = user.twoFactorSecret
        if (!user.twoFactorEnabled || secret == null) {
            throw BusinessRuleException("La verificación en dos pasos no está activada")
        }
        if (!totpService.verifyCode(secret, request.code)) {
            throw BusinessRuleException("Código de verificación inválido")
        }
        user.twoFactorEnabled = false
        user.twoFactorSecret = null
        return UserResponse.from(userRepository.save(user))
    }

    private fun currentUser(): User =
        userRepository.findById(SecurityUtils.currentUserId()).orElseThrow { NotFoundException("Usuario no encontrado") }
}
