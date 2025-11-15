# Guia Completo de Implementação - API WhatsApp Web Multidevice

## Visão Geral

Documento completo com exemplos práticos de todos os endpoints disponíveis na API WhatsApp Web Multidevice. Cada endpoint inclui URL completa, objetos de request/response e exemplos de código.

**Base URL**: `http://localhost:3000` (ou configurável via `--port` ou `APP_PORT`)

**Autenticação**: Basic Auth
- Header: `Authorization: Basic base64(usuario:senha)`
- Configuração: `--basic-auth=usuario:senha` ou `APP_BASIC_AUTH=usuario:senha`

**Estrutura de Resposta Padrão**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Mensagem de sucesso",
  "results": { /* dados da resposta */ }
}
```

---

## 1. Aplicação (App)

### 1.1 Login com QR Code

**URL**: `GET http://localhost:3000/app/login`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Response**:
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

**Exemplo JavaScript**:
```javascript
const response = await fetch('http://localhost:3000/app/login', {
  headers: {
    'Authorization': `Basic ${btoa('usuario:senha')}`
  }
});
const data = await response.json();
console.log(data.results.qr_link); // URL do QR code
```

---

### 1.2 Login com Código de Pareamento

**URL**: `GET http://localhost:3000/app/login-with-code?phone=5511999999999`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Query Parameters**:
- `phone` (obrigatório): Número no formato internacional (ex: `5511999999999`)

**Response**:
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

---

### 1.3 Status da Conexão

**URL**: `GET http://localhost:3000/app/status`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Response**:
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

### 1.4 Logout

**URL**: `GET http://localhost:3000/app/logout`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success logout",
  "results": null
}
```

---

### 1.5 Reconectar

**URL**: `GET http://localhost:3000/app/reconnect`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Reconnect success",
  "results": null
}
```

---

### 1.6 Listar Dispositivos Conectados

**URL**: `GET http://localhost:3000/app/devices`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Fetch device success",
  "results": [
    {
      "id": "device123",
      "name": "Chrome",
      "platform": "web"
    }
  ]
}
```

---

## 2. Usuário (User)

### 2.1 Informações do Usuário

**URL**: `GET http://localhost:3000/user/info?phone=5511999999999@s.whatsapp.net`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Query Parameters**:
- `phone` (obrigatório): Número com código do país (ex: `5511999999999@s.whatsapp.net`)

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success get user info",
  "results": {
    "jid": "5511999999999@s.whatsapp.net",
    "name": "João Silva",
    "notify": "João",
    "verified_name": "",
    "status": ""
  }
}
```

---

### 2.2 Avatar do Usuário

**URL**: `GET http://localhost:3000/user/avatar?phone=5511999999999@s.whatsapp.net&is_preview=false&is_community=false`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Query Parameters**:
- `phone` (obrigatório): Número com código do país
- `is_preview` (opcional, boolean): Buscar preview do avatar
- `is_community` (opcional, boolean): Buscar avatar da comunidade

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success get avatar",
  "results": {
    "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "id": "avatar123"
  }
}
```

---

### 2.3 Alterar Avatar

**URL**: `POST http://localhost:3000/user/avatar`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: multipart/form-data
```

**Body (Form Data)**:
- `avatar` (obrigatório, File): Arquivo de imagem do avatar

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Avatar updated successfully",
  "results": null
}
```

---

### 2.4 Alterar Nome de Exibição (Push Name)

**URL**: `POST http://localhost:3000/user/pushname`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "push_name": "João Silva"
}
```

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Push name updated successfully",
  "results": null
}
```

---

### 2.5 Meus Grupos

