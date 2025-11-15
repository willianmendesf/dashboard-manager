# Prompt para Implementação - Interface WhatsApp 1-1

## Contexto

Você precisa implementar uma interface web para conversas 1-1 (um-para-um) utilizando a API WhatsApp Web Multidevice. A API já está funcionando e disponibiliza endpoints HTTP REST para enviar e receber mensagens via WhatsApp Business.

## Objetivo

Criar uma aplicação frontend/backend que permita:
1. **Enviar mensagens** via WhatsApp através de uma interface web
2. **Receber mensagens** em tempo real e exibi-las na interface
3. **Listar conversas** e suas mensagens
4. **Interface web** onde usuários podem conversar com múltiplas pessoas

## Informações da API

### Base URL
```
http://localhost:3000
```
(ou a URL configurada do servidor)

### Autenticação
A API utiliza **Basic Authentication (HTTP Basic Auth)**:
- Header: `Authorization: Basic base64(usuario:senha)`
- Configurado no servidor: `--basic-auth=usuario:senha`

### Endpoints Essenciais

#### 1. Login e Status
- `GET /app/login` - Obter QR code para login (retorna `qr_link` e `qr_duration`)
- `GET /app/status` - Verificar status da conexão (retorna `is_connected`, `is_logged_in`)

#### 2. Listar Conversas
- `GET /chats?limit=50&offset=0&search=termo` - Lista todas as conversas
  - Retorna: Array de objetos `Chat` com `jid`, `name`, `last_message_time`
  - Paginação: `limit`, `offset`, `total`

#### 3. Obter Mensagens de uma Conversa
- `GET /chat/:chat_jid/messages?limit=100&offset=0`
  - `chat_jid`: JID do chat (ex: "5511999999999" ou "5511999999999@s.whatsapp.net")
  - Retorna: Array de objetos `Message` com `id`, `content`, `timestamp`, `is_from_me`, `media_type`, etc.

#### 4. Enviar Mensagens
- `POST /send/message` - Enviar texto
  - Body JSON: `{ "phone": "5511999999999", "message": "texto", "reply_message_id": "opcional" }`
  - Retorna: `{ "message_id": "...", "status": "..." }`

- `POST /send/image` - Enviar imagem
  - Form Data: `phone`, `image` (File), `caption` (opcional)

- `POST /send/file` - Enviar arquivo
  - Form Data: `phone`, `file` (File)

- `POST /send/audio` - Enviar áudio
  - Form Data: `phone`, `audio` (File)

- `POST /send/video` - Enviar vídeo
  - Form Data: `phone`, `video` (File), `caption` (opcional)

#### 5. Ações em Mensagens
- `POST /message/:message_id/read` - Marcar como lida
  - Body JSON: `{ "phone": "5511999999999" }`

### Formato de Dados

#### Número de Telefone
- Formato: Código do país + DDD + Número (sem espaços ou caracteres especiais)
- Exemplo: `5511999999999` (Brasil: 55, DDD: 11, Número: 999999999)

#### JID (Jabber ID)
- Formato completo: `5511999999999@s.whatsapp.net`
- Formato curto: `5511999999999` (aceito em alguns endpoints)

#### Estrutura de Mensagem
```typescript
{
  id: string;                    // ID único da mensagem
  chat_jid: string;              // JID do chat
  sender_jid: string;            // JID do remetente
  content: string;                // Conteúdo da mensagem (texto)
  timestamp: string;             // Data/hora (ISO 8601)
  is_from_me: boolean;           // true se foi enviada por mim
  media_type: string | null;     // 'image', 'video', 'audio', 'document', etc.
  filename: string | null;       // Nome do arquivo (se for mídia)
  url: string | null;            // URL do arquivo (se disponível)
  file_length: number;           // Tamanho do arquivo em bytes
}
```

#### Estrutura de Chat
```typescript
{
  jid: string;                   // JID do chat
  name: string;                   // Nome do contato/conversa
  last_message_time: string;      // Data da última mensagem (ISO 8601)
  ephemeral_expiration: number;  // Tempo de expiração (0 = permanente)
}
```

## Recebimento de Mensagens (Webhook)

A API envia mensagens recebidas via **webhook HTTP POST** para uma URL configurada.

### Configuração do Webhook
```bash
./whatsapp rest --webhook="https://seu-servidor.com/webhook"
```

### Segurança
- Header: `X-Hub-Signature-256` com assinatura HMAC SHA256
- Secret configurável: `--webhook-secret="seu-secret-key"`

### Payload do Webhook - Mensagem de Texto
```json
{
  "sender_id": "5511999999999",
  "chat_id": "5511999999999",
  "from": "5511999999999@s.whatsapp.net",
  "timestamp": "2023-10-15T10:30:00Z",
  "pushname": "João Silva",
  "message": {
    "text": "Olá! Como você está?",
    "id": "3EB0C127D7BACC83D6A1",
    "replied_id": "",
    "quoted_message": ""
  }
}
```

### Payload do Webhook - Mensagem com Imagem
```json
{
  "sender_id": "5511999999999",
  "chat_id": "5511999999999",
  "from": "5511999999999@s.whatsapp.net",
  "timestamp": "2023-10-15T11:05:51Z",
  "pushname": "João Silva",
  "message": {
    "text": "",
    "id": "3EB0C127D7BACC83D6A3",
    "replied_id": "",
    "quoted_message": ""
  },
  "image": {
    "media_path": "statics/media/1752404751-ad9e37ac-c658-4fe5-8d25-ba4a3f4d58fd.jpeg",
    "mime_type": "image/jpeg",
    "caption": "Minha foto"
  }
}
```

