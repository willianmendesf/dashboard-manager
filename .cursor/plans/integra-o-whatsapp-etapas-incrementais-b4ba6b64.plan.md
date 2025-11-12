<!-- b4ba6b64-88f0-4cbf-ba8f-17625e394ab3 1db395ff-2464-4bda-9892-881e3580418a -->
# Plano de Implementação - Expansão da Integração WhatsApp

## Objetivo

Expandir a integração com a API externa de WhatsApp de forma gradual e incremental, adicionando:

1. Reconexão automática configurável
2. Login/Re-login via QR Code ou código de pareamento
3. Visualização de mensagens enviadas e recebidas

Cada etapa é **completamente funcional e entregável**, permitindo testes e validação antes de prosseguir.

---

## ETAPA 1: Reconexão Automática

### Objetivo

Implementar sistema de reconexão automática que monitora o status da conexão WhatsApp e reconecta automaticamente quando desconectado, com intervalo configurável.

### Arquivos a Modificar/Criar

#### Backend

**1. `WhatsappSenderService.java`** - Adicionar suporte a Basic Auth

- Adicionar método para obter credenciais Basic Auth do ConfigService (chaves: `WHATSAPP_API_USERNAME`, `WHATSAPP_API_PASSWORD`)
- Modificar `createRequestEntity` para incluir header Authorization quando credenciais estiverem configuradas
- Adicionar fallback para variáveis de ambiente se não estiver no banco

**2. `WhatsappConnectionService.java`** (NOVO)

- Serviço para gerenciar conexão e reconexão automática
- Métodos: `getStatus()`, `reconnect()`, `startAutoReconnect()`, `stopAutoReconnect()`
- Implementar scheduler com intervalo configurável (padrão: 60 minutos)
- Verificar status periodicamente e reconectar se desconectado
- Usar `@Scheduled` do Spring ou `ScheduledExecutorService`

**3. `WhatsappConnectionController.java`** (NOVO)

- Endpoints REST:
- `GET /whatsapp/connection/status` - Status da conexão
- `POST /whatsapp/connection/reconnect` - Reconexão manual
- `GET /whatsapp/connection/auto-reconnect/enabled` - Verificar se está ativo
- `POST /whatsapp/connection/auto-reconnect/toggle` - Ativar/desativar

**4. `ConfigService.java`** - Já existe, será usado para:

- `WHATSAPP_API_USERNAME` - Usuário Basic Auth
- `WHATSAPP_API_PASSWORD` - Senha Basic Auth (tipo PASSWORD)
- `WHATSAPP_AUTO_RECONNECT_ENABLED` - Boolean (padrão: true)
- `WHATSAPP_AUTO_RECONNECT_INTERVAL_MINUTES` - Integer (padrão: 60)

#### Frontend

**5. `whatsapp.component.ts`** - Adicionar seção de status e controle

- Propriedades: `connectionStatus`, `isAutoReconnectEnabled`, `lastReconnectAttempt`
- Métodos: `getConnectionStatus()`, `manualReconnect()`, `toggleAutoReconnect()`
- Exibir indicador visual de status (conectado/desconectado)
- Botão para reconexão manual
- Indicador de última tentativa de reconexão

**6. `whatsapp.html`** - Adicionar UI de status

- Card/Seção no topo da tela mostrando:
- Status da conexão (badge verde/vermelho)
- Última verificação
- Botão "Reconectar Agora"
- Toggle para ativar/desativar reconexão automática

**7. `whatsapp.service.ts`** (NOVO ou expandir existente)

- Métodos para chamar endpoints de conexão:
- `getConnectionStatus()`
- `reconnect()`
- `getAutoReconnectStatus()`
- `toggleAutoReconnect(enabled: boolean)`

**8. `settings.component.ts`** - Adicionar configurações

- Campos no formulário:
- `whatsappApiUsername` (text)
- `whatsappApiPassword` (password)
- `whatsappAutoReconnectEnabled` (checkbox)
- `whatsappAutoReconnectIntervalMinutes` (number, min: 1, max: 1440)

**9. `settings.component.html`** - Adicionar seção WhatsApp

