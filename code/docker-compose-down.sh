#!/bin/bash

# Script wrapper para parar o Docker Compose

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Parando containers Docker...${NC}"
docker-compose down "$@"
echo -e "${GREEN}=== Containers parados ===${NC}"

