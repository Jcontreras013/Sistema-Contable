# Sistema Contable

Sistema de contabilidad de partida doble para Honduras (Lempiras y Dólares), con backend en Kotlin/Spring Boot, web en React y una app Android complementaria.

## Arquitectura

Monorepo con tres subproyectos independientes:

- **`/backend`** — API REST en Kotlin + Spring Boot 3 + PostgreSQL 16, con Flyway para migraciones, autenticación JWT y roles (ADMIN, ACCOUNTANT, AUDITOR).
- **`/web`** — Aplicación web en React 19 + TypeScript + Vite + Tailwind CSS v4, consume la API del backend.
- **`/android`** — App nativa en Kotlin + Jetpack Compose, consume la misma API. Ver la nota de estado más abajo.

## Alcance funcional

- Contabilidad general de partida doble: plan de cuentas jerárquico, asientos manuales balanceados, reversión de asientos (los asientos contabilizados son inmutables).
- Facturación e ingresos/gastos, en Lempiras (HNL) o Dólares (USD) con tasa de cambio (mantenida manualmente, sin integración a una API externa).
- Cobros y pagos que liquidan cuentas por cobrar y por pagar reales (no solo lo facturado).
- Facturación con correlativo fiscal SAR (formato Establecimiento-PuntoEmisión-TipoDocumento-
  Correlativo) generado a partir de una autorización **CAI** registrada en Configuración fiscal;
  PDF de factura con los datos del emisor y envío por correo con el PDF adjunto.
- Exportación a Excel (.xlsx) de facturas y de los reportes financieros.
- Catálogo de productos/servicios de compra: cada producto se enlaza a una cuenta contable, así
  que al registrar un gasto basta con elegir el producto y la cuenta correcta se selecciona (y
  contabiliza) sola, sin tener que conocer el plan de cuentas de memoria.
- Ficha de proveedor ampliada: régimen fiscal, si es agente retenedor de ISR/ISV y su porcentaje
  de retención, varios correos de contacto, y un detalle por proveedor con el historial de
  gastos que se le han registrado.
- Buscador de texto en Facturas, Gastos, Libro mayor, Proveedores y Productos.
- Reportes: balance de comprobación, balance general, estado de resultados, mayor por cuenta.
- Dashboard con KPIs y gráficos (ingresos/gastos por mes, gastos por categoría).
- Multiusuario con roles y bitácora de auditoría.

### Decisiones y límites conocidos

- El plan de cuentas y la tasa de ISV (15%) sembrados son **ilustrativos** para Honduras, no asesoría fiscal formal.
- El CAI sembrado por los datos demo es **ilustrativo y no válido ante el SAR**: el código real
  hay que solicitarlo al SAR como autoimpresor (trámite legal, no técnico) y registrarlo en
  **Configuración fiscal** antes de facturar de verdad — ver `installer/README.md`/`DEPLOY.md`.
- El envío de facturas por correo requiere configurar un SMTP real (`SMTP_HOST`, `SMTP_PORT`,
  `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`); sin esas variables el envío falla con un mensaje
  claro, pero el resto del sistema (incluido `/actuator/health`) sigue funcionando normalmente.
- El balance general incluye una línea sintética de "Utilidad del ejercicio (no cerrada)", calculada en vivo; no existe un asiento formal de cierre de periodo.
- Un usuario tiene un único rol (no hay matriz de permisos granular).
- No hay inventario, presupuestos ni conciliación bancaria en esta fase.

## Requisitos

- JDK 21
- Node.js 20+
- Docker y Docker Compose (para levantar Postgres fácilmente; también se puede usar un Postgres local)
- Android Studio (Ladybug o más reciente) si vas a compilar la app Android

## Arranque rápido

### En la nube, gratis (para empezar a usarlo ya, sin instalar nada)

Ver [`DEPLOY.md`](./DEPLOY.md) — despliega el backend en Render (con el archivo
`render.yaml` de este repo) y la base de datos en Supabase, ambos en plan
gratis, para pruebas.

### Windows: instalador de un solo clic (recomendado para usar la app, no para desarrollar)