- Nova seção "Configurações WhatsApp" com os campos acima
- Help text explicando cada configuração

### Entregáveis da Etapa 1

- ✅ Sistema de reconexão automática funcionando
- ✅ Configuração de credenciais Basic Auth no banco
- ✅ Intervalo de reconexão configurável (padrão: 60 minutos)
- ✅ Interface para visualizar status e controlar reconexão
- ✅ Configurações na tela de Settings

---

## ETAPA 2: Login/Re-login (QR Code e Código)

### Objetivo

Permitir login/re-login na API WhatsApp diretamente do sistema, via QR Code ou código de pareamento, sem precisar acessar a API externa.

### Arquivos a Modificar/Criar

#### Backend

**10. `WhatsappAuthService.java`** (NOVO)

- Métodos:
- `initLogin()` - Inicia login e retorna QR code
- `initLoginWithCode(phone)` - Inicia login com código de pareamento
- `getLoginStatus()` - Verifica se login foi concluído
- `logout()` - Faz logout da API

**11. `WhatsappAuthController.java`** (NOVO)

- Endpoints:
- `GET /whatsapp/auth/login/qrcode` - Obter QR code para login
- `GET /whatsapp/auth/login/with-code?phone={phone}` - Iniciar login com código
- `GET /whatsapp/auth/login/status` - Status do login (polling)
- `POST /whatsapp/auth/logout` - Fazer logout

**12. `WhatsappSenderService.java`** - Expandir

- Adicionar método para fazer requisições GET (para login/status)
- Melhorar tratamento de erros de autenticação

#### Frontend

**13. `whatsapp-login-modal.component.ts`** (NOVO)

- Componente modal para login
- Propriedades: `loginMethod: 'qrcode' | 'code'`, `phoneNumber`
- Métodos: `initQRCodeLogin()`, `initCodeLogin()`, `checkLoginStatus()`, `close()`
- Polling para verificar se login foi concluído (intervalo: 3 segundos)
- Exibir QR code ou código de pareamento conforme método

**14. `whatsapp-login-modal.component.html`** (NOVO)

- Modal com duas abas: "QR Code" e "Código de Pareamento"
- Aba QR Code: Exibir imagem do QR code, instruções, botão "Atualizar QR"
- Aba Código: Input para número de telefone, botão "Gerar Código", exibir código gerado
- Indicador de loading e status

**15. `whatsapp.component.ts`** - Integrar modal de login

- Adicionar método `openLoginModal()`
- Verificar status de conexão ao carregar componente
- Se desconectado, oferecer opção de fazer login
- Botão "Fazer Login" na seção de status

**16. `whatsapp.component.html`** - Adicionar botão de login

- Botão "Fazer Login" quando desconectado
- Integrar modal de login

**17. `whatsapp.service.ts`** - Adicionar métodos de autenticação

- `getQRCodeLogin()` - Obter URL do QR code
- `initCodeLogin(phone: string)` - Iniciar login com código
- `getLoginStatus()` - Verificar status do login
- `logout()` - Fazer logout

### Entregáveis da Etapa 2

- ✅ Modal de login com QR Code funcional
- ✅ Login via código de pareamento funcional
- ✅ Polling automático para verificar conclusão do login
- ✅ Integração com status de conexão
- ✅ Botão de logout funcional

---

## ETAPA 3: Visualização de Mensagens

### Objetivo

Exibir histórico de mensagens (enviadas e recebidas) quando um contato ou grupo é selecionado na tela WhatsApp.

### Arquivos a Modificar/Criar

#### Backend

**18. `WhatsappMessageService.java`** - Melhorar método `getHistory()`

- Expandir para retornar mais informações (timestamp, tipo de mídia, etc.)
- Adicionar paginação (limit/offset)
- Filtrar por tipo de mensagem se necessário

**19. `WhatsappMessageController.java`** - Expandir endpoint

- Melhorar `GET /whatsapp/history/{jid}` para aceitar query params:
- `limit` (opcional, padrão: 50)
- `offset` (opcional, padrão: 0)
- `is_from_me` (opcional, boolean) - filtrar apenas enviadas/recebidas

#### Frontend

