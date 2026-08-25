# Sistema Contable - lanzador para Windows
# Se ejecuta con doble clic en SistemaContable.bat (que llama a este script).
# No requiere tener Java instalado de antemano: si no encuentra una version 21+
# adecuada, descarga un runtime portatil de Eclipse Temurin solo para esta app,
# sin tocar nada mas de tu sistema.
#
# Para la base de datos (PostgreSQL) admite dos caminos, en este orden:
#   1. Docker Desktop, si esta disponible.
#   2. PostgreSQL instalado nativamente en Windows (sin virtualizacion / sin BIOS),
#      descargable desde https://www.postgresql.org/download/windows/
# Si ya hay algo escuchando en el puerto 5432, se usa tal cual sin tocar nada.

$ErrorActionPreference = "Stop"
# En PowerShell 7.3+, por defecto cualquier texto que un programa externo escriba en
# stderr (docker o psql, por ejemplo, imprimen ahi avisos normales) se trata como
# error terminante si $ErrorActionPreference es "Stop". Se desactiva ese
# comportamiento para que esos programas no aborten el script solo por avisos.
if (Test-Path variable:global:PSNativeCommandUseErrorActionPreference) {
    $global:PSNativeCommandUseErrorActionPreference = $false
}
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$jarPath = Join-Path $root "app.jar"
$jreDir = Join-Path $root "jre"
$stdoutLog = Join-Path $root "backend.out.log"
$stderrLog = Join-Path $root "backend.err.log"

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Test-SystemJavaOk {
    $cmd = Get-Command java -ErrorAction SilentlyContinue
    if (-not $cmd) { return $false }
    try {
        $output = & java -version 2>&1 | Out-String
        if ($output -match 'version "(\d+)') {
            $major = [int]$Matches[1]
            return $major -ge 21
        }
    } catch {}
    return $false
}

function Get-JavaExePath {
    $bundled = Join-Path $jreDir "bin\java.exe"
    if (Test-Path $bundled) {
        return $bundled
    }
    if (Test-SystemJavaOk) {
        return "java"
    }

    Write-Step "No se encontro Java 21+. Descargando un runtime portatil (Eclipse Temurin) solo para esta app..."
    $zipPath = Join-Path $root "jre-temp.zip"
    $url = "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse"
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing

    $extractDir = Join-Path $root "jre-extract"
    if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }
    Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force

    $extracted = Get-ChildItem $extractDir | Select-Object -First 1
    Move-Item $extracted.FullName $jreDir
    Remove-Item $extractDir -Recurse -Force
    Remove-Item $zipPath -Force

    Write-Host "Runtime de Java listo en $jreDir" -ForegroundColor Green
    return (Join-Path $jreDir "bin\java.exe")
}

function Test-DockerAvailable {
    return [bool](Get-Command docker -ErrorAction SilentlyContinue)
}

function Test-PortOpen($portNumber) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $client.Connect("localhost", $portNumber)
        $client.Close()
        return $true
    } catch {
        return $false
    }
}

function Wait-ForHttp($url, $timeoutSeconds) {
    $elapsed = 0
    while ($elapsed -lt $timeoutSeconds) {
        try {
            $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
            if ($resp.StatusCode -eq 200) { return $true }
        } catch {}
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "." -NoNewline
    }
    Write-Host ""
    return $false
}

function Wait-ForPort($portNumber, $timeoutSeconds) {
    $elapsed = 0
    while ($elapsed -lt $timeoutSeconds) {
        if (Test-PortOpen $portNumber) { return $true }
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "." -NoNewline
    }
    Write-Host ""
    return $false
}

function Get-PsqlPath {
    $cmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $found = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1
    if ($found) { return $found.FullName }
    return $null
}

function Test-AppDatabaseReady {
    param($psqlPath)
    $env:PGPASSWORD = "contafin_dev"
    & $psqlPath -h localhost -U contafin -d contafin -c "SELECT 1" *> $null
    $ok = ($LASTEXITCODE -eq 0)
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    return $ok
}

