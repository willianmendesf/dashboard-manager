# Script PowerShell para Windows
# Executa o setup-storage.sh antes de iniciar os containers
# Detecta automaticamente Windows e configura os caminhos corretos

$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND_DIR = Join-Path $SCRIPT_DIR "backend"
$COMPOSE_FILE = Join-Path $SCRIPT_DIR "docker-compose.yml"
$OVERRIDE_FILE = Join-Path $SCRIPT_DIR "docker-compose.override.yml"

# Função para exibir ajuda
function Show-Help {
    Write-Host "=== Como usar este script ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "MÉTODO 1: Passar como primeiro argumento" -ForegroundColor Green
    Write-Host "  .\docker-compose-up.ps1 dev    # Ambiente de desenvolvimento"
    Write-Host "  .\docker-compose-up.ps1 prod   # Ambiente de produção"
    Write-Host ""
    Write-Host "MÉTODO 2: Usar variável de ambiente ENV" -ForegroundColor Green
    Write-Host "  `$env:ENV='dev'; .\docker-compose-up.ps1"
    Write-Host "  `$env:ENV='prod'; .\docker-compose-up.ps1"
    Write-Host ""
    Write-Host "MÉTODO 3: Exportar variável antes de executar" -ForegroundColor Green
    Write-Host "  `$env:ENV='dev'"
    Write-Host "  .\docker-compose-up.ps1"
    Write-Host ""
    Write-Host "Com argumentos adicionais do docker-compose:" -ForegroundColor Green
    Write-Host "  .\docker-compose-up.ps1 dev --build"
    Write-Host "  .\docker-compose-up.ps1 prod -d"
    Write-Host ""
    Write-Host "Valores aceitos: dev ou prod" -ForegroundColor Yellow
    Write-Host ""
}

# Detectar ambiente (dev ou prod) - OBRIGATÓRIO
# Aceita como primeiro argumento ou variável de ambiente ENV

# Verificar se foi solicitada ajuda
if ($args.Count -gt 0 -and ($args[0] -eq "--help" -or $args[0] -eq "-h" -or $args[0] -eq "help")) {
    Show-Help
    exit 0
}

if ($args.Count -gt 0 -and ($args[0] -eq "dev" -or $args[0] -eq "prod")) {
    $ENV = $args[0]
} elseif ($env:ENV) {
    $ENV = $env:ENV
} else {
    # Ambiente não especificado - ERRO com ajuda detalhada
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "  ERRO: Ambiente não especificado!" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host ""
    Write-Host "Você DEVE especificar o ambiente explicitamente." -ForegroundColor Yellow
    Write-Host ""
    Show-Help
    exit 1
}

if ($ENV -ne "dev" -and $ENV -ne "prod") {
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "  ERRO: Ambiente inválido: '$ENV'" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host ""
    Write-Host "Valores aceitos: dev ou prod" -ForegroundColor Yellow
    Write-Host ""
    Show-Help
    exit 1
}

# Configurar arquivo .env baseado no ambiente
$ENV_FILE = Join-Path $BACKEND_DIR ".env.$ENV"
$TARGET_ENV_FILE = Join-Path $BACKEND_DIR ".env"

if (-not (Test-Path $ENV_FILE)) {
    Write-Host "ERRO: Arquivo de ambiente não encontrado: $ENV_FILE" -ForegroundColor Red
    exit 1
}

# Copiar arquivo de ambiente para .env
Write-Host "=== Dashboard Manager - Inicialização ===" -ForegroundColor Cyan
Write-Host "OS detectado: Windows" -ForegroundColor Yellow
Write-Host "Ambiente: $ENV" -ForegroundColor Yellow
if ($ENV -eq "prod") {
    Write-Host "⚠ ATENÇÃO: Ambiente de PRODUÇÃO" -ForegroundColor Red
}
Write-Host "  Arquivo de configuração: $ENV_FILE"
Copy-Item -Path $ENV_FILE -Destination $TARGET_ENV_FILE -Force
Write-Host "✓ Arquivo .env configurado para ambiente $ENV" -ForegroundColor Green
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
  app:
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

# Se o primeiro argumento foi ENV, remover e passar os demais para docker-compose
$dockerArgs = if ($args.Count -gt 0 -and ($args[0] -eq "dev" -or $args[0] -eq "prod")) {
    $args[1..($args.Count - 1)]
} else {
    $args
}

$hasDetach = $false
foreach ($arg in $dockerArgs) {
    if ($arg -eq "-d" -or $arg -eq "--detach") {
        $hasDetach = $true
        break
    }
}

if ($dockerArgs.Count -eq 0) {
    docker-compose up -d
} elseif (-not $hasDetach) {
    docker-compose up $dockerArgs -d
} else {
    docker-compose up $dockerArgs
}

Write-Host ""
Write-Host "=== Containers iniciados ===" -ForegroundColor Green
Write-Host ""
Write-Host "Para ver os logs:"
Write-Host "  docker-compose logs -f app"
Write-Host ""
Write-Host "Para verificar o status:"
Write-Host "  docker-compose ps"
Write-Host ""
Write-Host "Nota: docker-compose.override.yml foi criado automaticamente" -ForegroundColor Yellow
Write-Host "Este arquivo pode ser deletado se necessário" -ForegroundColor Yellow
Write-Host ""

