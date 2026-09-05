package com.proyectofinanzas.backend.domain.creditnote

import com.proyectofinanzas.backend.common.BusinessRuleException
import com.proyectofinanzas.backend.common.MoneyUtils
import com.proyectofinanzas.backend.common.NotFoundException
import com.proyectofinanzas.backend.domain.account.AccountRepository
import com.proyectofinanzas.backend.domain.fiscal.CorrelativoService
import com.proyectofinanzas.backend.domain.invoice.InvoiceRepository
import com.proyectofinanzas.backend.domain.invoice.InvoiceStatus
import com.proyectofinanzas.backend.domain.journal.PostingService
import com.proyectofinanzas.backend.domain.payment.PaymentRepository
import com.proyectofinanzas.backend.domain.user.UserRepository
import com.proyectofinanzas.backend.security.SecurityUtils
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class CreditDebitNoteService(
    private val creditDebitNoteRepository: CreditDebitNoteRepository,
    private val invoiceRepository: InvoiceRepository,
    private val accountRepository: AccountRepository,
    private val userRepository: UserRepository,
    private val paymentRepository: PaymentRepository,
    private val correlativoService: CorrelativoService,
    private val creditDebitNotePostingService: CreditDebitNotePostingService,
    private val postingService: PostingService,
) {

    fun create(request: CreateCreditDebitNoteRequest): CreditDebitNoteResponse {
        val invoice = invoiceRepository.findById(request.invoiceId)
            .orElseThrow { NotFoundException("Factura no encontrada") }
        if (invoice.status == InvoiceStatus.CANCELLED) {
            throw BusinessRuleException("No se puede emitir una nota sobre una factura cancelada")
        }
        val account = accountRepository.findById(request.accountId)
            .orElseThrow { NotFoundException("Cuenta no encontrada") }
        val createdBy = userRepository.findById(SecurityUtils.currentUserId())
            .orElseThrow { NotFoundException("Usuario no encontrado") }

        val subtotal = MoneyUtils.round(request.subtotal)
        val taxAmount = MoneyUtils.round(request.taxAmount)
        val total = subtotal + taxAmount
        val amountInBase = MoneyUtils.toBase(total, invoice.exchangeRate)

        if (request.type == NoteType.CREDIT) {
            val invoiceId = requireNotNull(invoice.id)
            val paid = paymentRepository.sumAmountInBaseByInvoiceId(invoiceId)
            val creditedSoFar = creditDebitNoteRepository.sumAmountInBaseByInvoiceIdAndType(invoiceId, NoteType.CREDIT)
            val debitedSoFar = creditDebitNoteRepository.sumAmountInBaseByInvoiceIdAndType(invoiceId, NoteType.DEBIT)
            val outstanding = invoice.amountInBase - paid - creditedSoFar + debitedSoFar
            if (amountInBase.compareTo(outstanding) > 0) {
                throw BusinessRuleException(
                    "La nota de crédito ($amountInBase) supera el saldo pendiente de la factura ($outstanding)"
                )
            }
        }

        val correlativo = if (request.type == NoteType.CREDIT) {
            correlativoService.nextForCreditNote()
        } else {
            correlativoService.nextForDebitNote()
        }

        val note = CreditDebitNote(
            invoice = invoice,
            type = request.type,
            issueDate = request.issueDate,
            reason = request.reason,
            account = account,
            subtotal = subtotal,
            taxAmount = taxAmount,
            total = total,
            amountInBase = amountInBase,
            status = NoteStatus.ISSUED,
            correlativo = correlativo.correlativo,
            caiCode = correlativo.caiCode,
            caiEmissionLimitDate = correlativo.emissionLimitDate,
            createdBy = createdBy,
        )
        // saveAndFlush: necesitamos el noteNumber generado por la secuencia de la BD antes de
        // usarlo en la descripción del asiento contable.
        val saved = creditDebitNoteRepository.saveAndFlush(note)
        val journalEntry = creditDebitNotePostingService.post(saved, SecurityUtils.currentUserId())
        saved.journalEntry = journalEntry

        return CreditDebitNoteResponse.from(creditDebitNoteRepository.save(saved))
    }

    fun cancel(id: UUID): CreditDebitNoteResponse {
        val note = findEntity(id)
        if (note.status == NoteStatus.CANCELLED) {
            throw BusinessRuleException("La nota ya está cancelada")
        }
        val journalEntry = note.journalEntry
        if (journalEntry != null) {
            postingService.reverse(
                original = journalEntry,
                entryDate = LocalDate.now(),
                reason = "Cancelación de nota #${note.noteNumber}",
                createdById = SecurityUtils.currentUserId(),
            )
        }
        note.status = NoteStatus.CANCELLED
        return CreditDebitNoteResponse.from(creditDebitNoteRepository.save(note))
    }

    @Transactional(readOnly = true)
    fun listByInvoice(invoiceId: UUID): List<CreditDebitNoteResponse> =
        creditDebitNoteRepository.findAllByInvoiceIdOrderByIssueDateDescNoteNumberDesc(invoiceId)
            .map { CreditDebitNoteResponse.from(it) }

    @Transactional(readOnly = true)
    fun get(id: UUID): CreditDebitNoteResponse = CreditDebitNoteResponse.from(findEntity(id))

    private fun findEntity(id: UUID): CreditDebitNote =
        creditDebitNoteRepository.findById(id).orElseThrow { NotFoundException("Nota no encontrada") }
}
