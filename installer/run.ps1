# Sistema Contable - lanzador para Windows
# Se ejecuta con doble clic en SistemaContable.bat (que llama a este script).
# No requiere tener Java instalado de antemano: si no encuentra una version 21+
# adecuada, descarga un runtime portatil de Eclipse Temurin solo para esta app,
# sin tocar nada mas de tu sistema. Si requiere Docker Desktop para la base de
# datos (PostgreSQL).

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$jarPath = Join-Path $root "app.jar"
$jreDir = Join-Path $root "jre"
$logFile = Join-Path $root "backend.log"

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

function Wait-ForHttp($url, $timeoutSeconds) {
    $elapsed = 0
    while ($elapsed -lt $timeoutSeconds) {
        try {
            $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
            if ($resp.StatusCode -eq 200) { return $true }
        } catch {}
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
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

Write-Step "Verificando Docker Desktop (base de datos)..."
if (-not (Test-DockerAvailable)) {
    Write-Host "Docker no esta instalado o no esta en el PATH." -ForegroundColor Yellow
    Write-Host "Instala Docker Desktop desde https://www.docker.com/products/docker-desktop/ y vuelve a abrir Sistema Contable." -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Step "Levantando la base de datos (PostgreSQL) con Docker..."
docker compose -f (Join-Path $root "docker-compose.yml") up -d postgres

$javaExe = Get-JavaExePath

Write-Step "Iniciando Sistema Contable..."
$env:SPRING_PROFILES_ACTIVE = "dev"
$process = Start-Process -FilePath $javaExe -ArgumentList "-jar", "`"$jarPath`"" -WorkingDirectory $root `
    -RedirectStandardOutput $logFile -RedirectStandardError $logFile -PassThru -WindowStyle Hidden

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
    Write-Host "El sistema no respondio a tiempo. Revisa el log: $logFile" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
}