### Payload do Webhook - Mensagem com Arquivo
```json
{
  "sender_id": "5511999999999",
  "chat_id": "5511999999999",
  "from": "5511999999999@s.whatsapp.net",
  "timestamp": "2023-10-15T11:00:00Z",
  "pushname": "João Silva",
  "message": {
    "text": "",
    "id": "3EB0C127D7BACC83D6A4",
    "replied_id": "",
    "quoted_message": ""
  },
  "document": {
    "media_path": "statics/media/1752404965-b9393cd1-8546-4df9-8a60-ee3276036aba.pdf",
    "mime_type": "application/pdf",
    "caption": "Documento importante"
  }
}
```

### Payload do Webhook - Mensagem Revogada
```json
{
  "action": "message_revoked",
  "chat_id": "5511999999999",
  "from": "5511999999999@s.whatsapp.net",
  "revoked_message_id": "3EB0C127D7BACC83D6A1",
  "sender_id": "5511999999999",
  "timestamp": "2023-10-15T11:13:30Z"
}
```

### Payload do Webhook - Recebimento (Delivery/Read)
```json
{
  "event": "message.ack",
  "payload": {
    "chat_id": "5511999999999@s.whatsapp.net",
    "ids": ["3EB0C127D7BACC83D6A1"],
    "receipt_type": "read",
    "receipt_type_description": "the user opened the chat and saw the message."
  },
  "timestamp": "2023-10-15T22:44:44Z"
}
```

## Tarefas de Implementação

### Backend

1. **Criar endpoint de webhook** que:
   - Recebe POST do WhatsApp API
   - Valida assinatura HMAC SHA256
   - Processa diferentes tipos de mensagens (texto, imagem, arquivo, áudio, vídeo)
   - Salva mensagens no banco de dados
   - Notifica frontend via WebSocket ou Server-Sent Events

2. **Criar API proxy** (opcional) que:
   - Faz requisições para a API WhatsApp com autenticação
   - Adiciona camada de segurança adicional
   - Cache de dados se necessário

3. **Implementar WebSocket/SSE** para:
   - Notificar frontend sobre novas mensagens
   - Notificar sobre status de entrega/leitura
   - Notificar sobre mensagens revogadas

### Frontend

1. **Tela de Login**:
   - Fazer requisição para `/app/login`
   - Exibir QR code (`qr_link`)
   - Atualizar QR code a cada `qr_duration` segundos
   - Verificar status com `/app/status` até login ser concluído

2. **Lista de Conversas (Sidebar)**:
   - Fazer requisição para `/chats` periodicamente ou via WebSocket
   - Exibir nome, última mensagem, timestamp
   - Permitir busca
   - Destaque para conversas não lidas

3. **Área de Mensagens**:
   - Ao selecionar conversa, carregar mensagens via `/chat/:chat_jid/messages`
   - Exibir mensagens diferenciando enviadas (`is_from_me: true`) e recebidas
   - Suportar diferentes tipos de mídia (imagem, arquivo, áudio, vídeo)
   - Scroll infinito para carregar mais mensagens (pagination)
   - Atualizar em tempo real via WebSocket quando nova mensagem chegar

4. **Campo de Entrada**:
   - Input de texto
   - Botões para anexar: imagem, arquivo, áudio, vídeo
   - Botão de enviar
   - Enviar via `/send/message`, `/send/image`, `/send/file`, etc.

5. **Funcionalidades Adicionais**:
   - Marcar mensagens como lidas (`/message/:message_id/read`)
   - Indicador de digitação (opcional)
   - Status de entrega/leitura
   - Preview de mídia antes de enviar

## Fluxo de Dados

### Enviar Mensagem
```
Frontend → Backend → API WhatsApp → WhatsApp → Destinatário
```

### Receber Mensagem
```
WhatsApp → API WhatsApp → Webhook → Backend → WebSocket → Frontend
```

## Exemplo de Código - Cliente API

```javascript
class WhatsAppAPI {
  constructor(baseURL, username, password) {
    this.baseURL = baseURL;
    this.credentials = btoa(`${username}:${password}`);
  }
  
  async request(endpoint, options = {}) {
    const headers = {
      'Authorization': `Basic ${this.credentials}`,
      ...options.headers
    };
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    });
    
    return response.json();
  }
  
  async listChats(limit = 50, offset = 0) {
    return this.request(`/chats?limit=${limit}&offset=${offset}`);
  }
  
  async getChatMessages(chatJid, limit = 100, offset = 0) {
    const cleanJid = chatJid.replace('@s.whatsapp.net', '');
    return this.request(`/chat/${cleanJid}/messages?limit=${limit}&offset=${offset}`);
  }
  
  async sendText(phone, message) {
    return this.request('/send/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    });
  }
}
```

## Validação de Webhook (Node.js)

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  const receivedSignature = signature.replace('sha256=', '');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  );
}
```

## Estrutura de Resposta da API

Todas as respostas seguem o formato:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Mensagem de sucesso",
  "results": { /* dados */ }
}
```

## Considerações Importantes

1. **Formato de Telefone**: Sempre use formato internacional sem caracteres especiais (`5511999999999`)
2. **Autenticação**: Todas as requisições precisam do header `Authorization: Basic base64(usuario:senha)`
3. **Webhook**: Configure o webhook para receber mensagens em tempo real
4. **Conversas 1-1**: Para conversas individuais, `chat_jid` geralmente é o mesmo que `sender_jid`
5. **Mídia**: Arquivos de mídia são salvos no servidor da API, use a URL retornada
6. **Rate Limiting**: Respeite os limites da API do WhatsApp

## Documentação Completa

Para documentação detalhada com exemplos completos, veja: `docs/IMPLEMENTACAO_API_WHATSAPP.md`

