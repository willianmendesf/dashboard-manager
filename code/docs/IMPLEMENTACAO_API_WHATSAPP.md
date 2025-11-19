# Documentação de Implementação - API WhatsApp Web Multidevice

## Visão Geral

Esta documentação descreve como implementar uma interface web para conversas 1-1 (um-para-um) utilizando a API WhatsApp Web Multidevice. A API permite enviar e receber mensagens via WhatsApp através de endpoints HTTP REST, ideal para criar uma interface web onde usuários podem conversar com múltiplas pessoas através de um WhatsApp Business.

## Índice

1. [Autenticação](#autenticação)
2. [Configuração Inicial](#configuração-inicial)
3. [Endpoints Principais para Conversas 1-1](#endpoints-principais-para-conversas-1-1)
4. [Enviar Mensagens](#enviar-mensagens)
5. [Receber Mensagens (Webhook)](#receber-mensagens-webhook)
6. [Listar Conversas e Mensagens](#listar-conversas-e-mensagens)
7. [Estrutura de Dados](#estrutura-de-dados)
8. [Exemplos de Implementação](#exemplos-de-implementação)
9. [Interface Web - Fluxo Completo](#interface-web---fluxo-completo)

---

## Autenticação

A API utiliza **Basic Authentication** (HTTP Basic Auth). Todas as requisições devem incluir o header de autenticação.

### Configuração da Autenticação

A autenticação é configurada ao iniciar o servidor:

```bash
./whatsapp rest --basic-auth=usuario:senha
```

Ou via variável de ambiente:
```bash
APP_BASIC_AUTH=usuario:senha
```

### Uso da Autenticação nas Requisições

Todas as requisições HTTP devem incluir o header `Authorization`:

```
Authorization: Basic base64(usuario:senha)
```

**Exemplo em JavaScript:**
```javascript
const username = 'usuario';
const password = 'senha';
const credentials = btoa(`${username}:${password}`);

fetch('http://localhost:3000/chats', {
  headers: {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Configuração Inicial

### 1. Login no WhatsApp

Antes de usar a API, é necessário fazer login no WhatsApp. Existem duas formas:

#### Opção A: Login com QR Code

**Endpoint:** `GET /app/login`

**Resposta:**
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Login success",
  "results": {
    "qr_link": "http://localhost:3000/statics/qrcode/qrcode.png",
    "qr_duration": 30
  }
}
```

**Implementação:**
1. Fazer requisição para `/app/login`
2. Obter a URL do QR code (`qr_link`)
3. Exibir o QR code na interface
4. Atualizar a imagem a cada `qr_duration` segundos até o login ser concluído
5. Verificar status da conexão com `GET /app/status`

#### Opção B: Login com Código de Pareamento

**Endpoint:** `GET /app/login-with-code?phone=5511999999999`

**Resposta:**
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Login with code success",
  "results": {
    "pair_code": "ABC-DEF-GHI"
  }
}
```

### 2. Verificar Status da Conexão

**Endpoint:** `GET /app/status`

**Resposta:**
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Connection status retrieved",
  "results": {
    "is_connected": true,
    "is_logged_in": true,
    "device_id": "device123"
  }
}
```

---

## Endpoints Principais para Conversas 1-1

### Base URL
```
http://localhost:3000
```
(ou a URL configurada do servidor)

### Endpoints Essenciais

| Funcionalidade | Método | Endpoint | Descrição |
|----------------|--------|-----------|-----------|
| Login | GET | `/app/login` | Obter QR code para login |
| Status | GET | `/app/status` | Verificar status da conexão |
| Listar Chats | GET | `/chats` | Listar todas as conversas |
| Mensagens do Chat | GET | `/chat/:chat_jid/messages` | Obter mensagens de uma conversa |
| Enviar Texto | POST | `/send/message` | Enviar mensagem de texto |
| Enviar Imagem | POST | `/send/image` | Enviar imagem |
| Enviar Arquivo | POST | `/send/file` | Enviar arquivo/documento |
| Enviar Áudio | POST | `/send/audio` | Enviar áudio |
| Enviar Vídeo | POST | `/send/video` | Enviar vídeo |
| Marcar como Lida | POST | `/message/:message_id/read` | Marcar mensagem como lida |

---

## Enviar Mensagens

### 1. Enviar Mensagem de Texto

**Endpoint:** `POST /send/message`

**Headers:**
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "phone": "5511999999999",
  "message": "Olá! Como posso ajudar?",
  "reply_message_id": "3EB0C127D7BACC83D6A1"
}
```

**Campos:**
- `phone` (obrigatório): Número de telefone do destinatário (formato: código do país + DDD + número, sem espaços ou caracteres especiais)
- `message` (obrigatório): Texto da mensagem
- `reply_message_id` (opcional): ID da mensagem que está sendo respondida

**Resposta de Sucesso:**
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Message sent successfully",
  "results": {
    "message_id": "3EB0C127D7BACC83D6A2",
    "status": "Message sent successfully"
  }
}
```

**Exemplo JavaScript:**
```javascript
async function enviarMensagemTexto(phone, message, replyMessageId = null) {
  const response = await fetch('http://localhost:3000/send/message', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: phone,
      message: message,
      reply_message_id: replyMessageId
    })
  });
  
  const data = await response.json();
  return data.results;
}
```

### 2. Enviar Imagem

**Endpoint:** `POST /send/image`

**Headers:**
```
Authorization: Basic base64(usuario:senha)
Content-Type: multipart/form-data
```

**Body (Form Data):**
- `phone`: Número do destinatário (ex: "5511999999999")
- `image`: Arquivo de imagem (File)
- `caption`: Legenda da imagem (opcional)
- `view_once`: Boolean, se true envia como "visualização única" (opcional)

**Exemplo JavaScript:**
```javascript
async function enviarImagem(phone, imageFile, caption = '') {
  const formData = new FormData();
  formData.append('phone', phone);
  formData.append('image', imageFile);
  formData.append('caption', caption);
  
  const response = await fetch('http://localhost:3000/send/image', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`
    },
    body: formData
  });
  
  const data = await response.json();
  return data.results;
}
```

### 3. Enviar Arquivo/Documento

**Endpoint:** `POST /send/file`

**Body (Form Data):**
- `phone`: Número do destinatário
- `file`: Arquivo a ser enviado (File)

**Exemplo JavaScript:**
```javascript
async function enviarArquivo(phone, file) {
  const formData = new FormData();
  formData.append('phone', phone);
  formData.append('file', file);
  
  const response = await fetch('http://localhost:3000/send/file', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`
    },
    body: formData
  });
  
  const data = await response.json();
  return data.results;
}
```

### 4. Enviar Áudio

**Endpoint:** `POST /send/audio`

**Body (Form Data):**
- `phone`: Número do destinatário
- `audio`: Arquivo de áudio (File)

**Exemplo JavaScript:**
```javascript
async function enviarAudio(phone, audioFile) {
  const formData = new FormData();
  formData.append('phone', audioFile);
  formData.append('audio', audioFile);
  
  const response = await fetch('http://localhost:3000/send/audio', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`
    },
    body: formData
  });
  
  const data = await response.json();
  return data.results;
}
```

### 5. Enviar Vídeo

**Endpoint:** `POST /send/video`

**Body (Form Data):**
- `phone`: Número do destinatário
- `video`: Arquivo de vídeo (File)
- `caption`: Legenda do vídeo (opcional)

**Exemplo JavaScript:**
```javascript
async function enviarVideo(phone, videoFile, caption = '') {
  const formData = new FormData();
  formData.append('phone', phone);
  formData.append('video', videoFile);
  formData.append('caption', caption);
  
  const response = await fetch('http://localhost:3000/send/video', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`
    },
    body: formData
  });
  
  const data = await response.json();
  return data.results;
}
```

### 6. Enviar Contato

**Endpoint:** `POST /send/contact`

**Body (JSON):**
```json
{
  "phone": "5511999999999",
  "contact_name": "João Silva",
  "contact_phone": "5511888888888"
}
```

### 7. Enviar Localização

**Endpoint:** `POST /send/location`

**Body (JSON):**
```json
{
  "phone": "5511999999999",
  "latitude": "-23.5505",
  "longitude": "-46.6333"
}
```

### 8. Marcar Mensagem como Lida

**Endpoint:** `POST /message/:message_id/read`

**Body (JSON):**
```json
{
  "phone": "5511999999999"
}
```

**Exemplo JavaScript:**
```javascript
async function marcarComoLida(messageId, phone) {
  const response = await fetch(`http://localhost:3000/message/${messageId}/read`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone: phone })
  });
  
  const data = await response.json();
  return data;
}
```

---

## Receber Mensagens (Webhook)

Para receber mensagens em tempo real, você precisa configurar um **webhook**. A API enviará uma requisição HTTP POST para a URL configurada sempre que uma mensagem for recebida.

### Configuração do Webhook

Ao iniciar o servidor, configure o webhook:

```bash
./whatsapp rest --webhook="https://seu-servidor.com/webhook"
```

Ou via variável de ambiente:
```bash
WHATSAPP_WEBHOOK=https://seu-servidor.com/webhook
```

### Segurança do Webhook

A API envia um header `X-Hub-Signature-256` com assinatura HMAC SHA256 para validação:

**Configuração do Secret:**
```bash
./whatsapp rest --webhook-secret="seu-secret-key"
```

**Validação do Webhook (Node.js/Express):**
```javascript
const crypto = require('crypto');
const express = require('express');
const app = express();

