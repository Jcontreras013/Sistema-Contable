# Desplegar en la nube (gratis, para pruebas)

Esta guía usa [Render](https://render.com) porque tiene una capa gratuita para el
backend y para PostgreSQL, y detecta sola la configuración de este repo
(`render.yaml`) — no hay que tocar nada a mano en su panel.

**Importante sobre el plan gratis (léelo antes de empezar):**

- El servicio web "se duerme" después de ~15 minutos sin uso. La primera visita
  después de dormido tarda 30–60 segundos en responder mientras despierta; luego
  va normal. Esto es solo para pruebas — si lo vas a usar a diario sin esa espera,
  hay que pasar el servicio web a un plan pago (~$7/mes) desde el mismo panel,
  sin volver a configurar nada.
- La base de datos gratis de Render **se elimina automáticamente a los 30 días**
  de creada. Sirve perfecto para probar el sistema ahora; si decides quedarte con
  él, antes de que se cumplan los 30 días hay que pasar la base de datos a un
  plan pago (~$7/mes) para no perder la información cargada.

## Pasos

1. Entra a https://dashboard.render.com y crea una cuenta (puedes usar tu cuenta
   de GitHub para entrar más rápido).
2. Clic en **New +** → **Blueprint**.
3. Conecta tu cuenta de GitHub si te lo pide, y elige el repositorio
   `Jcontreras013/sistema-contable`.
4. Render encuentra el archivo `render.yaml` de este repo y muestra lo que va a
   crear: un servicio web (`sistema-contable`) y una base de datos
   (`contafin-db`), ambos en plan gratis. Clic en **Apply**.
5. Espera a que termine el primer build (tarda unos 8–12 minutos porque compila
   el backend en Kotlin y la web en React dentro de la imagen). Puedes ver el
   progreso en la pestaña **Logs** del servicio.
6. Cuando el estado pase a **Live**, abre la URL que te da Render (algo como
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

1. En el panel del servicio web, **Settings → Instance Type**, cambia el plan
   gratis por el de pago (evita que se duerma).
2. En el panel de la base de datos, **Settings → Instance Type**, cambia el plan
   gratis por el de pago (evita que se borre a los 30 días).
3. Cambia las contraseñas de los usuarios de prueba (o crea usuarios nuevos desde
   **Usuarios** con tu rol de Administrador y desactiva/edita los de demo).
4. (Opcional) En **Settings → Custom Domain** puedes conectar un dominio propio
   en vez de la URL `onrender.com`.
