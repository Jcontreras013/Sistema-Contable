# Instalador para Windows

Esta carpeta arma un paquete que corre Sistema Contable con doble clic, sin instalar
Node.js ni Java de antemano (solo necesitas **Docker Desktop**, para la base de datos).

## Cómo funciona

- `app.jar` es el backend ya compilado, con la web (React) empaquetada adentro — es el
  único proceso que hay que correr; sirve la API y la interfaz desde el mismo puerto
  (8080).
- `run.ps1` levanta Postgres con Docker, verifica si hay Java 21+ disponible y, si no,
  descarga automáticamente un runtime portátil de Eclipse Temurin solo para esta app
  (no toca el resto de tu sistema), arranca el backend y abre el navegador.
- `SistemaContable.bat` es el punto de entrada de doble clic (llama a `run.ps1`).
- `docker-compose.yml` define solo el contenedor de Postgres que usa `run.ps1`.

`app.jar` **no se versiona en git** (es un binario generado); hay que construirlo antes
de armar el paquete de distribución.

## Cómo generar `app.jar`

Desde la raíz del repo, con Node.js y JDK 21 instalados (esto es para *construir* el
paquete, no para *correrlo* después):

```bash
cd backend
./gradlew bootJar   # compila la web y la empaqueta dentro del jar automáticamente
cp build/libs/backend-*.jar ../installer/app.jar
```

## Cómo distribuir

Comprime esta carpeta (`installer/`, ya con `app.jar` adentro) en un `.zip` y compártelo.
Quien lo reciba solo tiene que:

1. Descomprimir el `.zip` en cualquier carpeta.
2. Tener Docker Desktop instalado y corriendo.
3. Doble clic en `SistemaContable.bat` (o crear un acceso directo a él en el Escritorio).

La primera vez puede tardar un poco más si tiene que descargar el runtime de Java o
bajar la imagen de Postgres.
