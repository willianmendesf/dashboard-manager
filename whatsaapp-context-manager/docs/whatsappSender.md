exemplo:

const WhatsAppApiService = require('./services/WhatsAppApiService');

async function enviarMensagemDeBoasVindas() {
  const resultado = await WhatsAppApiService.enviarMensagem({
    type: 'individual',
    number: '5511999999999',
    message: 'Olá! Seja bem-vindo ao nosso canal oficial 🎉'
  });

  if (resultado.success) {
    console.log('✅ Mensagem enviada:', resultado.data);
  } else {
    console.error('❌ Erro ao enviar:', resultado.error);
  }
}

enviarMensagemDeBoasVindas();

----------------------------------------------------------------------

// Enviar mensagem usando mentions:

POST /sendMessage
Content-Type: application/json

{
  "type": "group",
  "number": "1234567890-123456@g.us",
  "message": "Olá pessoal! 👋 @Fulano e @Ciclano, vocês viram isso?",
  "mentions": [
    "5588991112222@c.us",
    "5588993334444@c.us"
  ]
}
