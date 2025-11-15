#!/bin/bash

# Script para parar e limpar processos existentes do WhatsApp
echo "🧹 Limpando processos existentes..."

# Para processos node relacionados ao WhatsApp
pkill -f "whatsapp-message-dispatcher"
pkill -f "app.js"
pkill -f "index.js"

# Para processos chrome/chromium que podem estar orfãos
pkill -f "chrome"
pkill -f "chromium"

# Limpa arquivos temporários
rm -f /tmp/.X*-lock

echo "✅ Limpeza concluída!"

# Aguarda um pouco antes de reiniciar
echo "⏳ Aguardando 3 segundos..."
sleep 3

echo "🚀 Iniciando aplicação..."

source ./scripts/start.sh
