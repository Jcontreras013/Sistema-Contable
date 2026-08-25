package com.proyectofinanzas.backend.config

import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import org.springframework.core.io.Resource
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import org.springframework.web.servlet.resource.PathResourceResolver

/**
 * Sirve la web (React) ya compilada desde src/main/resources/static, con fallback a
 * index.html para las rutas del lado del cliente (React Router) que no son un archivo
 * real ni parte de la API. Así el .jar del backend es el único proceso que hay que
 * correr para tener la app completa.
 */
@Configuration
class SpaWebConfig : WebMvcConfigurer {
    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        registry.addResourceHandler("/**")
            .addResourceLocations("classpath:/static/")
            .resourceChain(true)
            .addResolver(object : PathResourceResolver() {
                override fun getResource(resourcePath: String, location: Resource): Resource? {
                    if (resourcePath.startsWith("api/")) return null
                    val requested = location.createRelative(resourcePath)
                    return if (requested.exists() && requested.isReadable) {
                        requested
                    } else {
                        ClassPathResource("/static/index.html")
                    }
                }
            })
    }
}
