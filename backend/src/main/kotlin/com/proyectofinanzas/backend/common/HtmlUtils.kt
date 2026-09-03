package com.proyectofinanzas.backend.common

/** Escapa texto proveniente del usuario antes de interpolarlo en HTML generado en el servidor. */
object HtmlUtils {
    fun escape(text: String?): String {
        if (text == null) return ""
        val sb = StringBuilder(text.length)
        for (c in text) {
            when (c) {
                '&' -> sb.append("&amp;")
                '<' -> sb.append("&lt;")
                '>' -> sb.append("&gt;")
                '"' -> sb.append("&quot;")
                '\'' -> sb.append("&#39;")
                else -> sb.append(c)
            }
        }
        return sb.toString()
    }
}
