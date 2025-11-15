#!/bin/bash

# Script para criar e configurar diretórios de armazenamento no host
# Este script é executado automaticamente pelo docker-compose-up.sh
# Também pode ser executado manualmente antes de subir o Docker
# Suporta Windows e Linux

# Não usar set -e para permitir tratamento de erros personalizado

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para detectar o sistema operacional
detect_os() {
    # Detectar Windows (Git Bash, MSYS, Cygwin, WSL)
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    elif [[ -n "$WINDIR" ]] || [[ -n "$SYSTEMROOT" ]]; then
        echo "windows"
    elif command -v cmd.exe >/dev/null 2>&1; then
        echo "windows"
    elif [[ "$(uname -s)" =~ ^(MINGW|MSYS|CYGWIN) ]]; then
        echo "windows"
    else
        echo "linux"
    fi
}

# Detectar sistema operacional
OS_TYPE=$(detect_os)

# Definir diretórios baseado no OS
if [ "$OS_TYPE" = "windows" ]; then
    # Windows: usar C:\Temp
    # Determinar o caminho base dependendo do ambiente (Git Bash, Cygwin, WSL)
    if [ -d "/c" ] || [ -d "/cygdrive/c" ]; then
        # Git Bash ou Cygwin: /c/Temp ou /cygdrive/c/Temp
        BASE_DIR="/c/Temp"
        [ -d "/cygdrive/c" ] && BASE_DIR="/cygdrive/c/Temp"
    elif [ -d "/mnt/c" ]; then
        # WSL: /mnt/c/Temp
        BASE_DIR="/mnt/c/Temp"
    else
        # Fallback: assumir Git Bash padrão
        BASE_DIR="/c/Temp"
    fi
    
    # Garantir que C:\Temp existe (criar se necessário)
    if [ ! -d "$BASE_DIR" ]; then
        echo -e "${YELLOW}Criando diretório base: $BASE_DIR${NC}"
        mkdir -p "$BASE_DIR" 2>/dev/null || {
            echo -e "${YELLOW}AVISO: Não foi possível criar $BASE_DIR (pode não ter permissão)${NC}"
            echo -e "${YELLOW}O Docker criará automaticamente quando o bind mount for montado${NC}"
        }
    fi
    
    # Definir caminhos completos
    IMAGES_DIR="$BASE_DIR/dashboard-manager/images"
    FILES_DIR="$BASE_DIR/dashboard-manager/files"
    
    echo -e "${BLUE}=== Configurando diretórios de armazenamento (Windows) ===${NC}"
    echo -e "${YELLOW}OS detectado: Windows${NC}"
    echo -e "${YELLOW}Diretório base: $BASE_DIR (mapeia para C:\\Temp no Windows)${NC}"
    echo -e "${YELLOW}Caminho das imagens: $IMAGES_DIR${NC}"
    echo -e "${YELLOW}Caminho dos arquivos: $FILES_DIR${NC}"
else
    # Linux: usar /opt
    IMAGES_DIR="/opt/dashboard-manager/images"
    FILES_DIR="/opt/dashboard-manager/files"
    echo -e "${BLUE}=== Configurando diretórios de armazenamento (Linux) ===${NC}"
    echo -e "${YELLOW}OS detectado: Linux${NC}"
fi

echo ""

