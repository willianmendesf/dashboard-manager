# 🔐 Reset de Senha do Usuário ROOT

## Problema
Você está sem acesso ao sistema porque a senha do usuário `root` não está funcionando.

## Solução: Endpoint de Emergência

### Opção 1: Via API (Recomendado)

**Endpoint:** `POST /api/v1/emergency/reset-root-password`

**Body (JSON):**
```json
{
  "secret": "EMERGENCY_RESET_2024",
  "newPassword": "suaNovaSenha123"
}
```

**Exemplo com cURL:**
```bash
curl -X POST http://localhost:8080/api/v1/emergency/reset-root-password \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "EMERGENCY_RESET_2024",
    "newPassword": "minhaNovaSenha123"
  }'
```

**Exemplo com PowerShell:**
```powershell
$body = @{
    secret = "EMERGENCY_RESET_2024"
    newPassword = "minhaNovaSenha123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/emergency/reset-root-password" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Opção 2: Via Variável de Ambiente

1. **Defina a variável de ambiente:**
   ```powershell
   $env:ROOT_PASSWORD_RESET = "suaNovaSenha123"
   ```

2. **Reinicie o backend**

3. **A senha será resetada automaticamente na inicialização**

### Opção 3: Via Variável de Ambiente (Criação Inicial)

Se o usuário root ainda não existe:

1. **Defina a variável de ambiente:**
   ```powershell
   $env:ROOT_PASSWORD = "suaSenhaDesejada"
   ```

2. **Reinicie o backend**

3. **O usuário root será criado com a senha especificada**

## Segurança

⚠️ **IMPORTANTE:** O endpoint de emergência está configurado como público apenas para desenvolvimento. 

**Para produção:**
1. Defina `EMERGENCY_SECRET` no ambiente com um valor seguro
2. Ou remova/desabilite o endpoint de emergência
3. Use apenas as variáveis de ambiente para reset

## Verificação

Após resetar, teste o login:
- **Username:** `root`
- **Password:** A senha que você definiu

## Recuperação de Senha Normal

Para usuários normais (não root), use o fluxo de recuperação de senha via WhatsApp:
1. Acesse `/esqueci-senha`
2. Informe CPF e telefone
3. Receba código via WhatsApp
4. Redefina a senha em `/redefinir-senha`

