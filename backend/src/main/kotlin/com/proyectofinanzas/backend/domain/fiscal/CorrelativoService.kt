package com.proyectofinanzas.backend.domain.fiscal

import com.proyectofinanzas.backend.common.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

data class CorrelativoAsignado(
    val correlativo: String,
    val caiCode: String,
    val emissionLimitDate: LocalDate,
)

/**
 * Asigna correlativos fiscales tomando la autorización CAI activa, siguiendo el formato de 16
 * dígitos del SAR: Establecimiento(3)-PuntoEmision(3)-TipoDocumento(2)-Correlativo(8).
 */
@Service
@Transactional
class CorrelativoService(
    private val caiAuthorizationRepository: CaiAuthorizationRepository,
) {
    companion object {
        const val DOCUMENT_TYPE_FACTURA = "01"

        // El código de tipo de documento que el SAR asigna para notas de crédito/débito varía
        // según lo que indique tu autorización CAI; estos son los valores usuales sugeridos en
        // Configuración fiscal, pero registra ahí el que te haya asignado el SAR.
        const val DOCUMENT_TYPE_CREDIT_NOTE = "03"
        const val DOCUMENT_TYPE_DEBIT_NOTE = "04"
    }

    fun nextForFactura(): CorrelativoAsignado = next(DOCUMENT_TYPE_FACTURA, "facturas")

    fun nextForCreditNote(): CorrelativoAsignado = next(DOCUMENT_TYPE_CREDIT_NOTE, "notas de crédito")

    fun nextForDebitNote(): CorrelativoAsignado = next(DOCUMENT_TYPE_DEBIT_NOTE, "notas de débito")

    private fun next(documentTypeCode: String, documentLabel: String): CorrelativoAsignado {
        val cai = caiAuthorizationRepository
            .findFirstByDocumentTypeCodeAndIsActiveTrueOrderByCreatedAtDesc(documentTypeCode)
            .orElseThrow {
                BusinessRuleException(
                    "No hay una autorización CAI activa para $documentLabel (tipo de documento " +
                        "$documentTypeCode). Regístrala en Configuración fiscal antes de emitir."
                )
            }
        if (cai.emissionLimitDate.isBefore(LocalDate.now())) {
            throw BusinessRuleException(
                "La autorización CAI vigente para $documentLabel venció el ${cai.emissionLimitDate}. " +
                    "Registra una nueva en Configuración fiscal antes de emitir."
            )
        }
        if (cai.currentNumber > cai.rangeEnd) {
            throw BusinessRuleException(
                "La autorización CAI vigente para $documentLabel agotó su rango autorizado " +
                    "(${cai.rangeStart}-${cai.rangeEnd}). Registra una nueva en Configuración fiscal " +
                    "antes de emitir."
            )
        }
        val numero = cai.currentNumber
        cai.currentNumber = numero + 1
        caiAuthorizationRepository.save(cai)
        val correlativo = "%s-%s-%s-%08d".format(
            cai.establishmentCode,
            cai.emissionPointCode,
            cai.documentTypeCode,
            numero,
        )
        return CorrelativoAsignado(
            correlativo = correlativo,
            caiCode = cai.caiCode,
            emissionLimitDate = cai.emissionLimitDate,
        )
    }
}
