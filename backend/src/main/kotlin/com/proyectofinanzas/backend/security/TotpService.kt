package com.proyectofinanzas.backend.security

import org.springframework.stereotype.Service
import java.net.URLEncoder
import java.nio.ByteBuffer
import java.security.SecureRandom
import java.time.Instant
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

private const val BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
private const val TIME_STEP_SECONDS = 30L
private const val CODE_DIGITS = 6
private const val DRIFT_STEPS = 1
private const val ISSUER = "Sistema Contable"

/**
 * TOTP (RFC 6238) implementado con javax.crypto puro, sin librerías externas: HMAC-SHA1 sobre
 * un contador de pasos de 30s, con codificación Base32 (RFC 4648) manual del secreto.
 */
@Service
class TotpService {

    fun generateSecret(): String {
        val bytes = ByteArray(20)
        SecureRandom().nextBytes(bytes)
        return base32Encode(bytes)
    }

    fun otpAuthUri(secret: String, email: String): String {
        val label = URLEncoder.encode("$ISSUER:$email", Charsets.UTF_8).replace("+", "%20")
        val issuer = URLEncoder.encode(ISSUER, Charsets.UTF_8).replace("+", "%20")
        return "otpauth://totp/$label?secret=$secret&issuer=$issuer&digits=$CODE_DIGITS&period=$TIME_STEP_SECONDS"
    }

    fun verifyCode(secret: String, code: String, at: Instant = Instant.now()): Boolean {
        val normalized = code.trim()
        if (!normalized.matches(Regex("\\d{$CODE_DIGITS}"))) return false
        val counter = at.epochSecond / TIME_STEP_SECONDS
        val keyBytes = base32Decode(secret)
        for (drift in -DRIFT_STEPS..DRIFT_STEPS) {
            if (hotp(keyBytes, counter + drift) == normalized) return true
        }
        return false
    }

    private fun hotp(keyBytes: ByteArray, counter: Long): String {
        val counterBytes = ByteBuffer.allocate(8).putLong(counter).array()
        val mac = Mac.getInstance("HmacSHA1")
        mac.init(SecretKeySpec(keyBytes, "HmacSHA1"))
        val hash = mac.doFinal(counterBytes)
        val offset = hash[hash.size - 1].toInt() and 0xf
        val binary = ((hash[offset].toInt() and 0x7f) shl 24) or
            ((hash[offset + 1].toInt() and 0xff) shl 16) or
            ((hash[offset + 2].toInt() and 0xff) shl 8) or
            (hash[offset + 3].toInt() and 0xff)
        val otp = binary % 1_000_000
        return otp.toString().padStart(CODE_DIGITS, '0')
    }

    private fun base32Encode(data: ByteArray): String {
        val bits = StringBuilder()
        for (b in data) bits.append((b.toInt() and 0xFF).toString(2).padStart(8, '0'))
        val sb = StringBuilder()
        var i = 0
        while (i < bits.length) {
            val end = minOf(i + 5, bits.length)
            var chunk = bits.substring(i, end)
            if (chunk.length < 5) chunk = chunk.padEnd(5, '0')
            sb.append(BASE32_ALPHABET[chunk.toInt(2)])
            i += 5
        }
        return sb.toString()
    }

    private fun base32Decode(input: String): ByteArray {
        val clean = input.trim().uppercase().replace("=", "").replace(" ", "")
        val bits = StringBuilder()
        for (c in clean) {
            val idx = BASE32_ALPHABET.indexOf(c)
            require(idx >= 0) { "Carácter base32 inválido: $c" }
            bits.append(idx.toString(2).padStart(5, '0'))
        }
        val bytes = ArrayList<Byte>()
        var i = 0
        while (i + 8 <= bits.length) {
            bytes.add(bits.substring(i, i + 8).toInt(2).toByte())
            i += 8
        }
        return bytes.toByteArray()
    }
}