# Função para criar diretório (tenta com sudo se necessário no Linux)
create_directory() {
    local dir=$1
    if [ ! -d "$dir" ]; then
        echo -e "${YELLOW}Criando diretório: $dir${NC}"
        # Tentar criar sem sudo primeiro (funciona no Windows e Linux se tiver permissão)
        if mkdir -p "$dir" 2>/dev/null; then
            echo -e "${GREEN}✓ Diretório criado: $dir${NC}"
        elif [ "$OS_TYPE" = "linux" ] && command -v sudo >/dev/null 2>&1; then
            # Se falhar e estiver no Linux, tentar com sudo
            if sudo mkdir -p "$dir" 2>/dev/null; then
                echo -e "${GREEN}✓ Diretório criado com sudo: $dir${NC}"
            else
                echo -e "${YELLOW}AVISO: Não foi possível criar $dir com sudo${NC}"
                echo -e "${YELLOW}O Docker criará automaticamente quando o bind mount for montado${NC}"
                return 0
            fi
        else
            # No Windows ou sem sudo, avisar mas não falhar
            echo -e "${YELLOW}AVISO: Não foi possível criar $dir${NC}"
            if [ "$OS_TYPE" = "windows" ]; then
                echo -e "${YELLOW}O Docker criará automaticamente quando o bind mount for montado${NC}"
                echo -e "${YELLOW}Ou crie manualmente: mkdir -p $dir${NC}"
            else
                echo -e "${YELLOW}O Docker criará automaticamente quando o bind mount for montado${NC}"
            fi
            return 0
        fi
    else
        echo -e "${GREEN}✓ Diretório já existe: $dir${NC}"
    fi
    return 0
}

# Função para configurar permissões (apenas no Linux)
set_permissions() {
    local dir=$1
    local uid=$2
    local gid=$3
    
    # No Windows, não precisa configurar permissões Unix
    if [ "$OS_TYPE" = "windows" ]; then
        echo -e "${GREEN}✓ Permissões do Windows configuradas automaticamente${NC}"
        return 0
    fi
    
    # No Linux, tentar configurar permissões
    # Tentar sem sudo primeiro
    if chmod -R 755 "$dir" 2>/dev/null && chown -R $uid:$gid "$dir" 2>/dev/null; then
        echo -e "${GREEN}✓ Permissões configuradas: $dir${NC}"
        return 0
    elif command -v sudo >/dev/null 2>&1; then
        # Se falhar, tentar com sudo
        if sudo chmod -R 755 "$dir" 2>/dev/null && sudo chown -R $uid:$gid "$dir" 2>/dev/null; then
            echo -e "${GREEN}✓ Permissões configuradas com sudo: $dir${NC}"
            return 0
        else
            echo -e "${YELLOW}AVISO: Não foi possível configurar permissões para $dir${NC}"
            echo -e "${YELLOW}O Docker pode criar com permissões diferentes, mas deve funcionar${NC}"
            return 0
        fi
    else
        echo -e "${YELLOW}AVISO: Não foi possível configurar permissões (sudo não disponível)${NC}"
        echo -e "${YELLOW}O Docker criará com as permissões padrão${NC}"
        return 0
    fi
}

# Criar diretórios
create_directory "$IMAGES_DIR"
create_directory "$FILES_DIR"

# Obter o UID e GID do usuário que executa o Docker (apenas no Linux)
if [ "$OS_TYPE" = "linux" ]; then
    # Se estiver usando root, use 0:0, caso contrário, use o UID/GID do usuário atual
    DOCKER_UID=${DOCKER_UID:-$(id -u 2>/dev/null || echo "0")}
    DOCKER_GID=${DOCKER_GID:-$(id -g 2>/dev/null || echo "0")}
    
    echo ""
    echo -e "${YELLOW}Configurando permissões (UID: $DOCKER_UID, GID: $DOCKER_GID)${NC}"
    
    # Configurar permissões (apenas no Linux)
    set_permissions "$IMAGES_DIR" "$DOCKER_UID" "$DOCKER_GID"
    set_permissions "$FILES_DIR" "$DOCKER_UID" "$DOCKER_GID"
else
    echo ""
    echo -e "${YELLOW}Windows detectado: permissões serão gerenciadas pelo sistema${NC}"
fi

echo ""
echo -e "${GREEN}=== Diretórios configurados com sucesso ===${NC}"
echo -e "Imagens: $IMAGES_DIR"
echo -e "Arquivos: $FILES_DIR"
echo ""
echo -e "${GREEN}✓ Pronto para subir o Docker!${NC}"
echo ""