**URL**: `GET http://localhost:3000/user/my/groups`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success get my groups",
  "results": {
    "data": [
      {
        "jid": "120363402106XXXXX@g.us",
        "name": "Grupo Teste",
        "subject_owner": "5511999999999@s.whatsapp.net",
        "subject_time": "2023-10-15T10:30:00Z",
        "creation": "2023-10-01T08:00:00Z"
      }
    ]
  }
}
```

---

### 2.6 Meus Newsletters

**URL**: `GET http://localhost:3000/user/my/newsletters`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success get my newsletters",
  "results": {
    "data": [
      {
        "jid": "120363402106XXXXX@newsletter",
        "name": "Newsletter Teste",
        "subscriber_count": 100
      }
    ]
  }
}
```

---

### 2.7 Configurações de Privacidade

**URL**: `GET http://localhost:3000/user/my/privacy`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success get privacy settings",
  "results": {
    "read_receipts": "everyone",
    "profile_photo": "everyone",
    "status": "contacts",
    "last_seen": "contacts"
  }
}
```

---

### 2.8 Meus Contatos

**URL**: `GET http://localhost:3000/user/my/contacts`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success get my contacts",
  "results": {
    "data": [
      {
        "jid": "5511999999999@s.whatsapp.net",
        "name": "João Silva",
        "notify": "João"
      }
    ]
  }
}
```

---

### 2.9 Verificar se Usuário está no WhatsApp

**URL**: `GET http://localhost:3000/user/check?phone=5511999999999`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Query Parameters**:
- `phone` (obrigatório): Número no formato internacional

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success check user",
  "results": {
    "jid": "5511999999999@s.whatsapp.net",
    "exists": true,
    "lid": null
  }
}
```

---

### 2.10 Perfil Business

**URL**: `GET http://localhost:3000/user/business-profile?phone=5511999999999@s.whatsapp.net`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Query Parameters**:
- `phone` (obrigatório): Número do perfil business

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success get business profile",
  "results": {
    "description": "Descrição do negócio",
    "website": ["https://example.com"],
    "email": "contato@example.com",
    "category": "BUSINESS",
    "address": "Endereço do negócio",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "business_hours": {
      "timezone": "America/Sao_Paulo",
      "config": {
        "monday": {"mode": "open", "hours": [{"open": "09:00", "close": "18:00"}]}
      }
    }
  }
}
```

---

## 3. Envio de Mensagens (Send)

### 3.1 Enviar Mensagem de Texto

**URL**: `POST http://localhost:3000/send/message`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "phone": "5511999999999@s.whatsapp.net",
  "message": "Olá! Como posso ajudar?",
  "reply_message_id": "3EB0C127D7BACC83D6A1",
  "is_forwarded": false,
  "duration": 3600
}
```

**Campos**:
- `phone` (obrigatório): Número do destinatário
- `message` (obrigatório): Texto da mensagem
- `reply_message_id` (opcional): ID da mensagem respondida
- `is_forwarded` (opcional, boolean): Se é mensagem encaminhada
- `duration` (opcional, integer): Duração em segundos para mensagem temporária

**Response**:
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

**Exemplo JavaScript**:
```javascript
const response = await fetch('http://localhost:3000/send/message', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa('usuario:senha')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '5511999999999@s.whatsapp.net',
    message: 'Olá! Como posso ajudar?'
  })
});
const data = await response.json();
```

---

### 3.2 Enviar Imagem

**URL**: `POST http://localhost:3000/send/image`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: multipart/form-data
```

**Body (Form Data)**:
- `phone` (obrigatório): Número do destinatário
- `image` (obrigatório, File): Arquivo de imagem
- `image_url` (opcional): URL da imagem
- `caption` (opcional): Legenda da imagem
- `view_once` (opcional, boolean): Visualização única
- `compress` (opcional, boolean): Comprimir imagem
- `duration` (opcional, integer): Duração para mensagem temporária
- `is_forwarded` (opcional, boolean): Se é mensagem encaminhada

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Image sent successfully",
  "results": {
    "message_id": "3EB0C127D7BACC83D6A3",
    "status": "Image sent successfully"
  }
}
```

**Exemplo JavaScript**:
```javascript
const formData = new FormData();
formData.append('phone', '5511999999999@s.whatsapp.net');
formData.append('image', imageFile);
formData.append('caption', 'Minha imagem');

const response = await fetch('http://localhost:3000/send/image', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa('usuario:senha')}`
  },
  body: formData
});
```

---

### 3.3 Enviar Arquivo/Documento

**URL**: `POST http://localhost:3000/send/file`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: multipart/form-data
```

**Body (Form Data)**:
- `phone` (obrigatório): Número do destinatário
- `file` (obrigatório, File): Arquivo a ser enviado
- `caption` (opcional): Legenda do arquivo
- `duration` (opcional, integer): Duração para mensagem temporária
- `is_forwarded` (opcional, boolean): Se é mensagem encaminhada

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "File sent successfully",
  "results": {
    "message_id": "3EB0C127D7BACC83D6A4",
    "status": "File sent successfully"
  }
}
```

---

### 3.4 Enviar Áudio

**URL**: `POST http://localhost:3000/send/audio`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: multipart/form-data
```

**Body (Form Data)**:
- `phone` (obrigatório): Número do destinatário
- `audio` (obrigatório, File): Arquivo de áudio
- `audio_url` (opcional): URL do áudio
- `duration` (opcional, integer): Duração para mensagem temporária
- `is_forwarded` (opcional, boolean): Se é mensagem encaminhada

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Audio sent successfully",
  "results": {
    "message_id": "3EB0C127D7BACC83D6A5",
    "status": "Audio sent successfully"
  }
}
```

---

### 3.5 Enviar Vídeo

**URL**: `POST http://localhost:3000/send/video`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: multipart/form-data
```

**Body (Form Data)**:
- `phone` (obrigatório): Número do destinatário
- `video` (obrigatório, File): Arquivo de vídeo
- `video_url` (opcional): URL do vídeo
- `caption` (opcional): Legenda do vídeo
- `view_once` (opcional, boolean): Visualização única
- `compress` (opcional, boolean): Comprimir vídeo
- `duration` (opcional, integer): Duração para mensagem temporária
- `is_forwarded` (opcional, boolean): Se é mensagem encaminhada

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Video sent successfully",
  "results": {
    "message_id": "3EB0C127D7BACC83D6A6",
    "status": "Video sent successfully"
  }
}
```

