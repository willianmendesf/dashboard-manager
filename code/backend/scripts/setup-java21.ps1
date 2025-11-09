# Script para configurar Java 21 no Windows
# Execute como Administrador se necessário

Write-Host "=== Configuração de Java 21 ===" -ForegroundColor Cyan
Write-Host ""

# Verificar Java atual
Write-Host "Java atual:" -ForegroundColor Yellow
java -version
Write-Host ""

# Verificar JAVA_HOME atual
Write-Host "JAVA_HOME atual: $env:JAVA_HOME" -ForegroundColor Yellow
Write-Host ""

# Verificar se Java 21 está instalado
$java21Paths = @(
    "C:\Program Files\Java\jdk-21",
    "C:\Program Files\Eclipse Adoptium\jdk-21*",
    "C:\Program Files\Microsoft\jdk-21*",
    "C:\Program Files\Zulu\zulu-21*"
)

$java21Found = $null
foreach ($path in $java21Paths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $java21Found = $found.FullName
        break
    }
}

if (-not $java21Found) {
    Write-Host "Java 21 não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, instale Java 21 de uma das seguintes fontes:" -ForegroundColor Yellow
    Write-Host "  - Eclipse Adoptium: https://adoptium.net/temurin/releases/?version=21" -ForegroundColor Cyan
    Write-Host "  - Oracle JDK: https://www.oracle.com/java/technologies/downloads/#java21" -ForegroundColor Cyan
    Write-Host "  - Microsoft Build: https://learn.microsoft.com/en-us/java/openjdk/download" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Após instalar, execute este script novamente." -ForegroundColor Yellow
    exit 1
}

Write-Host "Java 21 encontrado em: $java21Found" -ForegroundColor Green
Write-Host ""

# Configurar JAVA_HOME
Write-Host "Configurando JAVA_HOME..." -ForegroundColor Yellow
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", $java21Found, "User")
$env:JAVA_HOME = $java21Found
Write-Host "JAVA_HOME configurado para: $java21Found" -ForegroundColor Green
Write-Host ""

# Atualizar PATH
Write-Host "Atualizando PATH..." -ForegroundColor Yellow
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
$javaBinPath = Join-Path $java21Found "bin"

if ($currentPath -notlike "*$javaBinPath*") {
    $newPath = "$javaBinPath;$currentPath"
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    $env:Path = "$javaBinPath;$env:Path"
    Write-Host "PATH atualizado." -ForegroundColor Green
} else {
    Write-Host "PATH já contém Java 21." -ForegroundColor Green
}
Write-Host ""

# Verificar configuração
Write-Host "=== Verificação ===" -ForegroundColor Cyan
Write-Host "Java version:"
& "$javaBinPath\java.exe" -version
Write-Host ""
Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE: Feche e reabra o terminal para que as mudanças tenham efeito!" -ForegroundColor Yellow
Write-Host "Depois, execute: mvn -version" -ForegroundColor Yellow

