package com.proyectofinanzas.backend.domain.periodclose

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface PeriodCloseRepository : JpaRepository<PeriodClose, UUID> {
    fun findAllByOrderByPeriodEndDateDesc(): List<PeriodClose>
    fun findTopByOrderByPeriodEndDateDesc(): PeriodClose?
}
