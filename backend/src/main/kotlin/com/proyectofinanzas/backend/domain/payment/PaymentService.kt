package com.proyectofinanzas.backend.domain.payment

import com.proyectofinanzas.backend.common.BusinessRuleException
import com.proyectofinanzas.backend.common.Currency
import com.proyectofinanzas.backend.common.MoneyUtils
import com.proyectofinanzas.backend.common.NotFoundException
import com.proyectofinanzas.backend.domain.exchangerate.ExchangeRateService
import com.proyectofinanzas.backend.domain.expense.ExpenseRepository
import com.proyectofinanzas.backend.domain.expense.ExpenseStatus
import com.proyectofinanzas.backend.domain.invoice.InvoiceRepository
import com.proyectofinanzas.backend.domain.invoice.InvoiceStatus
import com.proyectofinanzas.backend.domain.user.UserRepository
import com.proyectofinanzas.backend.security.SecurityUtils
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.UUID

@Service
@Transactional
class PaymentService(
    private val paymentRepository: PaymentRepository,
    private val invoiceRepository: InvoiceRepository,
    private val expenseRepository: ExpenseRepository,
    private val userRepository: UserRepository,
    private val exchangeRateService: ExchangeRateService,
    private val paymentPostingService: PaymentPostingService,
) {

    fun create(request: CreatePaymentRequest): PaymentResponse {
        val hasInvoice = request.invoiceId != null
        val hasExpense = request.expenseId != null
        if (hasInvoice == hasExpense) {
            throw BusinessRuleException("Un pago debe aplicar a exactamente una factura o un gasto")
        }

        val exchangeRate = if (request.currency == Currency.HNL) {
            BigDecimal.ONE
        } else {
            request.exchangeRate ?: exchangeRateService.rateFor(request.paymentDate)
        }
        val amountInBase = MoneyUtils.toBase(request.amount, exchangeRate)

        val createdBy = userRepository.findById(SecurityUtils.currentUserId())
            .orElseThrow { NotFoundException("Usuario no encontrado") }

        val payment = if (hasInvoice) {
            val invoice = invoiceRepository.findById(request.invoiceId!!)
                .orElseThrow { NotFoundException("Factura no encontrada") }
            if (invoice.status == InvoiceStatus.CANCELLED) {
                throw BusinessRuleException("No se puede registrar un cobro sobre una factura cancelada")
            }
            val alreadyPaid = paymentRepository.sumAmountInBaseByInvoiceId(requireNotNull(invoice.id))
            val balance = invoice.amountInBase - alreadyPaid
            if (amountInBase.compareTo(balance) > 0) {
                throw BusinessRuleException("El cobro ($amountInBase) supera el saldo pendiente ($balance)")
            }
            Payment(
                invoice = invoice,
                amount = request.amount,
                currency = request.currency,
                exchangeRate = exchangeRate,
                amountInBase = amountInBase,
                paymentDate = request.paymentDate,
                method = request.method,
                createdBy = createdBy,
            )
        } else {
            val expense = expenseRepository.findById(request.expenseId!!)
                .orElseThrow { NotFoundException("Gasto no encontrado") }
            if (expense.status == ExpenseStatus.CANCELLED) {
                throw BusinessRuleException("No se puede registrar un pago sobre un gasto cancelado")
            }
            val alreadyPaid = paymentRepository.sumAmountInBaseByExpenseId(requireNotNull(expense.id))
            val balance = expense.amountInBase - expense.withheldInBase - alreadyPaid
            if (amountInBase.compareTo(balance) > 0) {
                throw BusinessRuleException("El pago ($amountInBase) supera el saldo pendiente ($balance)")
            }
            Payment(
                expense = expense,
                amount = request.amount,
                currency = request.currency,
                exchangeRate = exchangeRate,
                amountInBase = amountInBase,
                paymentDate = request.paymentDate,
                method = request.method,
                createdBy = createdBy,
            )
        }

        // saveAndFlush: necesitamos el paymentNumber generado por la secuencia de la BD
        // (vía @Generated) antes de usarlo en la descripción del asiento contable.
        val savedPayment = paymentRepository.saveAndFlush(payment)
        val journalEntry = paymentPostingService.post(savedPayment, SecurityUtils.currentUserId())
        savedPayment.journalEntry = journalEntry

        if (hasInvoice) {
            val invoice = requireNotNull(savedPayment.invoice)
            val totalPaid = paymentRepository.sumAmountInBaseByInvoiceId(requireNotNull(invoice.id))
            invoice.status = if (totalPaid.compareTo(invoice.amountInBase) >= 0) {
                InvoiceStatus.PAID
            } else {
                InvoiceStatus.PARTIALLY_PAID
            }
            invoiceRepository.save(invoice)
        } else {
            val expense = requireNotNull(savedPayment.expense)
            val totalPaid = paymentRepository.sumAmountInBaseByExpenseId(requireNotNull(expense.id))
            val netPayable = expense.amountInBase - expense.withheldInBase
            expense.status = if (totalPaid.compareTo(netPayable) >= 0) {
                ExpenseStatus.PAID
            } else {
                ExpenseStatus.PARTIALLY_PAID
            }
            expenseRepository.save(expense)
        }

        return PaymentResponse.from(paymentRepository.save(savedPayment))
    }

    @Transactional(readOnly = true)
    fun listByInvoice(invoiceId: UUID): List<PaymentResponse> =
        paymentRepository.findByInvoiceIdOrderByPaymentDateDesc(invoiceId).map { PaymentResponse.from(it) }

    @Transactional(readOnly = true)
    fun listByExpense(expenseId: UUID): List<PaymentResponse> =
        paymentRepository.findByExpenseIdOrderByPaymentDateDesc(expenseId).map { PaymentResponse.from(it) }
}
