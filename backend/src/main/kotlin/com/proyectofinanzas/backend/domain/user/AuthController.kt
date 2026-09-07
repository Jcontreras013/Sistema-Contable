package com.proyectofinanzas.backend.domain.user

import com.proyectofinanzas.backend.common.BusinessRuleException
import com.proyectofinanzas.backend.common.NotFoundException
import com.proyectofinanzas.backend.security.JwtService
import com.proyectofinanzas.backend.security.SecurityUtils
import com.proyectofinanzas.backend.security.TotpService
import jakarta.validation.Valid
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val jwtService: JwtService,
    private val userRepository: UserRepository,
    private val totpService: TotpService,
    private val twoFactorService: TwoFactorService,
) {

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): LoginResponse {
        authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken(request.email, request.password)
        )
        val user = userRepository.findByEmailIgnoreCase(request.email)
            .orElseThrow { NotFoundException("Usuario no encontrado") }
        if (user.twoFactorEnabled) {
            val pendingToken = jwtService.generatePendingTwoFactorToken(requireNotNull(user.id))
            return LoginResponse(requiresTwoFactor = true, pendingToken = pendingToken)
        }
        val token = jwtService.generateToken(requireNotNull(user.id), user.email, user.role.name)
        return LoginResponse(token = token, user = UserResponse.from(user))
    }

    @PostMapping("/login/verify-2fa")
    fun verifyTwoFactor(@Valid @RequestBody request: VerifyTwoFactorRequest): LoginResponse {
        val userId = jwtService.parsePendingTwoFactorUserId(request.pendingToken)
            ?: throw BusinessRuleException("La sesión de verificación expiró; inicia sesión de nuevo")
        val user = userRepository.findById(userId).orElseThrow { NotFoundException("Usuario no encontrado") }
        val secret = user.twoFactorSecret
        if (!user.twoFactorEnabled || secret == null || !totpService.verifyCode(secret, request.code)) {
            throw BusinessRuleException("Código de verificación inválido")
        }
        val token = jwtService.generateToken(requireNotNull(user.id), user.email, user.role.name)
        return LoginResponse(token = token, user = UserResponse.from(user))
    }

    @GetMapping("/me")
    fun me(): UserResponse {
        val user = userRepository.findById(SecurityUtils.currentUserId())
            .orElseThrow { NotFoundException("Usuario no encontrado") }
        return UserResponse.from(user)
    }

    @PostMapping("/2fa/setup")
    fun setupTwoFactor(): TwoFactorSetupResponse = twoFactorService.setup()

    @PostMapping("/2fa/enable")
    fun enableTwoFactor(@Valid @RequestBody request: EnableTwoFactorRequest): UserResponse =
        twoFactorService.enable(request)

    @PostMapping("/2fa/disable")
    fun disableTwoFactor(@Valid @RequestBody request: DisableTwoFactorRequest): UserResponse =
        twoFactorService.disable(request)
}
