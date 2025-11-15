# Script para INSTALAR e configurar Java 17 automaticamente
# Execute como Administrador

Write-Host "=== Instalação Automática de Java 17 ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se já tem Java 17+
$currentJava = java -version 2>&1 | Select-String "version"
if ($currentJava -match '"1[7-9]|"2[0-9]') {
    Write-Host "Java 17+ já está instalado!" -ForegroundColor Green
    Write-Host $currentJava
    exit 0
}

Write-Host "Java 17 não encontrado. Iniciando instalação..." -ForegroundColor Yellow
Write-Host ""

# Tentar usar winget (Windows 10/11 moderno)
$wingetPath = Get-Command winget -ErrorAction SilentlyContinue
if ($wingetPath) {
    Write-Host "Usando winget para instalar Java 17..." -ForegroundColor Green
    Write-Host ""
    
    try {
        # Instalar Eclipse Temurin JDK 17
        Write-Host "Instalando Eclipse Temurin JDK 17..." -ForegroundColor Yellow
        winget install EclipseAdoptium.Temurin.17.JDK --silent --accept-package-agreements --accept-source-agreements
        
        Write-Host ""
        Write-Host "Instalação concluída!" -ForegroundColor Green
        Write-Host ""
        
        # Aguardar um pouco para o sistema registrar
        Start-Sleep -Seconds 3
        
        # Encontrar o Java instalado
        $java17Paths = @(
            "C:\Program Files\Eclipse Adoptium\jdk-17*",
            "C:\Program Files\Java\jdk-17*",
            "C:\Program Files\Microsoft\jdk-17*"
        )
        
        $java17Found = $null
        foreach ($path in $java17Paths) {
            $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) {
                $java17Found = $found.FullName
                break
            }
        }
        
        if ($java17Found) {
            Write-Host "Java 17 encontrado em: $java17Found" -ForegroundColor Green
            
            # Configurar JAVA_HOME
            [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $java17Found, "User")
            $env:JAVA_HOME = $java17Found
            
            # Atualizar PATH
            $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
            $javaBinPath = Join-Path $java17Found "bin"
            
            if ($currentPath -notlike "*$javaBinPath*") {
                $newPath = "$javaBinPath;$currentPath"
                [System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")
                $env:Path = "$javaBinPath;$env:Path"
            }
            
            Write-Host ""
            Write-Host "=== Configuração Concluída ===" -ForegroundColor Green
            Write-Host "JAVA_HOME: $java17Found" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "IMPORTANTE: Feche e reabra o terminal!" -ForegroundColor Yellow
            Write-Host "Depois execute: java -version" -ForegroundColor Yellow
        } else {
            Write-Host "Java foi instalado, mas não foi encontrado automaticamente." -ForegroundColor Yellow
            Write-Host "Por favor, configure manualmente o JAVA_HOME." -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "Erro ao instalar via winget: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Tentando método alternativo..." -ForegroundColor Yellow
    }
} else {
    Write-Host "winget não encontrado. Usando método alternativo..." -ForegroundColor Yellow
}

# Método alternativo: Download direto
if (-not $java17Found) {
    Write-Host ""
    Write-Host "=== Instalação Manual Necessária ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, instale Java 17 manualmente:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Acesse: https://adoptium.net/temurin/releases/?version=17" -ForegroundColor White
    Write-Host "2. Baixe: Windows x64 JDK (.msi)" -ForegroundColor White
    Write-Host "3. Execute o instalador" -ForegroundColor White
    Write-Host "4. Marque 'Set JAVA_HOME variable' durante a instalação" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou use Chocolatey (se instalado):" -ForegroundColor Cyan
    Write-Host "  choco install temurin17jdk -y" -ForegroundColor White
    Write-Host ""
    
    # Tentar abrir o navegador
    try {
        Start-Process "https://adoptium.net/temurin/releases/?version=17"
    } catch {
        Write-Host "Não foi possível abrir o navegador automaticamente." -ForegroundColor Yellow
    }
}