app.use(express.raw({ type: 'application/json' }));

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

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = req.body;
  const secret = 'seu-secret-key'; // Mesmo secret configurado na API
  
  // Verificar assinatura
  if (!verifyWebhookSignature(payload, signature, secret)) {
    return res.status(401).send('Unauthorized');
  }
  
  // Processar webhook
  const data = JSON.parse(payload);
  console.log('Mensagem recebida:', data);
  
  res.status(200).send('OK');
});
```

### Estrutura do Payload do Webhook

#### Mensagem de Texto Recebida

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

#### Mensagem com Resposta (Reply)

```json
{
  "sender_id": "5511999999999",
  "chat_id": "5511999999999",
  "from": "5511999999999@s.whatsapp.net",
  "timestamp": "2023-10-15T10:35:00Z",
  "pushname": "João Silva",
  "message": {
    "text": "Estou bem, obrigado!",
    "id": "3EB0C127D7BACC83D6A2",
    "replied_id": "3EB0C127D7BACC83D6A1",
    "quoted_message": "Olá! Como você está?"
  }
}
```

#### Mensagem com Imagem

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

#### Mensagem com Arquivo/Documento

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

#### Mensagem com Áudio

```json
{
  "sender_id": "5511999999999",
  "chat_id": "5511999999999",
  "from": "5511999999999@s.whatsapp.net",
  "timestamp": "2023-10-15T10:55:00Z",
  "pushname": "João Silva",
  "message": {
    "text": "",
    "id": "3EB0C127D7BACC83D6A5",
    "replied_id": "",
    "quoted_message": ""
  },
  "audio": {
    "media_path": "statics/media/1752404905-b9393cd1-8546-4df9-8a60-ee3276036aba.ogg",
    "mime_type": "audio/ogg",
    "caption": ""
  }
}
```

#### Mensagem Revogada (Apagada)

```json
{
  "action": "message_revoked",
  "chat_id": "5511999999999",
  "from": "5511999999999@s.whatsapp.net",
  "revoked_chat": "5511999999999@s.whatsapp.net",
  "revoked_from_me": false,
  "revoked_message_id": "3EB0C127D7BACC83D6A1",
  "sender_id": "5511999999999",
  "timestamp": "2023-10-15T11:13:30Z"
}
```

#### Recebimento de Mensagem (Delivery/Read Receipt)

```json
{
  "event": "message.ack",
  "payload": {
    "chat_id": "5511999999999@s.whatsapp.net",
    "from": "5511999999999@s.whatsapp.net",
    "ids": ["3EB0C127D7BACC83D6A1"],
    "receipt_type": "read",
    "receipt_type_description": "the user opened the chat and saw the message.",
    "sender_id": "5511999999999@s.whatsapp.net"
  },
  "timestamp": "2023-10-15T22:44:44Z"
}
```

**Tipos de `receipt_type`:**
- `"delivered"`: Mensagem entregue no dispositivo
- `"read"`: Mensagem lida pelo usuário

### Processamento do Webhook no Backend

**Exemplo completo (Node.js/Express):**
```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.raw({ type: 'application/json' }));

