# Script para configurar Java 17+ para o projeto
# Execute como Administrador: .\setup-java.ps1

Write-Host "=== Configuração do Java para o Projeto ===" -ForegroundColor Cyan
Write-Host ""

# Verificar versão atual do Java
Write-Host "Versão atual do Java:" -ForegroundColor Yellow
java -version 2>&1 | Select-Object -First 1

Write-Host ""
Write-Host "JAVA_HOME atual: $env:JAVA_HOME" -ForegroundColor Yellow
Write-Host ""

# Verificar se Java 17+ está instalado
$java17Plus = $false
$javaPaths = @(
    "C:\Program Files\Java",
    "C:\Program Files\Zulu",
    "C:\Program Files (x86)\Java",
    "C:\Program Files (x86)\Zulu"
)

Write-Host "Procurando instalações do Java..." -ForegroundColor Cyan
foreach ($path in $javaPaths) {
    if (Test-Path $path) {
        $jdkDirs = Get-ChildItem $path -Directory -ErrorAction SilentlyContinue | Where-Object { 
            $_.Name -match "jdk-1[7-9]|jdk-2[0-9]|zulu-1[7-9]|zulu-2[0-9]" 
        }
        
        if ($jdkDirs) {
            Write-Host "Encontrado: $($jdkDirs.FullName)" -ForegroundColor Green
            $java17Plus = $true
            
            # Sugerir usar esta instalação
            $latestJdk = $jdkDirs | Sort-Object Name -Descending | Select-Object -First 1
            Write-Host ""
            Write-Host "Para usar esta instalação, execute:" -ForegroundColor Yellow
            Write-Host "  `$env:JAVA_HOME = `"$($latestJdk.FullName)`"" -ForegroundColor White
            Write-Host "  `$env:PATH = `"$($latestJdk.FullName)\bin;$env:PATH`"" -ForegroundColor White
            Write-Host ""
        }
    }
}

if (-not $java17Plus) {
    Write-Host "Java 17+ não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opções para instalar Java 17+:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Baixar manualmente:" -ForegroundColor Cyan
    Write-Host "   - Zulu OpenJDK: https://www.azul.com/downloads/?package=jdk" -ForegroundColor White
    Write-Host "   - Eclipse Temurin: https://adoptium.net/" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Usar Chocolatey (se instalado):" -ForegroundColor Cyan
    Write-Host "   choco install openjdk21" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Usar winget (Windows 10/11):" -ForegroundColor Cyan
    Write-Host "   winget install Microsoft.OpenJDK.21" -ForegroundColor White
    Write-Host ""
}

Write-Host "Após instalar Java 17+, configure o JAVA_HOME:" -ForegroundColor Yellow
Write-Host "  `$env:JAVA_HOME = `"C:\Program Files\Java\jdk-21`"" -ForegroundColor White
Write-Host ""
Write-Host "E verifique:" -ForegroundColor Yellow
Write-Host "  java -version" -ForegroundColor White
Write-Host "  mvn -version" -ForegroundColor White
Write-Host ""

