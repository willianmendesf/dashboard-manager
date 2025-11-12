# Script PowerShell para Windows
# Executa o setup-storage.sh antes de iniciar os containers
# Detecta automaticamente Windows e configura os caminhos corretos

$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND_DIR = Join-Path $SCRIPT_DIR "backend"
$COMPOSE_FILE = Join-Path $SCRIPT_DIR "docker-compose.yml"
$OVERRIDE_FILE = Join-Path $SCRIPT_DIR "docker-compose.override.yml"

Write-Host "=== Dashboard Manager - Inicialização ===" -ForegroundColor Cyan
Write-Host "OS detectado: Windows" -ForegroundColor Yellow
Write-Host ""

# Verificar se o script setup-storage.sh existe
$setupScript = Join-Path $BACKEND_DIR "setup-storage.sh"
if (Test-Path $setupScript) {
    Write-Host "Executando setup-storage.sh..." -ForegroundColor Yellow
    Push-Location $BACKEND_DIR
    try {
        # Executar o script bash no Git Bash ou WSL
        if (Get-Command bash -ErrorAction SilentlyContinue) {
            bash setup-storage.sh
        } else {
            Write-Host "AVISO: bash não encontrado. Criando diretórios manualmente..." -ForegroundColor Yellow
            # Criar diretórios manualmente no Windows
            $imagesDir = "C:\Temp\dashboard-manager\images"
            $filesDir = "C:\Temp\dashboard-manager\files"
            
            if (-not (Test-Path $imagesDir)) {
                New-Item -ItemType Directory -Path $imagesDir -Force | Out-Null
                Write-Host "Diretório criado: $imagesDir" -ForegroundColor Green
            }
            
            if (-not (Test-Path $filesDir)) {
                New-Item -ItemType Directory -Path $filesDir -Force | Out-Null
                Write-Host "Diretório criado: $filesDir" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "AVISO: setup-storage.sh falhou, continuando..." -ForegroundColor Yellow
    } finally {
        Pop-Location
    }
    Write-Host ""
}

# Definir volumes para Windows
$IMAGES_VOLUME = "C:/Temp/dashboard-manager/images:/opt/app/images"
$FILES_VOLUME = "C:/Temp/dashboard-manager/files:/opt/app/files"

Write-Host "Configurando volumes para Windows..." -ForegroundColor Yellow
Write-Host "  Imagens: C:/Temp/dashboard-manager/images"
Write-Host "  Arquivos: C:/Temp/dashboard-manager/files"
Write-Host ""

# Criar arquivo docker-compose.override.yml
$overrideContent = @"
version: '2.4'
services:
  backend-app:
    volumes:
      # Bind mounts: mapeia diretórios do host Windows para dentro do container
      # OS: Windows
      - ${IMAGES_VOLUME}
      - ${FILES_VOLUME}
"@

$overrideContent | Out-File -FilePath $OVERRIDE_FILE -Encoding UTF8 -Force

Write-Host "Arquivo docker-compose.override.yml criado com volumes para Windows" -ForegroundColor Green
Write-Host "  $IMAGES_VOLUME"
Write-Host "  $FILES_VOLUME"
Write-Host ""

# Executar docker-compose up
Write-Host "Subindo containers Docker..." -ForegroundColor Green
Write-Host ""

# Se não houver argumentos, usar -d (detached mode)
if ($args.Count -eq 0) {
    docker-compose up -d
} else {
    docker-compose up $args
}

Write-Host ""
Write-Host "=== Containers iniciados ===" -ForegroundColor Green
Write-Host ""
Write-Host "Para ver os logs:"
Write-Host "  docker-compose logs -f backend-app"
Write-Host ""
Write-Host "Para verificar o status:"
Write-Host "  docker-compose ps"
Write-Host ""
Write-Host "Nota: docker-compose.override.yml foi criado automaticamente" -ForegroundColor Yellow
Write-Host "Este arquivo pode ser deletado se necessário" -ForegroundColor Yellow
Write-Host ""