const WEBHOOK_SECRET = 'seu-secret-key';

function verifyWebhookSignature(payload, signature, secret) {
  if (!signature) return false;
  
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

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = req.body;
  
  // Verificar assinatura
  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    console.error('Webhook signature verification failed');
    return res.status(401).send('Unauthorized');
  }
  
  try {
    const data = JSON.parse(payload);
    
    // Processar diferentes tipos de eventos
    if (data.event === 'message.ack') {
      // Recebimento de confirmação (delivered/read)
      handleMessageReceipt(data);
    } else if (data.action === 'message_revoked') {
      // Mensagem foi apagada
      handleMessageRevoked(data);
    } else if (data.message) {
      // Nova mensagem recebida
      handleNewMessage(data);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

function handleNewMessage(data) {
  const {
    sender_id,
    chat_id,
    from,
    timestamp,
    pushname,
    message,
    image,
    document,
    audio,
    video,
    location,
    contact
  } = data;
  
  // Extrair informações da mensagem
  const messageData = {
    id: message.id,
    chatJid: chat_id,
    senderJid: sender_id,
    senderName: pushname,
    text: message.text,
    timestamp: timestamp,
    isFromMe: false, // Mensagem recebida
    mediaType: null,
    mediaPath: null
  };
  
  // Verificar tipo de mídia
  if (image) {
    messageData.mediaType = 'image';
    messageData.mediaPath = image.media_path;
    messageData.caption = image.caption;
  } else if (document) {
    messageData.mediaType = 'document';
    messageData.mediaPath = document.media_path;
    messageData.caption = document.caption;
  } else if (audio) {
    messageData.mediaType = 'audio';
    messageData.mediaPath = audio.media_path;
  } else if (video) {
    messageData.mediaType = 'video';
    messageData.mediaPath = video.media_path;
    messageData.caption = video.caption;
  } else if (location) {
    messageData.mediaType = 'location';
    messageData.latitude = location.degreesLatitude;
    messageData.longitude = location.degreesLongitude;
  } else if (contact) {
    messageData.mediaType = 'contact';
    messageData.contact = contact;
  }
  
  // Verificar se é resposta
  if (message.replied_id) {
    messageData.replyToMessageId = message.replied_id;
    messageData.quotedMessage = message.quoted_message;
  }
  
  // Salvar no banco de dados
  saveMessageToDatabase(messageData);
  
  // Enviar para frontend via WebSocket ou Server-Sent Events
  broadcastToFrontend(messageData);
}

function handleMessageReceipt(data) {
  const { payload } = data;
  const { chat_id, ids, receipt_type } = payload;
  
  // Atualizar status das mensagens no banco
  updateMessageStatus(chat_id, ids, receipt_type);
  
  // Notificar frontend
  broadcastReceiptUpdate(chat_id, ids, receipt_type);
}

function handleMessageRevoked(data) {
  const { revoked_message_id, chat_id } = data;
  
  // Marcar mensagem como revogada no banco
  markMessageAsRevoked(chat_id, revoked_message_id);
  
  // Notificar frontend
  broadcastMessageRevoked(chat_id, revoked_message_id);
}

app.listen(3001, () => {
  console.log('Webhook server listening on port 3001');
});
```

---

## Listar Conversas e Mensagens

### 1. Listar Todas as Conversas

**Endpoint:** `GET /chats`

**Query Parameters:**
- `limit` (opcional): Número máximo de resultados (padrão: 25)
- `offset` (opcional): Número de resultados para pular (padrão: 0)
- `search` (opcional): Buscar conversas por nome
- `has_media` (opcional): Filtrar conversas que têm mídia (true/false)

**Exemplo:**
```
GET /chats?limit=50&offset=0&search=João
```

**Resposta:**
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success get chat list",
  "results": {
    "data": [
      {
        "jid": "5511999999999@s.whatsapp.net",
        "name": "João Silva",
        "last_message_time": "2023-10-15T10:35:00Z",
        "ephemeral_expiration": 0,
        "created_at": "2023-10-01T08:00:00Z",
        "updated_at": "2023-10-15T10:35:00Z"
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 100
    }
  }
}
```

**Exemplo JavaScript:**
```javascript
async function listarConversas(limit = 50, offset = 0, search = '') {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    search: search
  });
  
  const response = await fetch(`http://localhost:3000/chats?${params}`, {
    headers: {
      'Authorization': `Basic ${credentials}`
    }
  });
  
  const data = await response.json();
  return data.results;
}
```

### 2. Obter Mensagens de uma Conversa

**Endpoint:** `GET /chat/:chat_jid/messages`

**Path Parameters:**
- `chat_jid`: JID do chat (ex: "5511999999999@s.whatsapp.net" ou apenas "5511999999999")

**Query Parameters:**
- `limit` (opcional): Número máximo de mensagens (padrão: 50)
- `offset` (opcional): Número de mensagens para pular (padrão: 0)
- `media_only` (opcional): Retornar apenas mensagens com mídia (true/false)
- `search` (opcional): Buscar mensagens por conteúdo
- `start_time` (opcional): Filtrar mensagens a partir desta data (formato ISO 8601)
- `end_time` (opcional): Filtrar mensagens até esta data (formato ISO 8601)
- `is_from_me` (opcional): Filtrar apenas mensagens enviadas por mim (true/false)

**Exemplo:**
```
GET /chat/5511999999999/messages?limit=100&offset=0
```

**Resposta:**
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success get chat messages",
  "results": {
    "data": [
      {
        "id": "3EB0C127D7BACC83D6A1",
        "chat_jid": "5511999999999@s.whatsapp.net",
        "sender_jid": "5511999999999@s.whatsapp.net",
        "content": "Olá! Como você está?",
        "timestamp": "2023-10-15T10:30:00Z",
        "is_from_me": false,
        "media_type": null,
        "filename": null,
        "url": null,
        "file_length": 0,
        "created_at": "2023-10-15T10:30:00Z",
        "updated_at": "2023-10-15T10:30:00Z"
      },
      {
        "id": "3EB0C127D7BACC83D6A2",
        "chat_jid": "5511999999999@s.whatsapp.net",
        "sender_jid": "5511888888888@s.whatsapp.net",
        "content": "Estou bem, obrigado!",
        "timestamp": "2023-10-15T10:35:00Z",
        "is_from_me": true,
        "media_type": null,
        "filename": null,
        "url": null,
        "file_length": 0,
        "created_at": "2023-10-15T10:35:00Z",
        "updated_at": "2023-10-15T10:35:00Z"
      }
    ],
    "pagination": {
      "limit": 100,
      "offset": 0,
      "total": 250
    },
    "chat_info": {
      "jid": "5511999999999@s.whatsapp.net",
      "name": "João Silva",
      "last_message_time": "2023-10-15T10:35:00Z",
      "ephemeral_expiration": 0,
      "created_at": "2023-10-01T08:00:00Z",
      "updated_at": "2023-10-15T10:35:00Z"
    }
  }
}
```

