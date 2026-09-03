package com.proyectofinanzas.backend.domain.fiscal

import com.proyectofinanzas.backend.common.BusinessRuleException
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.ByteArrayResource
import org.springframework.mail.MailException
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service

@Service
class InvoiceMailService(
    private val mailSender: JavaMailSender,
    @Value("\${app.mail.from}") private val fromAddress: String,
) {
    fun sendInvoice(toEmail: String, subject: String, body: String, pdfBytes: ByteArray, pdfFilename: String) {
        try {
            val message = mailSender.createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")
            helper.setFrom(fromAddress)
            helper.setTo(toEmail)
            helper.setSubject(subject)
            helper.setText(body)
            helper.addAttachment(pdfFilename, ByteArrayResource(pdfBytes))
            mailSender.send(message)
        } catch (e: MailException) {
            throw BusinessRuleException(
                "No se pudo enviar el correo: revisa la configuración SMTP (SMTP_HOST/SMTP_PORT/" +
                    "SMTP_USER/SMTP_PASSWORD). Detalle: ${e.message}"
            )
        }
    }
}
