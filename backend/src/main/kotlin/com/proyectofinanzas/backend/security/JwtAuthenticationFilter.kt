package com.proyectofinanzas.backend.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthenticationFilter(
    private val jwtService: JwtService,
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val header = request.getHeader("Authorization")
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response)
            return
        }

        val token = header.substring(7)
        val claims = jwtService.parseClaims(token)
        val isPendingTwoFactorToken = claims?.get("purpose") == JwtService.PENDING_2FA_PURPOSE
        if (claims != null && !isPendingTwoFactorToken && SecurityContextHolder.getContext().authentication == null) {
            val userId = claims.subject
            val role = claims["role"] as String
            val authorities = listOf(SimpleGrantedAuthority("ROLE_$role"))
            val authToken = UsernamePasswordAuthenticationToken(userId, null, authorities)
            authToken.details = WebAuthenticationDetailsSource().buildDetails(request)
            SecurityContextHolder.getContext().authentication = authToken
        }

        filterChain.doFilter(request, response)
    }
}
