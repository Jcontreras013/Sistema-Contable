package com.proyectofinanzas.backend.domain.fiscal

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class CompanyProfileService(
    private val companyProfileRepository: CompanyProfileRepository,
) {
    @Transactional(readOnly = true)
    fun get(): CompanyProfileResponse? =
        companyProfileRepository.findFirstByOrderByCreatedAtAsc().map { CompanyProfileResponse.from(it) }.orElse(null)

    fun getEntity(): CompanyProfile? = companyProfileRepository.findFirstByOrderByCreatedAtAsc().orElse(null)

    fun upsert(request: CompanyProfileRequest): CompanyProfileResponse {
        val entity = companyProfileRepository.findFirstByOrderByCreatedAtAsc().orElseGet {
            CompanyProfile(legalName = request.legalName, rtn = request.rtn)
        }
        entity.legalName = request.legalName
        entity.rtn = request.rtn
        entity.address = request.address
        entity.phone = request.phone
        entity.email = request.email
        return CompanyProfileResponse.from(companyProfileRepository.save(entity))
    }
}
