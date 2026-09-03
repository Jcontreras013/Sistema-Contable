package com.proyectofinanzas.backend.domain.fiscal

import com.proyectofinanzas.backend.common.BusinessRuleException
import com.proyectofinanzas.backend.common.NotFoundException
import com.proyectofinanzas.backend.domain.user.UserRepository
import com.proyectofinanzas.backend.security.SecurityUtils
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class CaiAuthorizationService(
    private val caiAuthorizationRepository: CaiAuthorizationRepository,
    private val userRepository: UserRepository,
) {
    @Transactional(readOnly = true)
    fun list(): List<CaiAuthorizationResponse> =
        caiAuthorizationRepository.findAllByOrderByCreatedAtDesc().map { CaiAuthorizationResponse.from(it) }

    /** Registrar una nueva autorización desactiva automáticamente la anterior del mismo tipo. */
    fun create(request: CreateCaiAuthorizationRequest): CaiAuthorizationResponse {
        if (request.rangeEnd < request.rangeStart) {
            throw BusinessRuleException("El rango final no puede ser menor que el inicial")
        }
        val createdBy = userRepository.findById(SecurityUtils.currentUserId())
            .orElseThrow { NotFoundException("Usuario no encontrado") }

        caiAuthorizationRepository
            .findFirstByDocumentTypeCodeAndIsActiveTrueOrderByCreatedAtDesc(request.documentTypeCode)
            .ifPresent {
                it.isActive = false
                caiAuthorizationRepository.save(it)
            }

        val entity = CaiAuthorization(
            caiCode = request.caiCode,
            establishmentCode = request.establishmentCode,
            emissionPointCode = request.emissionPointCode,
            documentTypeCode = request.documentTypeCode,
            rangeStart = request.rangeStart,
            rangeEnd = request.rangeEnd,
            currentNumber = request.rangeStart,
            emissionLimitDate = request.emissionLimitDate,
            isActive = true,
            createdBy = createdBy,
        )
        return CaiAuthorizationResponse.from(caiAuthorizationRepository.save(entity))
    }
}
