# Configuração de Armazenamento - Bind Mounts

## ✅ Mudanças Implementadas

As imagens agora são armazenadas no sistema de arquivos do host Linux usando **bind mounts**, garantindo persistência mesmo após reiniciar ou recriar os containers.

## 📁 Estrutura de Diretórios

### No Host Linux:
- `/opt/dashboard-manager/images` - Imagens da aplicação
- `/opt/dashboard-manager/files` - Arquivos temporários

### No Container:
- `/opt/app/images` - Mapeado de `/opt/dashboard-manager/images`
- `/opt/app/files` - Mapeado de `/opt/dashboard-manager/files`

## 🚀 Como Usar

### 1. Primeira Execução (Configuração Inicial)

No host Linux, execute o script de configuração:

```bash
cd code/backend
chmod +x setup-storage.sh
./setup-storage.sh
```

Este script irá:
- ✅ Criar os diretórios se não existirem
- ✅ Configurar permissões corretas
- ✅ Validar que tudo está funcionando

### 2. Subir o Docker

```bash
docker-compose up -d
```

O `entrypoint.sh` do container irá:
- ✅ Validar que os diretórios existem
- ✅ Verificar permissões de escrita
- ✅ Criar subdiretórios necessários (profiles, logos, agendamentos)
- ✅ Iniciar a aplicação Java

### 3. Verificar Logs

```bash
docker-compose logs backend-app | grep "Diretórios"
```

Você deve ver:
```
=== Inicializando diretórios de armazenamento ===
✓ Diretório de imagens existe: /opt/app/images
✓ Diretório de arquivos existe: /opt/app/files
=== Diretórios validados com sucesso ===
```

## 🔧 Configuração do .env.prod

Crie o arquivo `code/backend/.env.prod` com:

```env
# Configurações de Diretórios
DIR_IMAGE=/opt/app/images
DIR_TEMP=/opt/app/files

# Outras configurações...
SQL_HOST=localhost
SQL_PORT=3306
SQL_DB=system
SQL_USER=root
SQL_PASS=root

JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400000

MAX_BACKLOG_MINUTES=5
LOAD_SCHEDULE=0 */5 * * * *
CATCHUP_RECURRENCE_THRESHOLD_MINUTES=60

API_WTZ_URL=http://192.168.15.17
APP_BASE_URL=http://localhost:8080
```

## 🔄 Comportamento

### Criação Automática
- ✅ Se os diretórios **não existirem** no host, o Docker os criará automaticamente
- ✅ O `entrypoint.sh` validará e criará subdiretórios se necessário
- ✅ **Nenhum arquivo será deletado** - apenas criação/validação

### Persistência
- ✅ Imagens persistem após reiniciar o container
- ✅ Imagens persistem após recriar o container
- ✅ Imagens persistem após atualizar a aplicação
- ✅ Imagens persistem após reiniciar o servidor

### Segurança
- ✅ Diretórios criados com permissões `755`
- ✅ Validação de permissões de escrita no startup
- ✅ Mensagens de erro claras se houver problemas

## 🐛 Troubleshooting

### Erro: "Diretório não é gravável"

**Solução:**
```bash
sudo chmod -R 755 /opt/dashboard-manager/images
sudo chmod -R 755 /opt/dashboard-manager/files
sudo chown -R $(id -u):$(id -g) /opt/dashboard-manager/images
sudo chown -R $(id -u):$(id -g) /opt/dashboard-manager/files
```

Ou execute o script:
```bash
cd code/backend && ./setup-storage.sh
```

### Imagens não aparecem após reiniciar

**Verificar:**
1. Bind mounts estão configurados no `docker-compose.yml`
2. Diretórios existem no host: `ls -la /opt/dashboard-manager/images`
3. Permissões corretas: `ls -ld /opt/dashboard-manager/images`

## 📝 Notas Importantes

1. **Primeira execução**: Execute `setup-storage.sh` antes de subir o Docker
2. **Permissões**: O script configura permissões automaticamente
3. **Backup**: Faça backup regular dos diretórios `/opt/dashboard-manager/images`
4. **Migração**: Se houver dados em volumes antigos, copie antes de mudar

## 📚 Documentação Adicional

Veja `code/backend/STORAGE_SETUP.md` para documentação completa e detalhada.