---

### 3.6 Enviar Contato

**URL**: `POST http://localhost:3000/send/contact`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "phone": "5511999999999@s.whatsapp.net",
  "contact_name": "João Silva",
  "contact_phone": "5511888888888@s.whatsapp.net"
}
```

**Campos**:
- `phone` (obrigatório): Número do destinatário
- `contact_name` (obrigatório): Nome do contato
- `contact_phone` (obrigatório): Número do contato

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Contact sent successfully",
  "results": {
    "message_id": "3EB0C127D7BACC83D6A7",
    "status": "Contact sent successfully"
  }
}
```

---

### 3.7 Enviar Localização

**URL**: `POST http://localhost:3000/send/location`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "phone": "5511999999999@s.whatsapp.net",
  "latitude": "-23.5505",
  "longitude": "-46.6333"
}
```

**Campos**:
- `phone` (obrigatório): Número do destinatário
- `latitude` (obrigatório): Latitude da localização
- `longitude` (obrigatório): Longitude da localização

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Location sent successfully",
  "results": {
    "message_id": "3EB0C127D7BACC83D6A8",
    "status": "Location sent successfully"
  }
}
```

---

### 3.8 Enviar Link

**URL**: `POST http://localhost:3000/send/link`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "phone": "5511999999999@s.whatsapp.net",
  "link": "https://example.com",
  "caption": "Confira este link!"
}
```

**Campos**:
- `phone` (obrigatório): Número do destinatário
- `link` (obrigatório): URL do link
- `caption` (opcional): Legenda do link

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Link sent successfully",
  "results": {
    "message_id": "3EB0C127D7BACC83D6A9",
    "status": "Link sent successfully"
  }
}
```

---

### 3.9 Enviar Enquete (Poll)

**URL**: `POST http://localhost:3000/send/poll`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "phone": "5511999999999@s.whatsapp.net",
  "poll_name": "Qual sua opinião?",
  "poll_values": ["Opção 1", "Opção 2", "Opção 3"]
}
```

**Campos**:
- `phone` (obrigatório): Número do destinatário
- `poll_name` (obrigatório): Título da enquete
- `poll_values` (obrigatório, array): Opções da enquete

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Poll sent successfully",
  "results": {
    "message_id": "3EB0C127D7BACC83D6AA",
    "status": "Poll sent successfully"
  }
}
```

---

### 3.10 Enviar Presença

**URL**: `POST http://localhost:3000/send/presence`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "presence": "available"
}
```

**Campos**:
- `presence` (obrigatório): Tipo de presença (`available`, `unavailable`, `composing`, `recording`, `paused`)

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Presence updated successfully",
  "results": null
}
```

---

### 3.11 Enviar Indicador de Digitação (Chat Presence)

**URL**: `POST http://localhost:3000/send/chat-presence`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "phone": "5511999999999@s.whatsapp.net",
  "presence": "composing"
}
```

**Campos**:
- `phone` (obrigatório): Número do destinatário
- `presence` (obrigatório): Tipo de presença (`composing`, `recording`, `paused`)

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Chat presence updated successfully",
  "results": null
}
```

---

## 4. Ações em Mensagens (Message)

### 4.1 Revogar Mensagem

**URL**: `POST http://localhost:3000/message/3EB0C127D7BACC83D6A1/revoke`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Path Parameters**:
- `message_id` (obrigatório): ID da mensagem a ser revogada

**Body (JSON)**:
```json
{
  "phone": "5511999999999@s.whatsapp.net"
}
```

**Campos**:
- `phone` (obrigatório): Número do chat onde a mensagem está

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Message revoked successfully",
  "results": {
    "status": "Message revoked successfully"
  }
}
```

---

### 4.2 Reagir à Mensagem

**URL**: `POST http://localhost:3000/message/3EB0C127D7BACC83D6A1/reaction`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Path Parameters**:
- `message_id` (obrigatório): ID da mensagem

**Body (JSON)**:
```json
{
  "phone": "5511999999999@s.whatsapp.net",
  "reaction": "👍"
}
```

**Campos**:
- `phone` (obrigatório): Número do chat
- `reaction` (obrigatório): Emoji da reação (ex: `👍`, `❤️`, `😂`)

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Reaction sent successfully",
  "results": {
    "status": "Reaction sent successfully"
  }
}
```

---

### 4.3 Deletar Mensagem

**URL**: `POST http://localhost:3000/message/3EB0C127D7BACC83D6A1/delete`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Path Parameters**:
- `message_id` (obrigatório): ID da mensagem

**Body (JSON)**:
```json
{
  "phone": "5511999999999@s.whatsapp.net"
}
```

**Campos**:
- `phone` (obrigatório): Número do chat

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Message deleted successfully",
  "results": null
}
```

---

### 4.4 Editar Mensagem

**URL**: `POST http://localhost:3000/message/3EB0C127D7BACC83D6A1/update`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Path Parameters**:
- `message_id` (obrigatório): ID da mensagem

