package com.proyectofinanzas.backend.seed

import com.proyectofinanzas.backend.common.Currency
import com.proyectofinanzas.backend.domain.account.Account
import com.proyectofinanzas.backend.domain.account.AccountRepository
import com.proyectofinanzas.backend.domain.account.AccountSystemRole
import com.proyectofinanzas.backend.domain.account.AccountType
import com.proyectofinanzas.backend.domain.exchangerate.ExchangeRateRequest
import com.proyectofinanzas.backend.domain.exchangerate.ExchangeRateService
import com.proyectofinanzas.backend.domain.expense.CreateExpenseRequest
import com.proyectofinanzas.backend.domain.expense.ExpensePaymentMethod
import com.proyectofinanzas.backend.domain.expense.ExpenseService
import com.proyectofinanzas.backend.domain.fiscal.CaiAuthorizationService
import com.proyectofinanzas.backend.domain.fiscal.CompanyProfileRequest
import com.proyectofinanzas.backend.domain.fiscal.CompanyProfileService
import com.proyectofinanzas.backend.domain.fiscal.CreateCaiAuthorizationRequest
import com.proyectofinanzas.backend.domain.invoice.CreateInvoiceRequest
import com.proyectofinanzas.backend.domain.invoice.InvoiceLineRequest
import com.proyectofinanzas.backend.domain.invoice.InvoiceService
import com.proyectofinanzas.backend.domain.party.Party
import com.proyectofinanzas.backend.domain.party.PartyRepository
import com.proyectofinanzas.backend.domain.party.PartyType
import com.proyectofinanzas.backend.domain.payment.CreatePaymentRequest
import com.proyectofinanzas.backend.domain.payment.PaymentMethod
import com.proyectofinanzas.backend.domain.payment.PaymentService
import com.proyectofinanzas.backend.domain.user.Role
import com.proyectofinanzas.backend.domain.user.User
import com.proyectofinanzas.backend.domain.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Profile
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate

/**
 * Puebla una base de datos vacía con usuarios demo, un plan de cuentas ilustrativo para
 * Honduras y algunas transacciones de ejemplo, para que el sistema sea explorable de
 * inmediato tras el primer arranque. No corre si ya existen usuarios, ni en perfil "prod".
 */