**Exemplo JavaScript:**
```javascript
async function obterMensagens(chatJid, limit = 100, offset = 0) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  });
  
  // Remover @s.whatsapp.net se presente
  const cleanJid = chatJid.replace('@s.whatsapp.net', '');
  
  const response = await fetch(
    `http://localhost:3000/chat/${cleanJid}/messages?${params}`,
    {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    }
  );
  
  const data = await response.json();
  return data.results;
}
```

---

## Estrutura de Dados

### Formato de Número de Telefone

O número de telefone deve estar no formato:
- **Código do país + DDD + Número** (sem espaços, parênteses, hífens)
- Exemplo: `5511999999999` (Brasil: 55, DDD: 11, Número: 999999999)

### JID (Jabber ID)

O JID é o identificador único de um chat ou usuário no WhatsApp:
- **Formato completo:** `5511999999999@s.whatsapp.net`
- **Formato curto:** `5511999999999` (aceito em alguns endpoints)

### Estrutura de Mensagem

```typescript
interface Message {
  id: string;                    // ID único da mensagem
  chat_jid: string;              // JID do chat
  sender_jid: string;            // JID do remetente
  content: string;                // Conteúdo da mensagem (texto)
  timestamp: string;             // Data/hora (ISO 8601)
  is_from_me: boolean;           // true se foi enviada por mim
  media_type: string | null;     // Tipo de mídia: 'image', 'video', 'audio', 'document', etc.
  filename: string | null;       // Nome do arquivo (se for mídia)
  url: string | null;            // URL do arquivo (se disponível)
  file_length: number;           // Tamanho do arquivo em bytes
  created_at: string;            // Data de criação (ISO 8601)
  updated_at: string;            // Data de atualização (ISO 8601)
}
```

### Estrutura de Chat

```typescript
interface Chat {
  jid: string;                   // JID do chat
  name: string;                   // Nome do contato/conversa
  last_message_time: string;      // Data da última mensagem (ISO 8601)
  ephemeral_expiration: number;  // Tempo de expiração (0 = permanente)
  created_at: string;            // Data de criação (ISO 8601)
  updated_at: string;            // Data de atualização (ISO 8601)
}
```

---

## Exemplos de Implementação

### Cliente JavaScript Completo

```javascript
class WhatsAppAPI {
  constructor(baseURL, username, password) {
    this.baseURL = baseURL;
    this.credentials = btoa(`${username}:${password}`);
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Basic ${this.credentials}`,
      ...options.headers
    };
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    return response.json();
  }
  
  // Login
  async login() {
    return this.request('/app/login');
  }
  
  async getStatus() {
    return this.request('/app/status');
  }
  
  // Chats
  async listChats(limit = 50, offset = 0, search = '') {
    const params = new URLSearchParams({ limit, offset, search });
    return this.request(`/chats?${params}`);
  }
  
  async getChatMessages(chatJid, limit = 100, offset = 0) {
    const cleanJid = chatJid.replace('@s.whatsapp.net', '');
    const params = new URLSearchParams({ limit, offset });
    return this.request(`/chat/${cleanJid}/messages?${params}`);
  }
  
  // Enviar mensagens
  async sendText(phone, message, replyMessageId = null) {
    const body = { phone, message };
    if (replyMessageId) body.reply_message_id = replyMessageId;
    
    return this.request('/send/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }
  
  async sendImage(phone, imageFile, caption = '') {
    const formData = new FormData();
    formData.append('phone', phone);
    formData.append('image', imageFile);
    formData.append('caption', caption);
    
    return this.request('/send/image', {
      method: 'POST',
      body: formData
    });
  }
  
  async sendFile(phone, file) {
    const formData = new FormData();
    formData.append('phone', phone);
    formData.append('file', file);
    
    return this.request('/send/file', {
      method: 'POST',
      body: formData
    });
  }
  
  async markAsRead(messageId, phone) {
    return this.request(`/message/${messageId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
  }
}

// Uso
const api = new WhatsAppAPI('http://localhost:3000', 'usuario', 'senha');

// Listar conversas
const chats = await api.listChats(50, 0);
console.log('Conversas:', chats.results.data);

// Obter mensagens de uma conversa
const messages = await api.getChatMessages('5511999999999', 100, 0);
console.log('Mensagens:', messages.results.data);

// Enviar mensagem
const result = await api.sendText('5511999999999', 'Olá!');
console.log('Mensagem enviada:', result.results);
```

---

## Interface Web - Fluxo Completo

### 1. Estrutura da Interface

A interface web deve ter:

1. **Lista de Conversas (Sidebar)**
   - Lista todas as conversas
   - Mostra nome, última mensagem e timestamp
   - Permite buscar conversas

2. **Área de Mensagens (Centro)**
   - Exibe mensagens da conversa selecionada
   - Diferencia mensagens enviadas/recebidas
   - Suporta diferentes tipos de mídia
   - Scroll infinito para carregar mais mensagens

3. **Campo de Entrada (Bottom)**
   - Input de texto
   - Botões para anexar arquivos, imagens, etc.
   - Botão de enviar

### 2. Fluxo de Implementação

#### Passo 1: Login e Verificação de Status

```javascript
async function inicializarApp() {
  const api = new WhatsAppAPI('http://localhost:3000', 'usuario', 'senha');
  
  // Verificar status
  const status = await api.getStatus();
  
  if (!status.results.is_logged_in) {
    // Fazer login
    const login = await api.login();
    mostrarQRCode(login.results.qr_link);
    
    // Polling para verificar login
    const interval = setInterval(async () => {
      const newStatus = await api.getStatus();
      if (newStatus.results.is_logged_in) {
        clearInterval(interval);
        esconderQRCode();
        carregarConversas();
      }
    }, 3000);
  } else {
    carregarConversas();
  }
}
```

#### Passo 2: Carregar Lista de Conversas

```javascript
let conversas = [];

async function carregarConversas() {
  const response = await api.listChats(50, 0);
  conversas = response.results.data;
  renderizarListaConversas(conversas);
}

function renderizarListaConversas(conversas) {
  const lista = document.getElementById('lista-conversas');
  lista.innerHTML = '';
  
  conversas.forEach(chat => {
    const item = document.createElement('div');
    item.className = 'conversa-item';
    item.onclick = () => selecionarConversa(chat.jid);
    
    item.innerHTML = `
      <div class="conversa-nome">${chat.name}</div>
      <div class="conversa-ultima-mensagem">${formatarData(chat.last_message_time)}</div>
    `;
    
    lista.appendChild(item);
  });
}
```

#### Passo 3: Carregar Mensagens de uma Conversa

```javascript
let mensagensAtuais = [];
let chatSelecionado = null;

async function selecionarConversa(chatJid) {
  chatSelecionado = chatJid;
  await carregarMensagens(chatJid);
}

async function carregarMensagens(chatJid, offset = 0) {
  const response = await api.getChatMessages(chatJid, 100, offset);
  const novasMensagens = response.results.data.reverse(); // Mais antigas primeiro
  
  if (offset === 0) {
    mensagensAtuais = novasMensagens;
  } else {
    mensagensAtuais = [...novasMensagens, ...mensagensAtuais];
  }
  
  renderizarMensagens(mensagensAtuais);
}

function renderizarMensagens(mensagens) {
  const container = document.getElementById('mensagens-container');
  container.innerHTML = '';
  
  mensagens.forEach(msg => {
    const elemento = criarElementoMensagem(msg);
    container.appendChild(elemento);
  });
  
  // Scroll para o final
  container.scrollTop = container.scrollHeight;
}

function criarElementoMensagem(msg) {
  const div = document.createElement('div');
  div.className = `mensagem ${msg.is_from_me ? 'enviada' : 'recebida'}`;
  
  let conteudo = '';
  
  if (msg.media_type === 'image') {
    conteudo = `<img src="${msg.url || msg.media_path}" alt="Imagem" />`;
  } else if (msg.media_type === 'document') {
    conteudo = `<a href="${msg.url}" download>📎 ${msg.filename}</a>`;
  } else {
    conteudo = `<p>${msg.content}</p>`;
  }
  
  div.innerHTML = `
    <div class="mensagem-conteudo">${conteudo}</div>
    <div class="mensagem-timestamp">${formatarData(msg.timestamp)}</div>
  `;
  
  return div;
}
```

#### Passo 4: Enviar Mensagem

```javascript
async function enviarMensagem() {
  const input = document.getElementById('input-mensagem');
  const texto = input.value.trim();
  
  if (!texto || !chatSelecionado) return;
  
  // Limpar input
  input.value = '';
  
  // Enviar via API
  const cleanJid = chatSelecionado.replace('@s.whatsapp.net', '');
  const resultado = await api.sendText(cleanJid, texto);
  
  // Recarregar mensagens para mostrar a enviada
  await carregarMensagens(chatSelecionado, 0);
}
```

#### Passo 5: Integrar Webhook com Frontend

Para receber mensagens em tempo real, você precisa:

1. **Backend recebe webhook** e salva no banco de dados
2. **Backend notifica frontend** via WebSocket ou Server-Sent Events
3. **Frontend atualiza interface** quando recebe nova mensagem

**Exemplo com WebSocket (Backend):**
```javascript
// Backend (Node.js)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 7000 });

app.post('/webhook', (req, res) => {
  // ... processar webhook ...
  
  // Notificar todos os clientes conectados
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'new_message',
        data: messageData
      }));
    }
  });
  
  res.status(200).send('OK');
});
```

**Frontend (JavaScript):**
```javascript
// Conectar ao WebSocket
const ws = new WebSocket('ws://localhost:7000');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'new_message') {
    // Se a mensagem é da conversa atual, adicionar à lista
    if (message.data.chat_jid === chatSelecionado) {
      mensagensAtuais.push(message.data);
      renderizarMensagens(mensagensAtuais);
    }
    
    // Atualizar lista de conversas
    carregarConversas();
  }
};
```

### 3. Estrutura HTML Básica

```html
<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp Web Interface</title>
  <style>
    .container {
      display: flex;
      height: 100vh;
    }
    
    .sidebar {
      width: 300px;
      border-right: 1px solid #ddd;
      overflow-y: auto;
    }
    
    .conversa-item {
      padding: 15px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
    }
    
    .conversa-item:hover {
      background: #f5f5f5;
    }
    
    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .mensagens-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }
    
    .mensagem {
      margin-bottom: 10px;
      padding: 10px;
      border-radius: 8px;
      max-width: 70%;
    }
    
    .mensagem.enviada {
      background: #dcf8c6;
      margin-left: auto;
    }
    
    .mensagem.recebida {
      background: #fff;
      border: 1px solid #ddd;
    }
    
    .input-area {
      padding: 15px;
      border-top: 1px solid #ddd;
      display: flex;
      gap: 10px;
    }
    
    .input-area input {
      flex: 1;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 20px;
    }
    
    .input-area button {
      padding: 10px 20px;
      background: #25D366;
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="sidebar">
      <h2>Conversas</h2>
      <div id="lista-conversas"></div>
    </div>
    
    <div class="chat-area">
      <div id="mensagens-container" class="mensagens-container"></div>
      <div class="input-area">
        <input type="text" id="input-mensagem" placeholder="Digite uma mensagem..." />
        <button onclick="enviarMensagem()">Enviar</button>
      </div>
    </div>
  </div>
  
  <script src="whatsapp-api.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

---

## Resumo dos Endpoints Principais

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/app/login` | GET | Obter QR code para login |
| `/app/status` | GET | Verificar status da conexão |
| `/chats` | GET | Listar todas as conversas |
| `/chat/:chat_jid/messages` | GET | Obter mensagens de uma conversa |
| `/send/message` | POST | Enviar mensagem de texto |
| `/send/image` | POST | Enviar imagem |
| `/send/file` | POST | Enviar arquivo |
| `/send/audio` | POST | Enviar áudio |
| `/send/video` | POST | Enviar vídeo |
| `/message/:message_id/read` | POST | Marcar mensagem como lida |

---

## Considerações Importantes

1. **Formato de Telefone**: Sempre use o formato internacional sem caracteres especiais (ex: `5511999999999`)

2. **JID**: Alguns endpoints aceitam JID completo (`5511999999999@s.whatsapp.net`) ou apenas o número (`5511999999999`)

3. **Autenticação**: Todas as requisições precisam do header `Authorization: Basic base64(usuario:senha)`

4. **Webhook**: Configure o webhook para receber mensagens em tempo real. Sem webhook, você precisará fazer polling constante

5. **Rate Limiting**: Respeite os limites da API do WhatsApp para evitar bloqueios

6. **Mídia**: Arquivos de mídia são salvos no servidor da API. Use a URL retornada para acessá-los

7. **Conversas 1-1**: Para conversas individuais, o `chat_jid` geralmente é o mesmo que o `sender_jid` (número do contato)

---

## Próximos Passos

1. Implementar a interface web conforme os exemplos acima
2. Configurar o webhook no servidor da API
3. Criar backend para processar webhooks e notificar frontend
4. Implementar WebSocket ou Server-Sent Events para atualizações em tempo real
5. Adicionar suporte para diferentes tipos de mídia
6. Implementar busca de mensagens
7. Adicionar indicadores de digitação (typing indicators)
8. Implementar status de entrega e leitura

---

## Suporte e Documentação Adicional

- **OpenAPI Specification**: Veja `docs/openapi.yaml` para especificação completa da API
- **Webhook Payload**: Veja `docs/webhook-payload.md` para detalhes completos dos payloads de webhook
- **Repositório**: https://github.com/aldinokemal/go-whatsapp-web-multidevice

---

**Nota**: Esta API é não-oficial e não é afiliada ao WhatsApp. Use por sua conta e risco. Para uso em produção, considere usar a API oficial do WhatsApp Business.

