#!/bin/bash

# Script wrapper para subir o Docker Compose
# Executa o setup-storage.sh antes de iniciar os containers
# Detecta automaticamente Windows ou Linux e configura os caminhos corretos

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

# Função para exibir ajuda
show_help() {
    echo -e "${YELLOW}=== Como usar este script ===${NC}"
    echo ""
    echo -e "${GREEN}MÉTODO 1: Passar como primeiro argumento${NC}"
    echo "  ./docker-compose-up.sh dev    # Ambiente de desenvolvimento"
    echo "  ./docker-compose-up.sh prod   # Ambiente de produção"
    echo ""
    echo -e "${GREEN}MÉTODO 2: Usar variável de ambiente ENV${NC}"
    echo "  ENV=dev ./docker-compose-up.sh"
    echo "  ENV=prod ./docker-compose-up.sh"
    echo ""
    echo -e "${GREEN}MÉTODO 3: Exportar variável antes de executar${NC}"
    echo "  export ENV=dev"
    echo "  ./docker-compose-up.sh"
    echo ""
    echo -e "${GREEN}Com argumentos adicionais do docker-compose:${NC}"
    echo "  ./docker-compose-up.sh dev --build"
    echo "  ./docker-compose-up.sh prod -d"
    echo ""
    echo -e "${YELLOW}Valores aceitos: dev ou prod${NC}"
    echo ""
}

# Detectar ambiente (dev ou prod) - OBRIGATÓRIO
# Aceita como primeiro argumento ou variável de ambiente ENV
# Salvar argumentos originais
ORIGINAL_ARGS=("$@")