La carpeta `/installer` empaqueta el backend con la web ya compilada adentro, así que
no necesitas instalar Node.js, y si no tienes Java 21 el propio instalador lo descarga
automáticamente la primera vez, sin afectar el resto de tu sistema. Para la base de
datos usa, en este orden, lo primero que encuentre: algo que ya esté corriendo en el
puerto 5432, Docker Desktop, o **PostgreSQL instalado nativamente en Windows** (esta
última opción no requiere virtualización ni tocar el BIOS — instalador oficial en
https://www.postgresql.org/download/windows/). Ver `installer/README.md` para más
detalle y cómo generar el paquete (`app.jar`) y distribuirlo. Una vez armado el
paquete:

1. Descomprime la carpeta donde quieras.
2. Doble clic en `SistemaContable.bat` (con Docker Desktop corriendo, o con PostgreSQL
   nativo instalado — lo que tengas disponible).
3. (Opcional) Clic derecho → **Enviar a → Escritorio (crear acceso directo)** para tenerlo a mano.

Esto levanta Postgres, arranca el backend (que también sirve la web) y abre
`http://localhost:8080` en tu navegador. Para apagarlo, cierra la ventana de PowerShell.

### Windows: modo desarrollo (con Node.js, para tocar el código)

`start-windows.bat` (en la raíz del repo) levanta Postgres, el backend y el servidor de
desarrollo de la web por separado (con recarga en caliente). Requiere Docker Desktop,
JDK 21 y Node.js 20+ instalados. Para detener el sistema, cierra las dos ventanas de
consola (Backend y Web) que abre el script.

### 1. Base de datos + backend con Docker Compose

```bash
cp .env.example .env   # ajusta valores si es necesario
docker compose up -d postgres
cd backend
./gradlew bootRun --args='--spring.profiles.active=dev'
```

El backend levanta en `http://localhost:8080`, aplica las migraciones de Flyway automáticamente y, si la base de datos está vacía, siembra usuarios y datos de ejemplo.

Alternativa: `docker compose up -d` levanta Postgres **y** el backend en contenedores (usa el perfil `docker`, ver `backend/Dockerfile`).

Swagger/OpenAPI queda disponible en `http://localhost:8080/docs`.

### 2. Web

```bash
cd web
npm install
npm run dev
```

Abre `http://localhost:5173`. El servidor de desarrollo de Vite hace proxy de `/api` hacia `http://localhost:8080` (ver `web/vite.config.ts`), así que no necesitas configurar nada más para desarrollo local.

### 3. Android

Abre la carpeta `/android` en Android Studio y deja que sincronice Gradle. El `BASE_URL` de desarrollo (`android/app/build.gradle.kts`) apunta a `http://10.0.2.2:8080/api/v1/`, el alias que usa el emulador de Android para llegar a `localhost` de tu máquina. Si usas un dispositivo físico, cambia esa URL por la IP de tu máquina en la misma red.

> **Nota de estado:** el entorno donde se generó este proyecto no tenía Android SDK instalado ni acceso de red a `dl.google.com` (el repositorio de Google), así que a diferencia del backend y la web —que sí se ejecutaron y probaron de extremo a extremo—, el módulo Android **no pudo compilarse ni ejecutarse** en ese entorno. El código se escribió con cuidado y se revisó manualmente, pero necesita compilarse y probarse en Android Studio antes de considerarse verificado. Si Gradle falla al sincronizar, revisa primero la versión del Android Gradle Plugin (`android/build.gradle.kts`) contra tu versión de Android Studio.

### Credenciales de demostración

| Correo | Contraseña | Rol |
|---|---|---|
| admin@demo.com | Demo1234! | Administrador |
| contador@demo.com | Demo1234! | Contador |
| auditor@demo.com | Demo1234! | Auditor |

## Estructura del repo

```
/backend    API Kotlin + Spring Boot (dominio contable, auth, reportes)
/web        SPA React + TypeScript
/android    App Kotlin + Jetpack Compose
docker-compose.yml   Postgres + backend para desarrollo/despliegue local
```

## Pruebas

```bash
cd backend && ./gradlew test    # reglas de balance contable (unitarias)
cd web && npx tsc -b --noEmit && npm run build   # type-check + build de producción
```

Las pruebas de integración con Testcontainers requieren Docker disponible en el entorno donde se ejecuten.
