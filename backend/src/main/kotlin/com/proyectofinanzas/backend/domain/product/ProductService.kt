package com.proyectofinanzas.backend.domain.product

import com.proyectofinanzas.backend.common.NotFoundException
import com.proyectofinanzas.backend.domain.account.AccountRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class ProductService(
    private val productRepository: ProductRepository,
    private val accountRepository: AccountRepository,
) {
    @Transactional(readOnly = true)
    fun list(): List<ProductResponse> = productRepository.findAllByOrderByDescriptionAsc().map { ProductResponse.from(it) }

    @Transactional(readOnly = true)
    fun get(id: UUID): ProductResponse = ProductResponse.from(findEntity(id))

    fun create(request: ProductRequest): ProductResponse {
        val account = accountRepository.findById(request.accountId)
            .orElseThrow { NotFoundException("Cuenta no encontrada") }
        val product = Product(
            description = request.description,
            account = account,
            isActive = request.isActive,
        )
        return ProductResponse.from(productRepository.save(product))
    }

    fun update(id: UUID, request: ProductRequest): ProductResponse {
        val product = findEntity(id)
        val account = accountRepository.findById(request.accountId)
            .orElseThrow { NotFoundException("Cuenta no encontrada") }
        product.description = request.description
        product.account = account
        product.isActive = request.isActive
        return ProductResponse.from(productRepository.save(product))
    }

    fun deactivate(id: UUID) {
        val product = findEntity(id)
        product.isActive = false
        productRepository.save(product)
    }

    private fun findEntity(id: UUID): Product =
        productRepository.findById(id).orElseThrow { NotFoundException("Producto no encontrado") }
}