**Body (JSON)**:
```json
{
  "phone": "5511999999999@s.whatsapp.net",
  "message": "Texto editado"
}
```

**Campos**:
- `phone` (obrigatório): Número do chat
- `message` (obrigatório): Novo texto da mensagem

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Message updated successfully",
  "results": {
    "status": "Message updated successfully"
  }
}
```

---

### 4.5 Marcar Mensagem como Lida

**URL**: `POST http://localhost:3000/message/3EB0C127D7BACC83D6A1/read`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Path Parameters**:
- `message_id` (obrigatório): ID da mensagem

**Body (JSON)**:
```json
{
  "phone": "5511999999999@s.whatsapp.net"
}
```

**Campos**:
- `phone` (obrigatório): Número do chat

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Message marked as read",
  "results": {
    "status": "Message marked as read"
  }
}
```

---

### 4.6 Favoritar Mensagem (Star)

**URL**: `POST http://localhost:3000/message/3EB0C127D7BACC83D6A1/star`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Path Parameters**:
- `message_id` (obrigatório): ID da mensagem

**Body (JSON)**:
```json
{
  "phone": "5511999999999@s.whatsapp.net"
}
```

**Campos**:
- `phone` (obrigatório): Número do chat

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Message starred successfully",
  "results": null
}
```

---

### 4.7 Desfavoritar Mensagem (Unstar)

**URL**: `POST http://localhost:3000/message/3EB0C127D7BACC83D6A1/unstar`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Path Parameters**:
- `message_id` (obrigatório): ID da mensagem

**Body (JSON)**:
```json
{
  "phone": "5511999999999@s.whatsapp.net"
}
```

**Campos**:
- `phone` (obrigatório): Número do chat

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Message unstarred successfully",
  "results": null
}
```

---

### 4.8 Baixar Mídia

**URL**: `GET http://localhost:3000/message/3EB0C127D7BACC83D6A1/download`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Path Parameters**:
- `message_id` (obrigatório): ID da mensagem com mídia

**Response**: Arquivo binário da mídia

---

## 5. Chats e Mensagens (Chat)

### 5.1 Listar Chats

**URL**: `GET http://localhost:3000/chats?limit=25&offset=0&search=&has_media=false`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Query Parameters**:
- `limit` (opcional, padrão: 25): Número máximo de resultados
- `offset` (opcional, padrão: 0): Número de resultados para pular
- `search` (opcional): Termo de busca
- `has_media` (opcional, boolean): Filtrar conversas com mídia

**Response**:
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
      "limit": 25,
      "offset": 0,
      "total": 100
    }
  }
}
```

---

### 5.2 Obter Mensagens de um Chat

**URL**: `GET http://localhost:3000/chat/5511999999999/messages?limit=50&offset=0&media_only=false&search=&start_time=&end_time=&is_from_me=`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Path Parameters**:
- `chat_jid` (obrigatório): JID do chat (ex: `5511999999999` ou `5511999999999@s.whatsapp.net`)

**Query Parameters**:
- `limit` (opcional, padrão: 50): Número máximo de mensagens
- `offset` (opcional, padrão: 0): Número de mensagens para pular
- `media_only` (opcional, boolean): Retornar apenas mensagens com mídia
- `search` (opcional): Buscar mensagens por conteúdo
- `start_time` (opcional, ISO 8601): Filtrar mensagens a partir desta data
- `end_time` (opcional, ISO 8601): Filtrar mensagens até esta data
- `is_from_me` (opcional, boolean): Filtrar apenas mensagens enviadas por mim

**Response**:
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
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 250
    },
    "chat_info": {
      "jid": "5511999999999@s.whatsapp.net",
      "name": "João Silva",
      "last_message_time": "2023-10-15T10:35:00Z",
      "ephemeral_expiration": 0
    }
  }
}
```

---

### 5.3 Fixar Chat

**URL**: `POST http://localhost:3000/chat/5511999999999@s.whatsapp.net/pin`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Path Parameters**:
- `chat_jid` (obrigatório): JID do chat

**Body (JSON)**:
```json
{
  "pin": true
}
```

**Campos**:
- `pin` (obrigatório, boolean): `true` para fixar, `false` para desfixar

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Chat pinned successfully",
  "results": {
    "jid": "5511999999999@s.whatsapp.net",
    "pinned": true
  }
}
```

---

### 5.4 Rotular Chat

**URL**: `POST http://localhost:3000/chat/5511999999999@s.whatsapp.net/label`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Path Parameters**:
- `chat_jid` (obrigatório): JID do chat

**Body (JSON)**:
```json
{
  "label_id": "1"
}
```

**Campos**:
- `label_id` (obrigatório): ID do rótulo

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Chat labeled successfully",
  "results": null
}
```

---

## 6. Grupos (Group)

### 6.1 Criar Grupo

**URL**: `POST http://localhost:3000/group`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "group_name": "Grupo Teste",
  "participants": ["5511888888888@s.whatsapp.net", "5511777777777@s.whatsapp.net"]
}
```

**Campos**:
- `group_name` (obrigatório): Nome do grupo
- `participants` (obrigatório, array): Lista de JIDs dos participantes

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success created group",
  "results": {
    "group_id": "120363402106XXXXX@g.us"
  }
}
```