**20. `whatsapp-messages.component.ts`** (NOVO)

- Componente para exibir lista de mensagens
- Propriedades: `messages: Message[]`, `selectedRecipient`
- Métodos: `loadMessages()`, `loadMoreMessages()`, `formatTimestamp()`
- Scroll infinito para carregar mais mensagens
- Diferenciação visual entre mensagens enviadas/recebidas

**21. `whatsapp-messages.component.html`** (NOVO)

- Lista de mensagens com layout tipo chat
- Mensagens enviadas: alinhadas à direita, cor diferente
- Mensagens recebidas: alinhadas à esquerda
- Exibir timestamp, conteúdo, tipo de mídia (se houver)
- Loading indicator ao carregar mais

**22. `whatsapp-messages.component.scss`** (NOVO)

- Estilos para chat layout
- Diferenciação visual entre mensagens enviadas/recebidas
- Responsividade

**23. `whatsapp.component.ts`** - Integrar componente de mensagens

- Modificar `selectContact()` e `selectGroup()` para carregar mensagens
- Adicionar método `loadMessagesForRecipient()`
- Gerenciar estado de mensagens carregadas

**24. `whatsapp.component.html`** - Adicionar área de mensagens

- Adicionar seção para exibir mensagens quando um contato/grupo é selecionado
- Integrar `whatsapp-messages` component
- Layout: sidebar (contatos/grupos) + área de mensagens

**25. `whatsapp.service.ts`** - Adicionar método

- `getMessages(jid: string, limit?: number, offset?: number)` - Buscar mensagens

### Entregáveis da Etapa 3

- ✅ Visualização de mensagens ao selecionar contato/grupo
- ✅ Diferenciação visual entre mensagens enviadas/recebidas
- ✅ Scroll infinito para carregar histórico
- ✅ Formatação adequada de timestamps
- ✅ Suporte a diferentes tipos de mídia (texto, imagem, etc.)

---

## Configurações no Banco de Dados

As seguintes chaves serão criadas/atualizadas no `SystemConfiguration`:

1. `WHATSAPP_API_USERNAME` - Usuário Basic Auth (STRING)
2. `WHATSAPP_API_PASSWORD` - Senha Basic Auth (PASSWORD)
3. `WHATSAPP_AUTO_RECONNECT_ENABLED` - Ativar reconexão automática (BOOLEAN, padrão: true)
4. `WHATSAPP_AUTO_RECONNECT_INTERVAL_MINUTES` - Intervalo em minutos (INTEGER, padrão: 60)

---

## Ordem de Execução

1. **ETAPA 1** - Implementar completamente e testar
2. **ETAPA 2** - Implementar completamente e testar (após validar Etapa 1)
3. **ETAPA 3** - Implementar completamente e testar (após validar Etapa 2)

Cada etapa deve ser **completamente funcional** antes de prosseguir para a próxima.

### To-dos

- [ ] Backend: Adicionar suporte a Basic Auth no WhatsappSenderService (obter credenciais do ConfigService com fallback para env)
- [ ] Backend: Criar WhatsappConnectionService com reconexão automática e scheduler configurável
- [ ] Backend: Criar WhatsappConnectionController com endpoints de status e reconexão
- [ ] Frontend: Criar/expandir whatsapp.service.ts com métodos de conexão
- [ ] Frontend: Adicionar UI de status de conexão e controles na tela WhatsApp
- [ ] Frontend: Adicionar configurações de WhatsApp na tela Settings (credenciais, intervalo, toggle)
- [ ] Backend: Criar WhatsappAuthService com métodos de login (QR code e código de pareamento)
- [ ] Backend: Criar WhatsappAuthController com endpoints de autenticação
- [ ] Frontend: Criar componente whatsapp-login-modal com suporte a QR code e código de pareamento
- [ ] Frontend: Integrar modal de login na tela WhatsApp com verificação de status
- [ ] Backend: Melhorar método getHistory() com paginação e filtros
- [ ] Frontend: Criar componente whatsapp-messages para exibir histórico de mensagens
- [ ] Frontend: Integrar componente de mensagens na tela WhatsApp ao selecionar contato/grupo