# Docker Setup - Configuração Automática

## 📋 Visão Geral

O sistema agora possui **configuração automática** que executa o `setup-storage.sh` sempre que você subir os containers Docker.

## 🚀 Como Usar

### Opção 1: Usando os Scripts Wrapper (Recomendado)

```bash
# Subir os containers (executa setup-storage.sh automaticamente)
./docker-compose-up.sh

# Ou com npm
npm start

# Parar os containers
./docker-compose-down.sh

# Ou com npm
npm run docker:stop
```

### Opção 2: Usando Docker Compose Diretamente

```bash
# Executar setup manualmente primeiro
cd backend
./setup-storage.sh
cd ..

# Depois subir o Docker
docker-compose up -d
```

## 🔄 Fluxo Automático

Quando você executa `./docker-compose-up.sh` ou `npm start`:

1. ✅ **Executa `setup-storage.sh`**:
   - Cria os diretórios `/opt/dashboard-manager/images` e `/opt/dashboard-manager/files` no host
   - Configura permissões corretas
   - Valida que tudo está funcionando

2. ✅ **Sobe os containers Docker**:
   - O `entrypoint.sh` valida os diretórios dentro do container
   - Cria subdiretórios necessários (profiles, logos, agendamentos)
   - Inicia a aplicação Java

## 📁 Estrutura de Diretórios

### No Host Linux:
- `/opt/dashboard-manager/images` → Mapeado para `/opt/app/images` no container
- `/opt/dashboard-manager/files` → Mapeado para `/opt/app/files` no container

### Comportamento:
- ✅ Se os diretórios **não existirem**, o `setup-storage.sh` os cria
- ✅ Se os diretórios **já existirem**, o script apenas valida e configura permissões
- ✅ **Nenhum arquivo é deletado** - apenas criação/validação

## 🛠️ Scripts Disponíveis

### `docker-compose-up.sh`
- Executa `setup-storage.sh` automaticamente
- Sobe os containers Docker
- Aceita todos os argumentos do `docker-compose up`

### `docker-compose-down.sh`
- Para os containers Docker
- Aceita todos os argumentos do `docker-compose down`

### `backend/setup-storage.sh`
- Cria diretórios no host Linux
- Configura permissões
- Tenta com/sem sudo automaticamente
- Não falha se não tiver permissões (Docker cria automaticamente)

### `backend/entrypoint.sh`
- Executado dentro do container
- Valida que os diretórios existem
- Cria subdiretórios necessários
- Verifica permissões de escrita

## 🔧 Configuração

### Primeira Execução

Na primeira vez que você subir o Docker, o `setup-storage.sh` será executado automaticamente e criará os diretórios necessários.

### Execuções Subsequentes

Nas próximas vezes, o script apenas valida que os diretórios existem e têm as permissões corretas. **Nenhum arquivo é deletado**.

## 📝 Logs

Para verificar se o setup foi executado corretamente:

```bash
# Ver logs do backend
docker-compose logs backend-app | grep "Diretórios"

# Você deve ver:
# === Inicializando diretórios de armazenamento ===
# ✓ Diretório de imagens existe: /opt/app/images
# ✓ Diretório de arquivos existe: /opt/app/files
# === Diretórios validados com sucesso ===
```

## 🐛 Troubleshooting

### Erro: "Diretório não é gravável"

**Causa**: Permissões incorretas no host

**Solução**:
```bash
sudo chmod -R 755 /opt/dashboard-manager/images
sudo chmod -R 755 /opt/dashboard-manager/files
sudo chown -R $(id -u):$(id -g) /opt/dashboard-manager/images
sudo chown -R $(id -u):$(id -g) /opt/dashboard-manager/files
```

Ou execute o script manualmente:
```bash
cd backend
./setup-storage.sh
```

### Script não executa automaticamente

**Verificar**:
1. Os scripts têm permissão de execução? `chmod +x docker-compose-up.sh`
2. Você está executando da raiz do projeto? (onde está o `docker-compose.yml`)
3. O `setup-storage.sh` existe em `backend/setup-storage.sh`?

## ✅ Vantagens

- ✅ **Automático**: Não precisa executar setup manualmente
- ✅ **Seguro**: Não deleta arquivos existentes
- ✅ **Tolerante a falhas**: Continua mesmo se algumas operações falharem
- ✅ **Persistente**: Imagens persistem após reiniciar containers
- ✅ **Flexível**: Funciona com/sem sudo

## 📚 Documentação Adicional

- Veja `backend/STORAGE_SETUP.md` para documentação detalhada sobre armazenamento
- Veja `docker-compose.yml` para configuração dos bind mounts

