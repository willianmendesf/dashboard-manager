#!/bin/bash

# Caminho da aplicação
APP_PATH="$(dirname "$0")/../app.js"
PID_FILE="$(dirname "$0")/pid.txt"

# Inicia a aplicação em background
node "$APP_PATH" > /dev/null 2>&1 &

# Captura o PID do processo
PID=$!
echo "$PID" > "$PID_FILE"

echo "✅ Aplicação iniciada (PID: $PID)"
