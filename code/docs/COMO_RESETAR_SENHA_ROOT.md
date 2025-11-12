# 🔐 Como Resetar a Senha do Usuário ROOT

## 📋 Informações Importantes

Este documento contém instruções para resetar a senha do usuário administrativo `root` quando você não tem mais acesso ao sistema.

**⚠️ ATENÇÃO:** Este é um procedimento de emergência. Em produção, proteja adequadamente o endpoint de emergência ou desabilite-o.

---

## 🚨 Situação: Sem Acesso ao Sistema

Se você está sem acesso ao sistema porque a senha do usuário `root` não está funcionando, use uma das opções abaixo para resetar.

---

## ✅ Opção 1: Via API REST (Recomendado - Mais Rápido)

### Requisitos
- Backend deve estar rodando
- Acesso à API (via curl, Postman, PowerShell, etc.)

### Passo a Passo

#### 1.1. Usando cURL (Linux/Mac/Git Bash)
```bash
curl -X POST http://localhost:8080/api/v1/emergency/reset-root-password \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "EMERGENCY_RESET_2024",
    "newPassword": "suaNovaSenha123"
  }'
```

#### 1.2. Usando PowerShell (Windows)
```powershell
$body = @{
    secret = "EMERGENCY_RESET_2024"
    newPassword = "suaNovaSenha123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/emergency/reset-root-password" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

#### 1.3. Usando Postman
1. Método: `POST`
2. URL: `http://localhost:8080/api/v1/emergency/reset-root-password`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "secret": "EMERGENCY_RESET_2024",
  "newPassword": "suaNovaSenha123"
}
```

### Resposta de Sucesso
```json
{
  "message": "Root password reset successfully",
  "username": "root"
}
```

### Verificação
Após resetar, teste o login:
- **URL:** `http://localhost:8080/api/v1/auth/login`
- **Username:** `root`
- **Password:** A senha que você definiu

---

## ✅ Opção 2: Via Variável de Ambiente (Reset Automático)

### Quando Usar
- Quando você pode reiniciar o backend
- Quando o usuário root já existe no banco

### Passo a Passo

#### 2.1. Definir Variável de Ambiente

**Windows PowerShell:**
```powershell
$env:ROOT_PASSWORD_RESET = "suaNovaSenha123"
```

**Windows CMD:**
```cmd
set ROOT_PASSWORD_RESET=suaNovaSenha123
```

**Linux/Mac:**
```bash
export ROOT_PASSWORD_RESET="suaNovaSenha123"
```

#### 2.2. Reiniciar o Backend
O backend detectará a variável `ROOT_PASSWORD_RESET` na inicialização e resetará automaticamente a senha do usuário root.

#### 2.3. Verificar Logs
Procure no log do backend por:
```
ROOT password was reset via ROOT_PASSWORD_RESET environment variable
```

---

## ✅ Opção 3: Via Variável de Ambiente (Criação Inicial)

### Quando Usar
- Quando o usuário root ainda não existe no banco
- Na primeira inicialização do sistema

### Passo a Passo

#### 3.1. Definir Variável de Ambiente

**Windows PowerShell:**
```powershell
$env:ROOT_PASSWORD = "suaSenhaDesejada"
```

**Windows CMD:**
```cmd
set ROOT_PASSWORD=suaSenhaDesejada
```

**Linux/Mac:**
```bash
export ROOT_PASSWORD="suaSenhaDesejada"
```

#### 3.2. Iniciar o Backend
O backend criará o usuário root com a senha especificada.

#### 3.3. Verificar Logs
Procure no log do backend por:
```
Default ROOT user created: username=root
```

---

## 🔒 Segurança do Endpoint de Emergência

### Secret Padrão (Desenvolvimento)
- **Valor:** `EMERGENCY_RESET_2024`
- **⚠️ ATENÇÃO:** Este é apenas para desenvolvimento!

### Configurar Secret Personalizado (Produção)

#### Via Variável de Ambiente
```powershell
$env:EMERGENCY_SECRET = "seuSecretSeguroAqui123456"
```

O endpoint verificará este secret antes de permitir o reset.

#### Verificar no Código
O secret é verificado em:
```
backend/src/main/java/br/com/willianmendesf/system/controller/EmergencyController.java
```

---

## 📝 Exemplo Completo (PowerShell)

```powershell
# 1. Definir nova senha
$novaSenha = "MinhaSenhaSegura123!"

# 2. Resetar via API
$body = @{
    secret = "EMERGENCY_RESET_2024"
    newPassword = $novaSenha
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/emergency/reset-root-password" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

Write-Host "Senha resetada com sucesso!" -ForegroundColor Green
Write-Host "Username: $($response.username)" -ForegroundColor Cyan
Write-Host "Nova senha: $novaSenha" -ForegroundColor Yellow

# 3. Testar login
$loginBody = @{
    username = "root"
    password = $novaSenha
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $loginBody

Write-Host "Login realizado com sucesso!" -ForegroundColor Green
```

---

## 🛡️ Recomendações de Segurança

### Para Desenvolvimento
- ✅ Use o endpoint de emergência quando necessário
- ✅ Mantenha o secret padrão apenas em ambiente local

### Para Produção
1. **Defina um secret forte:**
   ```powershell
   $env:EMERGENCY_SECRET = "SeuSecretMuitoSeguroAqui123456789"
   ```

2. **Ou desabilite o endpoint:**
   - Comente a rota `/emergency/**` no `SecurityConfig.java`
   - Ou remova o `EmergencyController.java`

3. **Use apenas variáveis de ambiente:**
   - `ROOT_PASSWORD` para criação inicial
   - `ROOT_PASSWORD_RESET` para reset (após desabilitar endpoint)

4. **Proteja as variáveis de ambiente:**
   - Não commite no Git
   - Use arquivos `.env` (não versionados)
   - Configure no servidor de produção

---

## 🔍 Troubleshooting

### Problema: "Unauthorized" ao usar o endpoint
**Solução:** Verifique se o secret está correto. O valor padrão é `EMERGENCY_RESET_2024`.

### Problema: "Root user not found"
**Solução:** O usuário root ainda não foi criado. Use a Opção 3 (criação inicial) com `ROOT_PASSWORD`.

### Problema: Backend não inicia após definir variável
**Solução:** Verifique se a variável está definida corretamente e se o backend tem permissão para acessá-la.

### Problema: Senha resetada mas login ainda não funciona
**Solução:** 
1. Verifique se o backend foi reiniciado (se usou variável de ambiente)
2. Confirme que está usando o username correto: `root`
3. Verifique os logs do backend para erros

---

## 📞 Informações de Contato do Sistema

- **Endpoint Base:** `http://localhost:8080/api/v1`
- **Endpoint de Emergência:** `/emergency/reset-root-password`
- **Endpoint de Login:** `/auth/login`
- **Username Padrão:** `root`

---

## 📅 Histórico de Alterações

- **2024-11-08:** Criação do documento e implementação do endpoint de emergência
- **2024-11-08:** Adição de recuperação de senha via WhatsApp para usuários normais

---

## ⚠️ AVISO FINAL

Este documento contém informações sensíveis sobre segurança do sistema. Mantenha-o em local seguro e não compartilhe publicamente em produção.

**Para produção:****
- Altere todos os secrets padrão
- Desabilite ou proteja adequadamente o endpoint de emergência
- Use apenas variáveis de ambiente para reset de senha
- Implemente auditoria/logging para rastrear resets de senha

---

**Documento criado em:** 2024-11-08  
**Versão:** 1.0

