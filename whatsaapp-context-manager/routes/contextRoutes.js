// routes/contextRoutes.js
function setupContextRoutes(app, apiRoute) {
  app.post(`${apiRoute}/:context`, async (req, res) => {
    const { context } = req.params;

    try {
      // Aqui você pode implementar lógica específica por contexto se quiser
      // Exemplo: chamar serviços dinâmicos com base no contexto
      await handleContext(context, req.body, res);

      res.success(`✅ Contexto (${context}) processado com sucesso`);
    } catch (error) {
      res.error(`❌ Erro ao processar contexto (${context})`, 500, error.message);
    }
  });
}

async function handleContext(context, payload, res) {
  // Simulação de lógica personalizada
  switch (context) {
    //Reading Journey
    case 'prayer': {
      const { prayer } = require('../service/prayerService');
      await prayer(payload);
      break;
    }

    // Birthday
    case 'birthday' : {
      const { birthday } = require('../service/birthdayService');
        await birthday(payload);
      break;
    }
    
    //Reading Journey
    case 'readingJourney': {
      const { readingJourney } = require('../service/readingJourney');
      await readingJourney(payload);
      break;
    }

    //Reading Journey Salmodia
    case 'readingJourneySalmodia': {
      const { readingSalmodia } = require('../service/readingJourney');
      await readingSalmodia(payload);
      break;
    }

    //Love Phrases
    case 'lovephrases': {
      const { lovePhrases } = require('../service/loveService');
      await lovePhrases(payload);
      break;
    }

    //Love Ideas
    case 'loveideas': {
      const { loveIdeas } = require('../service/loveService');
      await loveIdeas(payload);
      break;
    }
    
    default:
      throw new Error(`Contexto "${context}" não reconhecido`);
  }
}

module.exports = { setupContextRoutes };