@Component
@Profile("!prod")
class DataSeeder(
    private val userRepository: UserRepository,
    private val accountRepository: AccountRepository,
    private val partyRepository: PartyRepository,
    private val passwordEncoder: PasswordEncoder,
    private val exchangeRateService: ExchangeRateService,
    private val invoiceService: InvoiceService,
    private val expenseService: ExpenseService,
    private val paymentService: PaymentService,
    private val companyProfileService: CompanyProfileService,
    private val caiAuthorizationService: CaiAuthorizationService,
    @Value("\${app.seed.enabled:true}") private val enabled: Boolean,
) : ApplicationRunner {

    private val log = LoggerFactory.getLogger(DataSeeder::class.java)

    @Transactional
    override fun run(args: ApplicationArguments) {
        if (!enabled || userRepository.count() > 0) {
            return
        }
        log.info("Base de datos vacía: sembrando usuarios demo, plan de cuentas y datos de ejemplo...")

        val admin = createUser("admin@demo.com", "Demo1234!", "Administradora Demo", Role.ADMIN)
        createUser("contador@demo.com", "Demo1234!", "Contador Demo", Role.ACCOUNTANT)
        createUser("auditor@demo.com", "Demo1234!", "Auditor Demo", Role.AUDITOR)

        val accounts = seedChartOfAccounts()
        val customer = partyRepository.save(
            Party(type = PartyType.CUSTOMER, name = "Comercial El Progreso, S. de R.L.", rtn = "08019999123456", email = "contacto@elprogreso.hn")
        )
        val customer2 = partyRepository.save(
            Party(type = PartyType.CUSTOMER, name = "Distribuidora Catracha, S.A.", rtn = "05019999654321", email = "ventas@catracha.hn")
        )
        val vendor = partyRepository.save(
            Party(type = PartyType.VENDOR, name = "Suplidora Central de Oficina", rtn = "08011234567890", email = "facturacion@suplidoracentral.hn")
        )

        companyProfileService.upsert(
            CompanyProfileRequest(
                legalName = "Comercial Ejemplo, S. de R.L. (datos demo, reemplázalos por los reales)",
                rtn = "08019999000001",
                address = "Boulevard Morazán, Tegucigalpa, Honduras",
                phone = "+504 2222-3333",
                email = "facturacion@ejemplo-demo.hn",
            )
        )

        runAs(admin) {
            exchangeRateService.upsert(ExchangeRateRequest(rateDate = LocalDate.now().minusDays(30), rate = BigDecimal("24.70")))
            exchangeRateService.upsert(ExchangeRateRequest(rateDate = LocalDate.now(), rate = BigDecimal("24.85")))

            // CAI de ejemplo para poder emitir facturas demo. No es válido ante el SAR: hay que
            // solicitar el CAI real como autoimpresor y registrarlo en Configuración fiscal.
            caiAuthorizationService.create(
                CreateCaiAuthorizationRequest(
                    caiCode = "DEMO0-DEMO00-DEMO00-DEMO00-DEMO0D",
                    establishmentCode = "001",
                    emissionPointCode = "001",
                    documentTypeCode = "01",
                    rangeStart = 1,
                    rangeEnd = 5000,
                    emissionLimitDate = LocalDate.now().plusYears(1),
                )
            )

            val salesAccount = accounts.getValue("4101")
            val invoice1 = invoiceService.create(
                CreateInvoiceRequest(
                    partyId = requireNotNull(customer.id),
                    issueDate = LocalDate.now().minusDays(20),
                    dueDate = LocalDate.now().plusDays(10),
                    currency = Currency.HNL,
                    notes = "Servicios de consultoría - factura demo",
                    lines = listOf(
                        InvoiceLineRequest(
                            description = "Servicios de consultoría contable",
                            quantity = BigDecimal.ONE,
                            unitPrice = BigDecimal("15000.00"),
                            taxRate = BigDecimal("15.00"),
                            accountId = requireNotNull(salesAccount.id),
                        )
                    ),
                )
            )
            paymentService.create(
                CreatePaymentRequest(
                    invoiceId = invoice1.id,
                    amount = BigDecimal("8000.00"),
                    currency = Currency.HNL,
                    paymentDate = LocalDate.now().minusDays(5),
                    method = PaymentMethod.BANK,
                )
            )

            invoiceService.create(
                CreateInvoiceRequest(
                    partyId = requireNotNull(customer2.id),
                    issueDate = LocalDate.now().minusDays(3),
                    dueDate = LocalDate.now().plusDays(27),
                    currency = Currency.USD,
                    notes = "Venta de mercadería - factura demo en dólares",
                    lines = listOf(
                        InvoiceLineRequest(
                            description = "Lote de mercadería surtida",
                            quantity = BigDecimal.ONE,
                            unitPrice = BigDecimal("500.00"),
                            taxRate = BigDecimal("15.00"),
                            accountId = requireNotNull(accounts.getValue("4102").id),
                        )
                    ),
                )
            )

            val expense1 = expenseService.create(
                CreateExpenseRequest(
                    partyId = vendor.id,
                    expenseDate = LocalDate.now().minusDays(10),
                    currency = Currency.HNL,
                    accountId = requireNotNull(accounts.getValue("5104").id),
                    description = "Compra de papelería y útiles de oficina",
                    paymentMethod = ExpensePaymentMethod.CREDIT,
                    amount = BigDecimal("2350.00"),
                )
            )
            paymentService.create(
                CreatePaymentRequest(
                    expenseId = expense1.id,
                    amount = BigDecimal("2350.00"),
                    currency = Currency.HNL,
                    paymentDate = LocalDate.now().minusDays(2),
                    method = PaymentMethod.CASH,
                )
            )

            expenseService.create(
                CreateExpenseRequest(
                    expenseDate = LocalDate.now().minusDays(1),
                    currency = Currency.HNL,
                    accountId = requireNotNull(accounts.getValue("5102").id),
                    description = "Alquiler de oficina del mes",
                    paymentMethod = ExpensePaymentMethod.BANK,
                    amount = BigDecimal("12000.00"),
                )
            )
        }

        log.info(
            "Datos demo listos. Usuarios: admin@demo.com / contador@demo.com / auditor@demo.com " +
                "(clave: Demo1234!). El CAI sembrado es de ejemplo: regístralo con tu CAI real del " +
                "SAR en Configuración fiscal antes de facturar de verdad."
        )
    }

    private fun createUser(email: String, password: String, fullName: String, role: Role): User =
        userRepository.save(
            User(email = email, passwordHash = passwordEncoder.encode(password), fullName = fullName, role = role)
        )

    /** Ejecuta un bloque con el contexto de seguridad del usuario dado, como si fuera una petición autenticada. */
    private fun runAs(user: User, block: () -> Unit) {
        val authorities = listOf(SimpleGrantedAuthority("ROLE_${user.role.name}"))
        val auth = UsernamePasswordAuthenticationToken(user.id.toString(), null, authorities)
        val previous = SecurityContextHolder.getContext().authentication
        SecurityContextHolder.getContext().authentication = auth
        try {
            block()
        } finally {
            SecurityContextHolder.getContext().authentication = previous
        }
    }

    private fun seedChartOfAccounts(): Map<String, Account> {
        val accounts = LinkedHashMap<String, Account>()

        fun account(
            code: String,
            name: String,
            type: AccountType,
            parentCode: String? = null,
            allowsPosting: Boolean = true,
            systemRole: AccountSystemRole? = null,
        ): Account {
            val entity = Account(
                code = code,
                name = name,
                type = type,
                parent = parentCode?.let { accounts.getValue(it) },
                allowsPosting = allowsPosting,
                systemRole = systemRole,
            )
            val saved = accountRepository.save(entity)
            accounts[code] = saved
            return saved
        }

        account("1", "ACTIVO", AccountType.ASSET, allowsPosting = false)
        account("11", "ACTIVO CORRIENTE", AccountType.ASSET, "1", allowsPosting = false)
        account("1101", "Caja y Bancos (Lempiras)", AccountType.ASSET, "11", systemRole = AccountSystemRole.CASH_HNL)
        account("1102", "Caja y Bancos (Dólares)", AccountType.ASSET, "11", systemRole = AccountSystemRole.CASH_USD)
        account("1105", "Cuentas por Cobrar Clientes", AccountType.ASSET, "11", systemRole = AccountSystemRole.ACCOUNTS_RECEIVABLE)
        account("1110", "Inventario de Mercadería", AccountType.ASSET, "11")
        account("12", "ACTIVO NO CORRIENTE", AccountType.ASSET, "1", allowsPosting = false)
        account("1201", "Mobiliario y Equipo de Oficina", AccountType.ASSET, "12")
        account("1202", "Equipo de Cómputo", AccountType.ASSET, "12")
        account("1203", "Equipo de Red y Telecomunicaciones", AccountType.ASSET, "12")
        account("1204", "Vehículos", AccountType.ASSET, "12")
        // Depreciación acumulada es una cuenta contra-activo (naturaleza acreedora) que se
        // presenta bajo Activo No Corriente, restando el valor en libros de los activos fijos.
        account("1290", "Depreciación Acumulada", AccountType.ASSET, "12")

        account("2", "PASIVO", AccountType.LIABILITY, allowsPosting = false)
        account("21", "PASIVO CORRIENTE", AccountType.LIABILITY, "2", allowsPosting = false)
        account("2101", "Cuentas por Pagar Proveedores", AccountType.LIABILITY, "21", systemRole = AccountSystemRole.ACCOUNTS_PAYABLE)
        account("2105", "ISV por Pagar", AccountType.LIABILITY, "21", systemRole = AccountSystemRole.TAX_PAYABLE)
        account("2106", "Retenciones por Pagar", AccountType.LIABILITY, "21", systemRole = AccountSystemRole.WITHHOLDING_TAX_PAYABLE)
        account("2110", "Sueldos y Salarios por Pagar", AccountType.LIABILITY, "21")

        account("3", "PATRIMONIO", AccountType.EQUITY, allowsPosting = false)
        account("3101", "Capital Social", AccountType.EQUITY, "3")
        account("3102", "Utilidades Retenidas", AccountType.EQUITY, "3", systemRole = AccountSystemRole.RETAINED_EARNINGS)

        account("4", "INGRESOS", AccountType.INCOME, allowsPosting = false)
        account("4101", "Ventas de Servicios", AccountType.INCOME, "4")
        account("4102", "Ventas de Mercadería", AccountType.INCOME, "4")

        account("5", "GASTOS", AccountType.EXPENSE, allowsPosting = false)
        account("51", "GASTOS DE OPERACIÓN", AccountType.EXPENSE, "5", allowsPosting = false)
        account("5101", "Sueldos y Salarios", AccountType.EXPENSE, "51")
        account("5102", "Alquiler", AccountType.EXPENSE, "51")
        account("5103", "Servicios Públicos (Agua, Luz, Teléfono)", AccountType.EXPENSE, "51")
        account("5104", "Papelería y Útiles de Oficina", AccountType.EXPENSE, "51")
        account("5105", "Publicidad y Mercadeo", AccountType.EXPENSE, "51")
        account("5106", "Mantenimiento y Reparaciones", AccountType.EXPENSE, "51")
        account("5107", "Combustibles y Lubricantes", AccountType.EXPENSE, "51")
        account("5108", "Depreciación", AccountType.EXPENSE, "51")
        account("5199", "Gastos Diversos", AccountType.EXPENSE, "51")

        return accounts
    }
}
