#!/bin/bash

# Caminhos
SCRIPT_DIR="$(dirname "$0")"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PID_FILE="$SCRIPT_DIR/pid.txt"
LOGS_DIR="$ROOT_DIR/logs"

# 🛑 Finaliza a aplicação
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  kill "$PID" && echo "🛑 Processo encerrado (PID: $PID)" || echo "⚠️ Falha ao encerrar processo."
  rm -f "$PID_FILE"
else
  echo "⚠️ Nenhum arquivo pid.txt encontrado. Nenhum processo encerrado."
fi

# 🧹 Apaga todos os .log na pasta /logs
if [ -d "$LOGS_DIR" ]; then
  find "$LOGS_DIR" -type f -name '*.log' -exec rm -f {} \;
  echo "🧹 Todos os arquivos .log removidos de: $LOGS_DIR"
else
  echo "⚠️ Pasta de logs não encontrada: $LOGS_DIR"
fi
