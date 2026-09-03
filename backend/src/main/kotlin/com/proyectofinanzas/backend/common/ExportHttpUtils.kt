package com.proyectofinanzas.backend.common

import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity

private val XLSX_MEDIA_TYPE =
    MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

/** Respuesta HTTP de descarga para un archivo .xlsx generado en memoria. */
fun xlsxResponse(bytes: ByteArray, filename: String): ResponseEntity<ByteArray> =
    ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
        .contentType(XLSX_MEDIA_TYPE)
        .body(bytes)
