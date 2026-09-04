package com.proyectofinanzas.backend.domain.party

import com.proyectofinanzas.backend.common.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class PartyService(
    private val partyRepository: PartyRepository,
) {
    @Transactional(readOnly = true)
    fun list(): List<PartyResponse> = partyRepository.findAllByOrderByNameAsc().map { PartyResponse.from(it) }

    @Transactional(readOnly = true)
    fun get(id: UUID): PartyResponse = PartyResponse.from(findEntity(id))

    fun create(request: PartyRequest): PartyResponse {
        val party = Party(
            type = request.type,
            name = request.name,
            rtn = request.rtn,
            email = request.email,
            phone = request.phone,
            address = request.address,
            isActive = request.isActive,
            taxRegime = request.taxRegime,
            isrWithholdingAgent = request.isrWithholdingAgent,
            isvWithholdingAgent = request.isvWithholdingAgent,
            withholdingRate = request.withholdingRate,
            additionalEmails = request.additionalEmails.toMutableList(),
        )
        return PartyResponse.from(partyRepository.save(party))
    }

    fun update(id: UUID, request: PartyRequest): PartyResponse {
        val party = findEntity(id)
        party.type = request.type
        party.name = request.name
        party.rtn = request.rtn
        party.email = request.email
        party.phone = request.phone
        party.address = request.address
        party.isActive = request.isActive
        party.taxRegime = request.taxRegime
        party.isrWithholdingAgent = request.isrWithholdingAgent
        party.isvWithholdingAgent = request.isvWithholdingAgent
        party.withholdingRate = request.withholdingRate
        party.additionalEmails = request.additionalEmails.toMutableList()
        return PartyResponse.from(partyRepository.save(party))
    }

    fun deactivate(id: UUID) {
        val party = findEntity(id)
        party.isActive = false
        partyRepository.save(party)
    }

    private fun findEntity(id: UUID): Party =
        partyRepository.findById(id).orElseThrow { NotFoundException("Tercero no encontrado") }
}