# Verificar se foi solicitada ajuda
if [ $# -gt 0 ] && ([ "$1" = "--help" ] || [ "$1" = "-h" ] || [ "$1" = "help" ]); then
    show_help
    exit 0
fi

# Verificar se o primeiro argumento é dev ou prod
if [ $# -gt 0 ] && ([ "$1" = "dev" ] || [ "$1" = "prod" ]); then
    ENV="$1"
    shift  # Remove o primeiro argumento
elif [ -n "$ENV" ]; then
    # Usar variável de ambiente ENV se definida
    ENV="$ENV"
else
    # Ambiente não especificado - ERRO com ajuda detalhada
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ERRO: Ambiente não especificado!${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Você DEVE especificar o ambiente explicitamente.${NC}"
    echo ""
    show_help
    exit 1
fi

if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ERRO: Ambiente inválido: '$ENV'${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Valores aceitos: dev ou prod${NC}"
    echo ""
    show_help
    exit 1
fi

# Configurar arquivo .env baseado no ambiente
ENV_FILE="$BACKEND_DIR/.env.$ENV"
TARGET_ENV_FILE="$BACKEND_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}ERRO: Arquivo de ambiente não encontrado: $ENV_FILE${NC}"
    exit 1
fi

# Copiar arquivo de ambiente para .env
echo -e "${BLUE}=== Dashboard Manager - Inicialização ===${NC}"
echo -e "${YELLOW}Ambiente: $ENV${NC}"
if [ "$ENV" = "prod" ]; then
    echo -e "${RED}⚠ ATENÇÃO: Ambiente de PRODUÇÃO${NC}"
fi
echo -e "  Arquivo de configuração: $ENV_FILE"
cp "$ENV_FILE" "$TARGET_ENV_FILE"
echo -e "${GREEN}✓ Arquivo .env configurado para ambiente $ENV${NC}"
echo ""

# Função para detectar o sistema operacional
detect_os() {
    # Detectar Windows (Git Bash, MSYS, Cygwin)
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    elif [[ -n "$WINDIR" ]] || [[ -n "$SYSTEMROOT" ]]; then
        echo "windows"
    elif command -v cmd.exe >/dev/null 2>&1; then
        echo "windows"
    elif [[ "$(uname -s 2>/dev/null)" =~ ^(MINGW|MSYS|CYGWIN) ]]; then
        echo "windows"
    else
        echo "linux"
    fi
}

# Detectar sistema operacional
OS_TYPE=$(detect_os)

echo -e "${BLUE}=== Dashboard Manager - Inicialização ===${NC}"
echo -e "${YELLOW}OS detectado: $OS_TYPE${NC}"
echo ""

# Verificar se o script setup-storage.sh existe
if [ -f "$BACKEND_DIR/setup-storage.sh" ]; then
    echo -e "${YELLOW}Executando setup-storage.sh...${NC}"
    cd "$BACKEND_DIR"
    chmod +x setup-storage.sh 2>/dev/null || true
    bash setup-storage.sh || {
        echo -e "${YELLOW}AVISO: setup-storage.sh falhou, continuando...${NC}"
    }
    cd "$SCRIPT_DIR"
    echo ""
else
    echo -e "${YELLOW}AVISO: setup-storage.sh não encontrado em $BACKEND_DIR${NC}"
    echo -e "${YELLOW}Continuando sem executar setup...${NC}"
    echo ""
fi

# Definir volumes baseado no OS
if [ "$OS_TYPE" = "windows" ]; then
    # Windows: usar C:/Temp (formato Docker Compose para Windows)
    export IMAGES_VOLUME="C:/Temp/dashboard-manager/images:/opt/app/images"
    export FILES_VOLUME="C:/Temp/dashboard-manager/files:/opt/app/files"
    echo -e "${YELLOW}Configurando volumes para Windows...${NC}"
    echo -e "  Imagens: C:/Temp/dashboard-manager/images"
    echo -e "  Arquivos: C:/Temp/dashboard-manager/files"
else
    # Linux: usar /opt
    export IMAGES_VOLUME="/opt/dashboard-manager/images:/opt/app/images"
    export FILES_VOLUME="/opt/dashboard-manager/files:/opt/app/files"
    echo -e "${YELLOW}Configurando volumes para Linux...${NC}"
    echo -e "  Imagens: /opt/dashboard-manager/images"
    echo -e "  Arquivos: /opt/dashboard-manager/files"
fi

echo ""

# Criar arquivo docker-compose.override.yml com os volumes corretos
# O Docker Compose carrega automaticamente docker-compose.yml e docker-compose.override.yml
OVERRIDE_FILE="$SCRIPT_DIR/docker-compose.override.yml"

# Converter caminhos Windows para formato Docker (se necessário)
if [ "$OS_TYPE" = "windows" ]; then
    # Garantir que o caminho está no formato correto para Docker no Windows
    # Docker no Windows aceita tanto C:\Temp quanto C:/Temp
    IMAGES_VOLUME="${IMAGES_VOLUME//\\//}"  # Converter \ para /
    FILES_VOLUME="${FILES_VOLUME//\\//}"    # Converter \ para /
fi

# Criar o arquivo override.yml
{
    echo "version: '2.4'"
    echo "services:"
    echo "  app:"
    echo "    volumes:"
    echo "      # Bind mounts: mapeia diretórios do host para dentro do container"
    echo "      # OS: $OS_TYPE"
    echo "      - ${IMAGES_VOLUME}"
    echo "      - ${FILES_VOLUME}"
} > "$OVERRIDE_FILE"

echo -e "${GREEN}Arquivo docker-compose.override.yml criado com volumes para $OS_TYPE${NC}"
echo -e "  ${IMAGES_VOLUME}"
echo -e "  ${FILES_VOLUME}"
echo ""

# Executar docker-compose up
echo -e "${GREEN}Subindo containers Docker...${NC}"
echo ""

HAS_DETACH=false
for arg in "$@"; do
    if [ "$arg" = "-d" ] || [ "$arg" = "--detach" ]; then
        HAS_DETACH=true
        break
    fi
done

if [ $# -eq 0 ]; then
    docker-compose up -d
elif [ "$HAS_DETACH" = false ]; then
    docker-compose up "$@" -d
else
    docker-compose up "$@"
fi

echo ""
echo -e "${GREEN}=== Containers iniciados ===${NC}"
echo ""
echo "Para ver os logs:"
echo "  docker-compose logs -f app"
echo ""
echo "Para verificar o status:"
echo "  docker-compose ps"
echo ""
echo -e "${YELLOW}Nota: docker-compose.override.yml foi criado automaticamente${NC}"
echo -e "${YELLOW}Este arquivo pode ser deletado se necessário${NC}"
echo ""