function Initialize-AppDatabase {
    param($psqlPath)

    if (Test-AppDatabaseReady $psqlPath) { return $true }

    Write-Step "Configurando la base de datos de Sistema Contable (solo la primera vez)..."
    Write-Host "Necesito la contrasena que le pusiste al usuario 'postgres' al instalar PostgreSQL."
    $securePassword = Read-Host "Contrasena de 'postgres'" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

    $env:PGPASSWORD = $plainPassword
    & $psqlPath -h localhost -U postgres -c "CREATE ROLE contafin WITH LOGIN PASSWORD 'contafin_dev' CREATEDB;" *> $null
    & $psqlPath -h localhost -U postgres -c "CREATE DATABASE contafin OWNER contafin;" *> $null
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

    if (Test-AppDatabaseReady $psqlPath) {
        Write-Host "Base de datos lista." -ForegroundColor Green
        return $true
    }

    Write-Host "No se pudo preparar la base de datos. Verifica que la contrasena de 'postgres' sea correcta." -ForegroundColor Red
    return $false
}

function Ensure-Database {
    if (Test-PortOpen 5432) {
        Write-Step "Ya hay algo escuchando en el puerto 5432, se usa tal cual."
        return $true
    }

    if (Test-DockerAvailable) {
        Write-Step "Levantando la base de datos (PostgreSQL) con Docker..."
        docker compose -f (Join-Path $root "docker-compose.yml") up -d postgres
        Write-Step "Esperando a que Postgres este listo (puede tardar mas la primera vez, mientras Docker baja la imagen)..."
        return Wait-ForPort 5432 180
    }

    $psqlPath = Get-PsqlPath
    if ($psqlPath) {
        Write-Step "Se detecto PostgreSQL instalado en este equipo. Intentando iniciar el servicio..."
        Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Start-Service -ErrorAction SilentlyContinue
        if (-not (Wait-ForPort 5432 30)) {
            Write-Host "PostgreSQL esta instalado pero no arranco. Abre 'Servicios' de Windows y arranca manualmente el servicio postgresql-x64-*." -ForegroundColor Red
            return $false
        }
        return Initialize-AppDatabase $psqlPath
    }

    Write-Host "No se encontro Docker Desktop ni PostgreSQL instalado en este equipo." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Instala PostgreSQL para Windows (no necesita virtualizacion ni tocar el BIOS):" -ForegroundColor Yellow
    Write-Host "  https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "Durante la instalacion, anota bien la contrasena que le pongas al usuario 'postgres'" -ForegroundColor Yellow
    Write-Host "(el instalador la pide una sola vez). Deja el puerto en el valor por defecto (5432)." -ForegroundColor Yellow
    Write-Host "Cuando termine la instalacion, vuelve a abrir Sistema Contable." -ForegroundColor Yellow
    return $false
}

if (-not (Test-Path $jarPath)) {
    Write-Step "Descargando Sistema Contable (primera vez, puede tardar unos minutos)..."
    $jarUrl = "https://raw.githubusercontent.com/Jcontreras013/Sistema-Contable/main/installer/app.jar"
    try {
        Invoke-WebRequest -Uri $jarUrl -OutFile $jarPath -UseBasicParsing
    } catch {
        Write-Host "No se pudo descargar app.jar: $_" -ForegroundColor Red
        Read-Host "Presiona Enter para salir"
        exit 1
    }
}

Write-Step "Preparando la base de datos..."
if (-not (Ensure-Database)) {
    Read-Host "Presiona Enter para salir"
    exit 1
}

$javaExe = Get-JavaExePath

Write-Step "Iniciando Sistema Contable..."
$env:SPRING_PROFILES_ACTIVE = "dev"
$process = Start-Process -FilePath $javaExe -ArgumentList "-jar", "`"$jarPath`"" -WorkingDirectory $root `
    -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog -PassThru -WindowStyle Hidden

Write-Step "Esperando a que arranque (puede tardar unos segundos la primera vez)..."
$ok = Wait-ForHttp "http://localhost:8080/actuator/health" 90

if ($ok) {
    Write-Host "Listo. Abriendo el navegador..." -ForegroundColor Green
    Start-Process "http://localhost:8080"
    Write-Host ""
    Write-Host "Sistema Contable esta corriendo (PID $($process.Id)). No cierres esta ventana mientras lo uses."
    Write-Host "Para apagarlo, cierra esta ventana o presiona Ctrl+C."
    Wait-Process -Id $process.Id
} else {
    Write-Host "El sistema no respondio a tiempo. Esto es lo ultimo que escribio ($stderrLog):" -ForegroundColor Red
    if (Test-Path $stderrLog) { Get-Content $stderrLog -Tail 40 }
    Write-Host ""
    Write-Host "Y esto es lo ultimo de la salida normal ($stdoutLog):" -ForegroundColor Red
    if (Test-Path $stdoutLog) { Get-Content $stdoutLog -Tail 20 }
    if ($process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    Read-Host "Presiona Enter para salir"
}