---

### 6.2 Entrar em Grupo com Link

**URL**: `POST http://localhost:3000/group/join-with-link`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "invite_link": "https://chat.whatsapp.com/ABC123DEF456"
}
```

**Campos**:
- `invite_link` (obrigatório): Link de convite do grupo

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success joined group",
  "results": {
    "group_id": "120363402106XXXXX@g.us"
  }
}
```

---

### 6.3 Informações do Grupo a partir do Link

**URL**: `GET http://localhost:3000/group/info-from-link?invite_link=https://chat.whatsapp.com/ABC123DEF456`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Query Parameters**:
- `invite_link` (obrigatório): Link de convite do grupo

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success get group info from link",
  "results": {
    "group_id": "120363402106XXXXX@g.us",
    "group_name": "Grupo Teste",
    "group_description": "Descrição do grupo",
    "participants_count": 10
  }
}
```

---

### 6.4 Informações do Grupo

**URL**: `GET http://localhost:3000/group/info?group_jid=120363402106XXXXX@g.us`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Query Parameters**:
- `group_jid` (obrigatório): JID do grupo

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success get group info",
  "results": {
    "group_id": "120363402106XXXXX@g.us",
    "group_name": "Grupo Teste",
    "group_description": "Descrição do grupo",
    "group_photo": "https://example.com/photo.jpg",
    "participants": [
      {
        "jid": "5511999999999@s.whatsapp.net",
        "is_admin": true,
        "is_super_admin": false
      }
    ],
    "participants_count": 10,
    "created_at": "2023-10-01T08:00:00Z"
  }
}
```

---

### 6.5 Sair do Grupo

**URL**: `POST http://localhost:3000/group/leave`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "group_jid": "120363402106XXXXX@g.us"
}
```

**Campos**:
- `group_jid` (obrigatório): JID do grupo

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success left group",
  "results": null
}
```

---

### 6.6 Adicionar Participantes

**URL**: `POST http://localhost:3000/group/participants`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "group_jid": "120363402106XXXXX@g.us",
  "participants": ["5511888888888@s.whatsapp.net", "5511777777777@s.whatsapp.net"]
}
```

**Campos**:
- `group_jid` (obrigatório): JID do grupo
- `participants` (obrigatório, array): Lista de JIDs dos participantes a adicionar

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Participants added successfully",
  "results": [
    {
      "jid": "5511888888888@s.whatsapp.net",
      "status": "success"
    },
    {
      "jid": "5511777777777@s.whatsapp.net",
      "status": "success"
    }
  ]
}
```

---

### 6.7 Remover Participantes

**URL**: `POST http://localhost:3000/group/participants/remove`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "group_jid": "120363402106XXXXX@g.us",
  "participants": ["5511888888888@s.whatsapp.net"]
}
```

**Campos**:
- `group_jid` (obrigatório): JID do grupo
- `participants` (obrigatório, array): Lista de JIDs dos participantes a remover

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Participants removed successfully",
  "results": [
    {
      "jid": "5511888888888@s.whatsapp.net",
      "status": "success"
    }
  ]
}
```

---

### 6.8 Promover Participantes a Admin

**URL**: `POST http://localhost:3000/group/participants/promote`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "group_jid": "120363402106XXXXX@g.us",
  "participants": ["5511888888888@s.whatsapp.net"]
}
```

**Campos**:
- `group_jid` (obrigatório): JID do grupo
- `participants` (obrigatório, array): Lista de JIDs dos participantes a promover

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Participants promoted successfully",
  "results": [
    {
      "jid": "5511888888888@s.whatsapp.net",
      "status": "success"
    }
  ]
}
```

---

### 6.9 Rebaixar Participantes de Admin

**URL**: `POST http://localhost:3000/group/participants/demote`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "group_jid": "120363402106XXXXX@g.us",
  "participants": ["5511888888888@s.whatsapp.net"]
}
```

**Campos**:
- `group_jid` (obrigatório): JID do grupo
- `participants` (obrigatório, array): Lista de JIDs dos participantes a rebaixar

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Participants demoted successfully",
  "results": [
    {
      "jid": "5511888888888@s.whatsapp.net",
      "status": "success"
    }
  ]
}
```

---

### 6.10 Listar Solicitações de Participantes

**URL**: `GET http://localhost:3000/group/participant-requests?group_jid=120363402106XXXXX@g.us`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Query Parameters**:
- `group_jid` (obrigatório): JID do grupo

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success get participant requests",
  "results": {
    "data": [
      {
        "jid": "5511888888888@s.whatsapp.net",
        "request_method": "invite_link",
        "request_time": "2023-10-15T10:30:00Z"
      }
    ]
  }
}
```

---

### 6.11 Aprovar Solicitação de Participante

**URL**: `POST http://localhost:3000/group/participant-requests/approve`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "group_jid": "120363402106XXXXX@g.us",
  "participants": ["5511888888888@s.whatsapp.net"]
}
```

**Campos**:
- `group_jid` (obrigatório): JID do grupo
- `participants` (obrigatório, array): Lista de JIDs dos participantes a aprovar

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Participant requests approved successfully",
  "results": [
    {
      "jid": "5511888888888@s.whatsapp.net",
      "status": "success"
    }
  ]
}
```

