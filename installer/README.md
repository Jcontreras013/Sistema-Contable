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

`app.jar` sí se versiona en este repo (es la única forma de distribuirlo sin un
servicio externo de hosting): `run.ps1` lo descarga solo desde
`raw.githubusercontent.com` la primera vez si no lo encuentra junto al script, así que
el paquete que le compartes a alguien puede ser solo `run.ps1` + `SistemaContable.bat`
+ `docker-compose.yml` (unos pocos KB).

## Cómo actualizar `app.jar` después de un cambio

Desde la raíz del repo, con Node.js y JDK 21 instalados (esto es para *construir* el
paquete, no para *correrlo* después):

```bash
cd backend
./gradlew bootJar   # compila la web y la empaqueta dentro del jar automáticamente
cp build/libs/backend-*.jar ../installer/app.jar
git add ../installer/app.jar && git commit -m "Actualiza app.jar" && git push
```

> El repo ya advierte que este archivo pesa más de lo recomendado para Git normal. Si
> se actualiza seguido, conviene migrar esto a Git LFS o a un GitHub Release en vez de
> seguir commiteando el binario directo.

## Cómo distribuir

Comparte `run.ps1`, `SistemaContable.bat` y `docker-compose.yml` (por ejemplo, en un
`.zip` chiquito). Quien lo reciba solo tiene que:

1. Descomprimir en cualquier carpeta.
2. Tener Docker Desktop instalado y corriendo.
3. Doble clic en `SistemaContable.bat` (o crear un acceso directo a él en el Escritorio).

La primera vez tarda más porque descarga `app.jar` (~63 MB) y, si hace falta, el
runtime de Java y la imagen de Postgres. Las siguientes veces arranca directo.
