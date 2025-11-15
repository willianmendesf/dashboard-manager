#!/bin/bash

# Configurações iniciais
MES_INICIAL=4          # Mês de início (ex: 5 para Maio)
ANO_DESTINO=2025        # Ano para os dados simulados
NUM_MESES=4             # Quantidade de meses a gerar
ARQUIVO_JSON="../data/history/prayer.json"  # Caminho do arquivo JSON gerado pela API
ENDPOINT="http://localhost:3400/api/v1/prayer"
TEMPO_ESPERA=5          # Tempo de espera em segundos após consumir a API

# Função para gerar datas simuladas usando date
gerar_datas() {
  local mes=$1
  local ano=$2
  local datas=()
  local dia=1

  while true; do
    DATA=$(date -d "$ano-$(printf "%02d" $mes)-$dia" +%Y-%m-%d 2>/dev/null)
    if [ -z "$DATA" ]; then
      break
    fi
    datas+=("$DATA")
    dia=$((dia + 1))
  done

  echo "${datas[@]}"
}

# Loop principal
for ((i=0; i<$NUM_MESES; i++)); do
  MES_ATUAL=$((MES_INICIAL + i))
  DATAS=$(gerar_datas $MES_ATUAL $ANO_DESTINO)

  for DATA in $DATAS; do
    echo "🔄 Consumindo API para gerar dados..."
    curl -s -X POST $ENDPOINT > /dev/null

    echo "⏳ Aguardando $TEMPO_ESPERA segundos para a API gerar o arquivo..."
    sleep $TEMPO_ESPERA

    echo "📁 Lendo arquivo JSON..."
    if [ ! -f "$ARQUIVO_JSON" ]; then
      echo "❌ Arquivo $ARQUIVO_JSON não encontrado!"
      exit 1
    fi

    # Extrai a data atual do JSON (última chave)
    DATA_ATUAL=$(jq -r 'keys_unsorted | sort | last' "$ARQUIVO_JSON")

    echo "✏️ Renomeando $DATA_ATUAL para $DATA..."
    jq --arg old "$DATA_ATUAL" --arg new "$DATA" '
      .[$new] = .[$old] | del(.[$old])
    ' "$ARQUIVO_JSON" > tmp.json && mv tmp.json "$ARQUIVO_JSON"
  done
done

echo "✅ Processo concluído. Dados gerados de 0$MES_INICIAL até 0$((MES_INICIAL + NUM_MESES - 1))/$ANO_DESTINO."