---

### 6.12 Rejeitar Solicitação de Participante

**URL**: `POST http://localhost:3000/group/participant-requests/reject`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "group_jid": "120363402106XXXXX@g.us",
  "participants": ["5511888888888@s.whatsapp.net"]
}
```

**Campos**:
- `group_jid` (obrigatório): JID do grupo
- `participants` (obrigatório, array): Lista de JIDs dos participantes a rejeitar

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Participant requests rejected successfully",
  "results": [
    {
      "jid": "5511888888888@s.whatsapp.net",
      "status": "success"
    }
  ]
}
```

---

### 6.13 Definir Foto do Grupo

**URL**: `POST http://localhost:3000/group/photo`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: multipart/form-data
```

**Body (Form Data)**:
- `group_jid` (obrigatório): JID do grupo
- `photo` (obrigatório, File): Arquivo de imagem da foto

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Group photo updated successfully",
  "results": {
    "picture_id": "picture123"
  }
}
```

---

### 6.14 Definir Nome do Grupo

**URL**: `POST http://localhost:3000/group/name`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "group_jid": "120363402106XXXXX@g.us",
  "group_name": "Novo Nome do Grupo"
}
```

**Campos**:
- `group_jid` (obrigatório): JID do grupo
- `group_name` (obrigatório): Novo nome do grupo

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Group name updated successfully",
  "results": null
}
```

---

### 6.15 Definir Grupo como Bloqueado

**URL**: `POST http://localhost:3000/group/locked`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "group_jid": "120363402106XXXXX@g.us",
  "locked": true
}
```

**Campos**:
- `group_jid` (obrigatório): JID do grupo
- `locked` (obrigatório, boolean): `true` para bloquear, `false` para desbloquear

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Group locked status updated successfully",
  "results": null
}
```

---

### 6.16 Definir Anúncios do Grupo

**URL**: `POST http://localhost:3000/group/announce`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "group_jid": "120363402106XXXXX@g.us",
  "announce": true
}
```

**Campos**:
- `group_jid` (obrigatório): JID do grupo
- `announce` (obrigatório, boolean): `true` para apenas admins anunciarem, `false` para todos

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Group announce status updated successfully",
  "results": null
}
```

---

### 6.17 Definir Tópico do Grupo

**URL**: `POST http://localhost:3000/group/topic`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "group_jid": "120363402106XXXXX@g.us",
  "topic": "Novo tópico do grupo"
}
```

**Campos**:
- `group_jid` (obrigatório): JID do grupo
- `topic` (obrigatório): Novo tópico do grupo

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Group topic updated successfully",
  "results": null
}
```

---

### 6.18 Obter Link de Convite do Grupo

**URL**: `GET http://localhost:3000/group/invite-link?group_jid=120363402106XXXXX@g.us&reset=false`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
```

**Query Parameters**:
- `group_jid` (obrigatório): JID do grupo
- `reset` (opcional, boolean): `true` para resetar o link

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success get group invite link",
  "results": {
    "invite_link": "https://chat.whatsapp.com/ABC123DEF456"
  }
}
```

---

## 7. Newsletter

### 7.1 Deixar de Seguir Newsletter

**URL**: `POST http://localhost:3000/newsletter/unfollow`

**Headers**:
```
Authorization: Basic base64(usuario:senha)
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "newsletter_jid": "120363402106XXXXX@newsletter"
}
```

**Campos**:
- `newsletter_jid` (obrigatório): JID do newsletter

**Response**:
```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "Success unfollow newsletter",
  "results": null
}
```

---

## 8. Webhooks

### 8.1 Configuração

Configure o webhook ao iniciar o servidor:
```bash
./whatsapp rest --webhook="https://seu-servidor.com/webhook" --webhook-secret="seu-secret-key"
```

Ou via variável de ambiente:
```bash
WHATSAPP_WEBHOOK=https://seu-servidor.com/webhook
WHATSAPP_WEBHOOK_SECRET=seu-secret-key
```

### 8.2 Validação de Assinatura

**Header**: `X-Hub-Signature-256`

**Formato**: `sha256={signature}`

**Exemplo Node.js**:
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

### 8.3 Eventos de Mensagem

#### Mensagem de Texto Recebida

**Payload**:
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

#### Mensagem com Imagem

**Payload**:
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

#### Mensagem Revogada

**Payload**:
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

#### Recebimento de Mensagem (Delivery/Read)

**Payload**:
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

#### Eventos de Grupo

**Payload**:
```json
{
  "event": "group.participants",
  "payload": {
    "chat_id": "120363402106XXXXX@g.us",
    "type": "join",
    "jids": ["5511888888888@s.whatsapp.net"]
  },
  "timestamp": "2025-07-28T10:30:00Z"
}
```

