#!/bin/sh

# Script de inicialização do container
# Garante que os diretórios existam e tenham permissões corretas
# NOTA: Este script roda DENTRO do container. Os diretórios são bind mounts do host.
# O Docker cria automaticamente os diretórios no host se não existirem quando usa bind mounts.

set -e

# Diretórios que serão mapeados via bind mount do host Linux
IMAGES_DIR="/opt/app/images"
FILES_DIR="/opt/app/files"

echo "=== Inicializando diretórios de armazenamento ==="
echo "IMAGES_DIR: $IMAGES_DIR"
echo "FILES_DIR: $FILES_DIR"
echo ""

# Aguardar um momento para garantir que o bind mount foi montado
sleep 1

# Verificar se os diretórios existem
# Com bind mounts, o Docker cria automaticamente se não existirem no host
# Mas pode levar um momento para o mount ser concluído
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if [ -d "$IMAGES_DIR" ] && [ -d "$FILES_DIR" ]; then
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Aguardando montagem de bind mount... (tentativa $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

# Verificar se os diretórios existem após as tentativas
if [ ! -d "$IMAGES_DIR" ]; then
    echo "AVISO: Diretório de imagens não encontrado: $IMAGES_DIR"
    echo "Tentando criar... (Docker deve criar automaticamente com bind mount)"
    mkdir -p "$IMAGES_DIR" 2>/dev/null || {
        echo "ERRO: Não foi possível criar/acessar $IMAGES_DIR"
        echo "Verifique se o bind mount está configurado corretamente no docker-compose.yml"
        echo "Caminho no host deve ser: /opt/dashboard-manager/images"
        exit 1
    }
    echo "✓ Diretório de imagens criado: $IMAGES_DIR"
else
    echo "✓ Diretório de imagens existe: $IMAGES_DIR"
fi

if [ ! -d "$FILES_DIR" ]; then
    echo "AVISO: Diretório de arquivos não encontrado: $FILES_DIR"
    echo "Tentando criar... (Docker deve criar automaticamente com bind mount)"
    mkdir -p "$FILES_DIR" 2>/dev/null || {
        echo "ERRO: Não foi possível criar/acessar $FILES_DIR"
        echo "Verifique se o bind mount está configurado corretamente no docker-compose.yml"
        echo "Caminho no host deve ser: /opt/dashboard-manager/files"
        exit 1
    }
    echo "✓ Diretório de arquivos criado: $FILES_DIR"
else
    echo "✓ Diretório de arquivos existe: $FILES_DIR"
fi

# Criar subdiretórios necessários (isso funciona mesmo com bind mounts)
echo ""
echo "Criando subdiretórios..."
mkdir -p "$IMAGES_DIR/profiles" 2>/dev/null && echo "  ✓ $IMAGES_DIR/profiles" || echo "  ⚠ Não foi possível criar profiles (pode já existir)"
mkdir -p "$IMAGES_DIR/logos" 2>/dev/null && echo "  ✓ $IMAGES_DIR/logos" || echo "  ⚠ Não foi possível criar logos (pode já existir)"
mkdir -p "$IMAGES_DIR/agendamentos" 2>/dev/null && echo "  ✓ $IMAGES_DIR/agendamentos" || echo "  ⚠ Não foi possível criar agendamentos (pode já existir)"
echo ""

# Verificar permissões de escrita
# NOTA: Com bind mounts, as permissões são controladas pelo host
# Este script apenas valida se é possível escrever

if [ ! -w "$IMAGES_DIR" ]; then
    echo "ERRO: Diretório $IMAGES_DIR não é gravável!"
    echo ""
    echo "Solução:"
    echo "1. No host Linux, execute:"
    echo "   sudo chmod -R 755 /opt/dashboard-manager/images"
    echo "   sudo chown -R \$(id -u):\$(id -g) /opt/dashboard-manager/images"
    echo ""
    echo "2. Ou execute o script de setup:"
    echo "   cd code/backend && ./setup-storage.sh"
    echo ""
    exit 1
fi

if [ ! -w "$FILES_DIR" ]; then
    echo "ERRO: Diretório $FILES_DIR não é gravável!"
    echo ""
    echo "Solução:"
    echo "1. No host Linux, execute:"
    echo "   sudo chmod -R 755 /opt/dashboard-manager/files"
    echo "   sudo chown -R \$(id -u):\$(id -g) /opt/dashboard-manager/files"
    echo ""
    echo "2. Ou execute o script de setup:"
    echo "   cd code/backend && ./setup-storage.sh"
    echo ""
    exit 1
fi

echo "=== Diretórios validados com sucesso ==="
echo "✓ Imagens: $IMAGES_DIR (gravável)"
echo "✓ Arquivos: $FILES_DIR (gravável)"
echo ""

# Listar conteúdo dos diretórios (útil para debug)
echo "Conteúdo do diretório de imagens:"
ls -la "$IMAGES_DIR" | head -10 || echo "  (diretório vazio ou sem permissão de leitura)"
echo ""

# Executar a aplicação Java
echo "=== Iniciando aplicação Java ==="
exec java -jar app.jar

