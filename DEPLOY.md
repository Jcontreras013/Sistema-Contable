# Desplegar en la nube (gratis, para pruebas)

Esta guía combina dos servicios gratis: **Render** para correr el backend (que
también sirve la web) y **Supabase** para la base de datos PostgreSQL. Se usan
dos proveedores porque Render solo permite una base de datos gratis por cuenta
— si ya tienes otro proyecto usando la tuya, Supabase te da una base de datos
gratis aparte, sin ese límite.

**Importante sobre el plan gratis (léelo antes de empezar):**

- El servicio web de Render "se duerme" después de ~15 minutos sin uso. La
  primera visita después de dormido tarda 30–60 segundos en responder mientras
  despierta; luego va normal. Esto es solo para pruebas — si lo vas a usar a
  diario sin esa espera, hay que pasar el servicio web a un plan pago (~$7/mes)
  desde el mismo panel, sin volver a configurar nada.
- El proyecto gratis de Supabase **se pausa automáticamente tras 7 días sin
  actividad** (no se borra, solo se pausa). Si eso pasa, entra al panel de
  Supabase y dale clic a **Restore project** — tarda un par de minutos en
  reactivarse y luego el sistema vuelve a conectar normal.

## Paso 1: crear la base de datos en Supabase

1. Entra a https://supabase.com y crea una cuenta (puedes usar GitHub).
2. **New project** → elige un nombre (por ejemplo `sistema-contable`), una
   contraseña para la base de datos (guárdala, la vas a necesitar en el paso 2)
   y una región cercana (por ejemplo `East US` o `South America`). Plan **Free**.
3. Espera 1–2 minutos a que aprovisione el proyecto.
4. Ve a **Project Settings** (ícono de engranaje) → **Database**.
5. En **Connection pooling**, activa/mira el modo **Session** (no
   "Transaction") y copia estos 4 datos que muestra ahí:
   - **Host** (algo como `aws-0-us-east-1.pooler.supabase.com`)
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres.xxxxxxxxxxxx` (incluye el sufijo con el id de tu proyecto)

   Usa el **Session pooler**, no la conexión directa: la conexión directa de
   Supabase solo acepta IPv6 y Render no la puede alcanzar; el pooler sí
   funciona desde Render.

## Paso 2: desplegar el backend en Render

1. Entra a https://dashboard.render.com y crea una cuenta (puedes usar GitHub).
2. Clic en **New +** → **Blueprint**.
3. Conecta tu cuenta de GitHub si te lo pide, y elige el repositorio
   `Jcontreras013/Sistema-Contable`.
4. Render encuentra el archivo `render.yaml` de este repo y te pide los valores
   de las variables marcadas como manuales. Complétalas con los datos de
   Supabase del paso 1 (y la contraseña que pusiste al crear el proyecto):
   - `DB_HOST` → el Host del pooler de Supabase
   - `DB_PORT` → `5432`
   - `DB_NAME` → `postgres`
   - `DB_USER` → tu `postgres.xxxxxxxxxxxx`
   - `DB_PASSWORD` → la contraseña de la base de datos que definiste en Supabase
5. Clic en **Apply**. Si el formulario inicial no te pidió estas variables,
   entra al servicio ya creado → pestaña **Environment** → agrégalas ahí y
   guarda (esto redepliega solo).
6. Espera a que termine el primer build (tarda unos 8–12 minutos porque compila
   el backend en Kotlin y la web en React dentro de la imagen). Puedes ver el
   progreso en la pestaña **Logs** del servicio.
7. Cuando el estado pase a **Live**, abre la URL que te da Render (algo como
   `https://sistema-contable-xxxx.onrender.com`). Ahí está tu sistema, ya
   funcionando, con los mismos usuarios de prueba del manual:

   | Correo | Contraseña | Rol |
   |---|---|---|
   | admin@demo.com | Demo1234! | Administrador |
   | contador@demo.com | Demo1234! | Contador |
   | auditor@demo.com | Demo1234! | Auditor |

## Actualizar el sistema ya desplegado

Cada vez que se hace `git push` a la rama `main` de este repo, Render reconstruye
y publica la nueva versión automáticamente (lo puedes desactivar en el panel del
servicio, en **Settings → Auto-Deploy**, si prefieres actualizar manualmente).

## Cuando decidas usarlo en serio (no solo pruebas)

1. En el panel del servicio web de Render, **Settings → Instance Type**, cambia
   el plan gratis por el de pago (evita que se duerma).
2. En el panel de Supabase, pasa el proyecto a un plan pago (evita la pausa por
   inactividad y sube el límite de 500 MB de almacenamiento del plan gratis).
3. Cambia las contraseñas de los usuarios de prueba (o crea usuarios nuevos desde
   **Usuarios** con tu rol de Administrador y desactiva/edita los de demo).
4. (Opcional) En Render, **Settings → Custom Domain** puedes conectar un dominio
   propio en vez de la URL `onrender.com`.
