# Configuração de Armazenamento de Imagens

## Visão Geral

As imagens da aplicação são armazenadas no sistema de arquivos do host Linux usando **bind mounts** do Docker. Isso garante que as imagens persistem mesmo após reiniciar ou recriar os containers.

## Estrutura de Diretórios

- **Imagens**: `/opt/dashboard-manager/images`
- **Arquivos Temporários**: `/opt/dashboard-manager/files`

Esses diretórios são mapeados para `/opt/app/images` e `/opt/app/files` dentro do container.

## Configuração Inicial

### Opção 1: Script Automático (Recomendado)

Execute o script de configuração no host Linux:

```bash
cd code/backend
chmod +x setup-storage.sh
./setup-storage.sh
```

O script irá:
- Criar os diretórios se não existirem
- Configurar as permissões corretas
- Validar que tudo está funcionando

### Opção 2: Manual

Crie os diretórios manualmente no host Linux:

```bash
# Criar diretórios
sudo mkdir -p /opt/dashboard-manager/images
sudo mkdir -p /opt/dashboard-manager/files

# Configurar permissões (substitua $USER pelo usuário que executa o Docker)
sudo chown -R $USER:$USER /opt/dashboard-manager/images
sudo chown -R $USER:$USER /opt/dashboard-manager/files
sudo chmod -R 755 /opt/dashboard-manager/images
sudo chmod -R 755 /opt/dashboard-manager/files
```

## Comportamento do Docker

Quando o Docker inicia com bind mounts:

1. **Se o diretório existe no host**: O Docker monta o diretório existente
2. **Se o diretório não existe no host**: O Docker cria automaticamente (como root)
3. **O entrypoint.sh do container**: Valida que os diretórios existem e são graváveis

### Importante

- Os diretórios são criados automaticamente pelo Docker se não existirem
- Porém, se criados pelo Docker, podem ter permissões incorretas (root:root)
- Por isso, recomenda-se executar o `setup-storage.sh` antes da primeira execução
- Após criar os diretórios, eles **nunca serão deletados** pelo Docker ou pela aplicação

## Persistência

✅ **As imagens persistem** quando você:
- Reinicia o container
- Recria o container
- Atualiza a aplicação
- Reinicia o servidor

❌ **As imagens NÃO persistem** se você:
- Deletar os diretórios manualmente no host
- Remover os bind mounts do docker-compose.yml
- Formatar o disco do servidor

## Backup

Para fazer backup das imagens:

```bash
# Backup das imagens
tar -czf backup-images-$(date +%Y%m%d).tar.gz /opt/dashboard-manager/images

# Restaurar backup
tar -xzf backup-images-YYYYMMDD.tar.gz -C /
```

## Troubleshooting

### Erro: "Diretório não é gravável"

**Causa**: Permissões incorretas no host

**Solução**:
```bash
sudo chown -R $USER:$USER /opt/dashboard-manager/images
sudo chown -R $USER:$USER /opt/dashboard-manager/files
sudo chmod -R 755 /opt/dashboard-manager/images
sudo chmod -R 755 /opt/dashboard-manager/files
```

### Erro: "Permission denied"

**Causa**: O usuário do Docker não tem permissão para escrever

**Solução**:
1. Identifique o UID/GID do usuário do Docker:
   ```bash
   id $(whoami)
   ```

2. Ajuste as permissões:
   ```bash
   sudo chown -R <UID>:<GID> /opt/dashboard-manager/images
   sudo chown -R <UID>:<GID> /opt/dashboard-manager/files
   ```

### Imagens não aparecem após reiniciar

**Causa**: Bind mount não está configurado corretamente

**Solução**:
1. Verifique o `docker-compose.yml`:
   ```yaml
   volumes:
     - /opt/dashboard-manager/images:/opt/app/images
     - /opt/dashboard-manager/files:/opt/app/files
   ```

2. Verifique se os diretórios existem no host:
   ```bash
   ls -la /opt/dashboard-manager/images
   ```

3. Verifique os logs do container:
   ```bash
   docker-compose logs backend-app | grep "Diretórios"
   ```

## Alterando o Caminho de Armazenamento

Se você quiser usar um caminho diferente no host:

1. Edite o `docker-compose.yml`:
   ```yaml
   volumes:
     - /caminho/do/host/images:/opt/app/images
     - /caminho/do/host/files:/opt/app/files
   ```

2. Crie os diretórios no novo caminho:
   ```bash
   sudo mkdir -p /caminho/do/host/images
   sudo mkdir -p /caminho/do/host/files
   sudo chmod -R 755 /caminho/do/host/images
   sudo chmod -R 755 /caminho/do/host/files
   ```

3. Se houver imagens antigas, mova-as:
   ```bash
   sudo mv /opt/dashboard-manager/images/* /caminho/do/host/images/
   ```

## Notas de Segurança

- Os diretórios devem ter permissões `755` (rwxr-xr-x)
- Não use permissões `777` (rwxrwxrwx) em produção
- Mantenha backups regulares das imagens
- Monitore o uso de disco dos diretórios