**Tipos de evento**:
- `join`: Participante entrou
- `leave`: Participante saiu
- `promote`: Participante promovido a admin
- `demote`: Participante rebaixado de admin

---

## 9. Cliente API Completo (JavaScript)

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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // App
  async login() {
    return this.request('/app/login');
  }

  async loginWithCode(phone) {
    return this.request(`/app/login-with-code?phone=${phone}`);
  }

  async getStatus() {
    return this.request('/app/status');
  }

  async logout() {
    return this.request('/app/logout');
  }

  async reconnect() {
    return this.request('/app/reconnect');
  }

  async getDevices() {
    return this.request('/app/devices');
  }

  // User
  async getUserInfo(phone) {
    return this.request(`/user/info?phone=${phone}`);
  }

  async getUserAvatar(phone, isPreview = false, isCommunity = false) {
    return this.request(`/user/avatar?phone=${phone}&is_preview=${isPreview}&is_community=${isCommunity}`);
  }

  async changeAvatar(avatarFile) {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    return this.request('/user/avatar', {
      method: 'POST',
      body: formData
    });
  }

  async changePushName(pushName) {
    return this.request('/user/pushname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ push_name: pushName })
    });
  }

  async getMyGroups() {
    return this.request('/user/my/groups');
  }

  async getMyNewsletters() {
    return this.request('/user/my/newsletters');
  }

  async getMyPrivacy() {
    return this.request('/user/my/privacy');
  }

  async getMyContacts() {
    return this.request('/user/my/contacts');
  }

  async checkUser(phone) {
    return this.request(`/user/check?phone=${phone}`);
  }

  async getBusinessProfile(phone) {
    return this.request(`/user/business-profile?phone=${phone}`);
  }

  // Send
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
    if (caption) formData.append('caption', caption);
    return this.request('/send/image', {
      method: 'POST',
      body: formData
    });
  }

  async sendFile(phone, file, caption = '') {
    const formData = new FormData();
    formData.append('phone', phone);
    formData.append('file', file);
    if (caption) formData.append('caption', caption);
    return this.request('/send/file', {
      method: 'POST',
      body: formData
    });
  }

  async sendAudio(phone, audioFile) {
    const formData = new FormData();
    formData.append('phone', phone);
    formData.append('audio', audioFile);
    return this.request('/send/audio', {
      method: 'POST',
      body: formData
    });
  }

  async sendVideo(phone, videoFile, caption = '') {
    const formData = new FormData();
    formData.append('phone', phone);
    formData.append('video', videoFile);
    if (caption) formData.append('caption', caption);
    return this.request('/send/video', {
      method: 'POST',
      body: formData
    });
  }

  async sendContact(phone, contactName, contactPhone) {
    return this.request('/send/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, contact_name: contactName, contact_phone: contactPhone })
    });
  }

  async sendLocation(phone, latitude, longitude) {
    return this.request('/send/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, latitude, longitude })
    });
  }

  async sendLink(phone, link, caption = '') {
    return this.request('/send/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, link, caption })
    });
  }

  async sendPoll(phone, pollName, pollValues) {
    return this.request('/send/poll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, poll_name: pollName, poll_values: pollValues })
    });
  }

  async sendPresence(presence) {
    return this.request('/send/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presence })
    });
  }

  async sendChatPresence(phone, presence) {
    return this.request('/send/chat-presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, presence })
    });
  }

  // Message
  async revokeMessage(messageId, phone) {
    return this.request(`/message/${messageId}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
  }

  async reactMessage(messageId, phone, reaction) {
    return this.request(`/message/${messageId}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, reaction })
    });
  }

  async deleteMessage(messageId, phone) {
    return this.request(`/message/${messageId}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
  }

  async updateMessage(messageId, phone, message) {
    return this.request(`/message/${messageId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    });
  }

  async markAsRead(messageId, phone) {
    return this.request(`/message/${messageId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
  }

  async starMessage(messageId, phone) {
    return this.request(`/message/${messageId}/star`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
  }

  async unstarMessage(messageId, phone) {
    return this.request(`/message/${messageId}/unstar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
  }

  async downloadMedia(messageId) {
    return this.request(`/message/${messageId}/download`);
  }

  // Chat
  async listChats(limit = 25, offset = 0, search = '', hasMedia = false) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      search: search,
      has_media: hasMedia.toString()
    });
    return this.request(`/chats?${params}`);
  }

  async getChatMessages(chatJid, limit = 50, offset = 0, options = {}) {
    const cleanJid = chatJid.replace('@s.whatsapp.net', '');
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...options
    });
    return this.request(`/chat/${cleanJid}/messages?${params}`);
  }

  async pinChat(chatJid, pin) {
    return this.request(`/chat/${chatJid}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
  }

  async labelChat(chatJid, labelId) {
    return this.request(`/chat/${chatJid}/label`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label_id: labelId })
    });
  }

  // Group
  async createGroup(groupName, participants) {
    return this.request('/group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_name: groupName, participants })
    });
  }

  async joinGroupWithLink(inviteLink) {
    return this.request('/group/join-with-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_link: inviteLink })
    });
  }

  async getGroupInfoFromLink(inviteLink) {
    return this.request(`/group/info-from-link?invite_link=${encodeURIComponent(inviteLink)}`);
  }

  async getGroupInfo(groupJid) {
    return this.request(`/group/info?group_jid=${groupJid}`);
  }

  async leaveGroup(groupJid) {
    return this.request('/group/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_jid: groupJid })
    });
  }

  async addParticipants(groupJid, participants) {
    return this.request('/group/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_jid: groupJid, participants })
    });
  }

  async removeParticipants(groupJid, participants) {
    return this.request('/group/participants/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_jid: groupJid, participants })
    });
  }

  async promoteParticipants(groupJid, participants) {
    return this.request('/group/participants/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_jid: groupJid, participants })
    });
  }

  async demoteParticipants(groupJid, participants) {
    return this.request('/group/participants/demote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_jid: groupJid, participants })
    });
  }

  async listParticipantRequests(groupJid) {
    return this.request(`/group/participant-requests?group_jid=${groupJid}`);
  }

  async approveParticipantRequests(groupJid, participants) {
    return this.request('/group/participant-requests/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_jid: groupJid, participants })
    });
  }

  async rejectParticipantRequests(groupJid, participants) {
    return this.request('/group/participant-requests/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_jid: groupJid, participants })
    });
  }

  async setGroupPhoto(groupJid, photoFile) {
    const formData = new FormData();
    formData.append('group_jid', groupJid);
    formData.append('photo', photoFile);
    return this.request('/group/photo', {
      method: 'POST',
      body: formData
    });
  }

  async setGroupName(groupJid, groupName) {
    return this.request('/group/name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_jid: groupJid, group_name: groupName })
    });
  }

  async setGroupLocked(groupJid, locked) {
    return this.request('/group/locked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_jid: groupJid, locked })
    });
  }

  async setGroupAnnounce(groupJid, announce) {
    return this.request('/group/announce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_jid: groupJid, announce })
    });
  }

  async setGroupTopic(groupJid, topic) {
    return this.request('/group/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_jid: groupJid, topic })
    });
  }

  async getGroupInviteLink(groupJid, reset = false) {
    return this.request(`/group/invite-link?group_jid=${groupJid}&reset=${reset}`);
  }

  // Newsletter
  async unfollowNewsletter(newsletterJid) {
    return this.request('/newsletter/unfollow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsletter_jid: newsletterJid })
    });
  }
}

// Uso
const api = new WhatsAppAPI('http://localhost:3000', 'usuario', 'senha');

// Exemplos de uso
const status = await api.getStatus();
const chats = await api.listChats(50, 0);
const messages = await api.getChatMessages('5511999999999', 100, 0);
const result = await api.sendText('5511999999999@s.whatsapp.net', 'Olá!');
```

---

## 10. Considerações Importantes

### Formato de Telefone
- Sempre use formato internacional sem caracteres especiais
- Exemplo: `5511999999999` (Brasil: 55, DDD: 11, Número: 999999999)
- Alguns endpoints aceitam JID completo: `5511999999999@s.whatsapp.net`

### JID (Jabber ID)
- **Formato completo**: `5511999999999@s.whatsapp.net` (chat individual)
- **Formato grupo**: `120363402106XXXXX@g.us`
- **Formato newsletter**: `120363402106XXXXX@newsletter`
- Alguns endpoints aceitam formato curto: `5511999999999`

### Autenticação
- Todas as requisições precisam do header `Authorization: Basic base64(usuario:senha)`
- Configure múltiplos usuários: `--basic-auth=usuario1:senha1,usuario2:senha2`

### Webhooks
- Configure webhook para receber mensagens em tempo real
- Valide sempre a assinatura HMAC SHA256
- Responda com HTTP 2xx para sucesso
- Processe webhooks rapidamente (timeout de 10 segundos)

### Mídia
- Arquivos de mídia são salvos no servidor da API
- Use a URL retornada ou o endpoint de download para acessar
- Suporte para compressão de imagens e vídeos

### Rate Limiting
- Respeite os limites da API do WhatsApp
- Implemente retry com backoff exponencial
- Monitore erros de rate limiting

### Mensagens Temporárias
- Use o campo `duration` em segundos para mensagens que desaparecem
- Duração mínima: 60 segundos
- Duração máxima: 7776000 segundos (90 dias)

---

## 11. Referências

- **OpenAPI Specification**: `docs/openapi.yaml`
- **Webhook Payload**: `docs/webhook-payload.md`
- **Documentação de Implementação**: `docs/IMPLEMENTACAO_API_WHATSAPP.md`
- **README**: `readme.md`

---

**Nota**: Esta API é não-oficial e não é afiliada ao WhatsApp. Use por sua conta e risco. Para uso em produção, considere usar a API oficial do WhatsApp Business.

