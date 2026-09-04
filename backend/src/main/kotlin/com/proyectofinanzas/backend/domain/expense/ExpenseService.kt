package com.proyectofinanzas.backend.domain.expense

import com.proyectofinanzas.backend.common.BusinessRuleException
import com.proyectofinanzas.backend.common.Currency
import com.proyectofinanzas.backend.common.MoneyUtils
import com.proyectofinanzas.backend.common.NotFoundException
import com.proyectofinanzas.backend.domain.account.AccountRepository
import com.proyectofinanzas.backend.domain.exchangerate.ExchangeRateService
import com.proyectofinanzas.backend.domain.journal.PostingService
import com.proyectofinanzas.backend.domain.party.PartyRepository
import com.proyectofinanzas.backend.domain.payment.PaymentRepository
import com.proyectofinanzas.backend.domain.product.ProductRepository
import com.proyectofinanzas.backend.domain.user.UserRepository
import com.proyectofinanzas.backend.security.SecurityUtils
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class ExpenseService(
    private val expenseRepository: ExpenseRepository,
    private val partyRepository: PartyRepository,
    private val accountRepository: AccountRepository,
    private val userRepository: UserRepository,
    private val exchangeRateService: ExchangeRateService,
    private val paymentRepository: PaymentRepository,
    private val expensePostingService: ExpensePostingService,
    private val postingService: PostingService,
    private val productRepository: ProductRepository,
) {

    fun create(request: CreateExpenseRequest): ExpenseResponse {
        val party = request.partyId?.let {
            partyRepository.findById(it).orElseThrow { NotFoundException("Tercero no encontrado") }
        }
        val product = request.productId?.let {
            productRepository.findById(it).orElseThrow { NotFoundException("Producto no encontrado") }
        }
        val account = when {
            product != null -> product.account
            request.accountId != null -> accountRepository.findById(request.accountId)
                .orElseThrow { NotFoundException("Cuenta no encontrada") }
            else -> throw BusinessRuleException("Selecciona un producto o una cuenta de gasto")
        }
        val createdBy = userRepository.findById(SecurityUtils.currentUserId())
            .orElseThrow { NotFoundException("Usuario no encontrado") }

        val exchangeRate = if (request.currency == Currency.HNL) {
            BigDecimal.ONE
        } else {
            request.exchangeRate ?: exchangeRateService.rateFor(request.expenseDate)
        }
        val amount = MoneyUtils.round(request.amount)
        val amountInBase = MoneyUtils.toBase(amount, exchangeRate)

        val expense = Expense(
            party = party,
            expenseDate = request.expenseDate,
            currency = request.currency,
            exchangeRate = exchangeRate,
            account = account,
            description = request.description,
            paymentMethod = request.paymentMethod,
            amount = amount,
            amountInBase = amountInBase,
            status = ExpenseStatus.POSTED,
            createdBy = createdBy,
            product = product,
        )
        // saveAndFlush: necesitamos el expenseNumber generado por la secuencia de la BD
        // (vía @Generated) antes de usarlo en la descripción del asiento contable.
        val savedExpense = expenseRepository.saveAndFlush(expense)
        val journalEntry = expensePostingService.post(savedExpense, SecurityUtils.currentUserId())
        savedExpense.journalEntry = journalEntry

        return toResponse(expenseRepository.save(savedExpense))
    }

    fun cancel(id: UUID): ExpenseResponse {
        val expense = findEntity(id)
        if (expense.status == ExpenseStatus.CANCELLED) {
            throw BusinessRuleException("El gasto ya está cancelado")
        }
        val paid = paymentRepository.sumAmountInBaseByExpenseId(id)
        if (paid.signum() > 0) {
            throw BusinessRuleException("No se puede cancelar un gasto con pagos registrados")
        }
        val journalEntry = expense.journalEntry
        if (journalEntry != null) {
            postingService.reverse(
                original = journalEntry,
                entryDate = LocalDate.now(),
                reason = "Cancelación de gasto #${expense.expenseNumber}",
                createdById = SecurityUtils.currentUserId(),
            )
        }
        expense.status = ExpenseStatus.CANCELLED
        return toResponse(expenseRepository.save(expense))
    }

    @Transactional(readOnly = true)
    fun list(pageable: Pageable, partyId: UUID? = null): Page<ExpenseResponse> =
        (
            if (partyId != null) {
                expenseRepository.findAllByPartyIdOrderByExpenseDateDescExpenseNumberDesc(partyId, pageable)
            } else {
                expenseRepository.findAllByOrderByExpenseDateDescExpenseNumberDesc(pageable)
            }
        ).map { toResponse(it) }

    @Transactional(readOnly = true)
    fun get(id: UUID): ExpenseResponse = toResponse(findEntity(id))

    private fun findEntity(id: UUID): Expense =
        expenseRepository.findById(id).orElseThrow { NotFoundException("Gasto no encontrado") }

    private fun toResponse(expense: Expense): ExpenseResponse {
        val paid = paymentRepository.sumAmountInBaseByExpenseId(requireNotNull(expense.id))
        return ExpenseResponse(
            id = requireNotNull(expense.id),
            expenseNumber = expense.expenseNumber,
            partyId = expense.party?.id,
            partyName = expense.party?.name,
            expenseDate = expense.expenseDate,
            currency = expense.currency,
            exchangeRate = expense.exchangeRate,
            accountId = requireNotNull(expense.account.id),
            accountName = expense.account.name,
            productId = expense.product?.id,
            productDescription = expense.product?.description,
            description = expense.description,
            paymentMethod = expense.paymentMethod,
            amount = expense.amount,
            amountInBase = expense.amountInBase,
            paidInBase = paid,
            balanceInBase = expense.amountInBase - paid,
            status = expense.status,
            journalEntryId = expense.journalEntry?.id,
            createdAt = requireNotNull(expense.createdAt),
        )
    }
}
