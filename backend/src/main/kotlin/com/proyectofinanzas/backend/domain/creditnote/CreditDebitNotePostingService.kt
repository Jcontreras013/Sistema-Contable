package com.proyectofinanzas.backend.domain.creditnote

import com.proyectofinanzas.backend.common.MoneyUtils
import com.proyectofinanzas.backend.common.NotFoundException
import com.proyectofinanzas.backend.domain.account.AccountRepository
import com.proyectofinanzas.backend.domain.account.AccountSystemRole
import com.proyectofinanzas.backend.domain.journal.JournalEntry
import com.proyectofinanzas.backend.domain.journal.JournalSourceType
import com.proyectofinanzas.backend.domain.journal.PostingLine
import com.proyectofinanzas.backend.domain.journal.PostingService
import java.math.BigDecimal
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * Contabiliza una nota de crédito/débito ya persistida:
 *   Nota de CRÉDITO (reduce lo que debe el cliente):
 *     Dr Cuenta indicada (subtotal)      Dr ISV por pagar (si aplica)
 *     Cr Cuentas por Cobrar (total)
 *   Nota de DÉBITO (aumenta lo que debe el cliente): el mismo asiento, invertido.
 *
 * subtotal/taxAmount/total de la nota están en la moneda de la factura original; se
 * convierten a HNL con la tasa de esa factura (no la del día de la nota), para reversar
 * exactamente lo que se contabilizó al facturar. El impuesto se convierte primero y la
 * cuenta indicada absorbe el remanente de redondeo, igual que en InvoicePostingService.
 */
@Service
class CreditDebitNotePostingService(
    private val accountRepository: AccountRepository,
    private val postingService: PostingService,
) {

    fun post(note: CreditDebitNote, createdById: UUID): JournalEntry {
        val arAccount = accountRepository.findBySystemRole(AccountSystemRole.ACCOUNTS_RECEIVABLE)
            .orElseThrow { NotFoundException("No hay una cuenta configurada con rol ACCOUNTS_RECEIVABLE") }

        val exchangeRate = note.invoice.exchangeRate
        val taxInBase = MoneyUtils.toBase(note.taxAmount, exchangeRate)
        val accountAmountInBase = note.amountInBase - taxInBase

        val label = if (note.type == NoteType.CREDIT) "Nota de crédito" else "Nota de débito"
        val description = "$label #${note.noteNumber} - factura #${note.invoice.invoiceNumber}"
        val isCredit = note.type == NoteType.CREDIT

        val lines = mutableListOf(
            PostingLine(
                accountId = requireNotNull(note.account.id),
                partyId = note.invoice.party.id,
                debit = if (isCredit) accountAmountInBase else BigDecimal.ZERO,
                credit = if (isCredit) BigDecimal.ZERO else accountAmountInBase,
                description = description,
            )
        )

        if (taxInBase.signum() > 0) {
            val taxAccount = accountRepository.findBySystemRole(AccountSystemRole.TAX_PAYABLE)
                .orElseThrow { NotFoundException("No hay una cuenta configurada con rol TAX_PAYABLE") }
            lines.add(
                PostingLine(
                    accountId = requireNotNull(taxAccount.id),
                    partyId = note.invoice.party.id,
                    debit = if (isCredit) taxInBase else BigDecimal.ZERO,
                    credit = if (isCredit) BigDecimal.ZERO else taxInBase,
                    description = description,
                )
            )
        }

        lines.add(
            PostingLine(
                accountId = requireNotNull(arAccount.id),
                partyId = note.invoice.party.id,
                debit = if (isCredit) BigDecimal.ZERO else note.amountInBase,
                credit = if (isCredit) note.amountInBase else BigDecimal.ZERO,
                description = description,
            )
        )

        return postingService.post(
            entryDate = note.issueDate,
            description = "$description - ${note.invoice.party.name}",
            sourceType = if (isCredit) JournalSourceType.CREDIT_NOTE else JournalSourceType.DEBIT_NOTE,
            sourceId = note.id,
            lines = lines,
            createdById = createdById,
        )
    }
}
