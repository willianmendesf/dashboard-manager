const _ = require('lodash');
const logger = require('../utils/logger');
const fetchGoogleSpreadsheet = require('../utils/googleSheets');

const TemplateReader = require('../utils/TemplateReader');
const HistoryManager = require('../utils/HistoryManager');
const WhatsAppApiService = require('./whatsappApiService');

const groupId = process.env.READINGJOURNEYGROUP || '120363419667302902';

async function getData(tab) {
  const gUrl = 'https://docs.google.com/spreadsheets/d/1E7XMrftLkmHwBdUqzduNNVQybj8M0C831KK-JWEdc1w';
  const gData = await fetchGoogleSpreadsheet(gUrl, tab);
  const data = gData[tab];
  return data;
}

async function readingJourney() {
  const historyContext = 'readingJourney';
  const history = new HistoryManager(historyContext);
  const data = await getData('acompanhamento');

  // Verifica se já houve envio hoje
  const jaHouveEnvioHoje = history.isDuplicated(historyContext, { enviadoHoje: true }, ['enviadoHoje']);
  if (jaHouveEnvioHoje) {
    logger.info('🛑 Já houve envio de acompanhamento hoje. Nenhum novo será enviado.');
    return;
  }

  for (const item of data) {
    const frase = item['Frase'];
    const message = frase;

    // Verifica se essa frase já foi enviada antes
    const jaFoiEnviadaAntes = history.wasEverSent(historyContext, { frase }, ['frase']);

    const outputMessage = {
      type: 'group',
      number: groupId,
      message: message
    };

    if (!jaFoiEnviadaAntes) {
      await WhatsAppApiService.enviarMensagem(outputMessage);

      // Salva a frase e marca que houve envio hoje
      history.save(historyContext, [
        { frase },
        { enviadoHoje: true }
      ], ['frase', 'enviadoHoje']);

      return;
    }
  }

  logger.info('✅ Todas as frases já foram enviadas anteriormente.');
}



async function readingSalmodia() {  
  const data = await getData('salmodia');
  const history = new HistoryManager('salmodia');

  // Verifica se já houve envio hoje (independente do salmo)
  const jaHouveEnvioHoje = history.isDuplicated('salmodia', { enviadoHoje: true }, ['enviadoHoje']);
  if (jaHouveEnvioHoje) {
    logger.info('🛑 Já houve envio de salmodia hoje. Nenhum novo será enviado.');
    return;
  }

  for (const item of data) {
    const salmo = item['Salmo'];
    const message = `*Meditação da Semana*: ${salmo}`;

    // Verifica se esse salmo já foi enviado em qualquer dia
    const jaFoiEnviadoAntes = history.wasEverSent('salmodia', { salmo }, ['salmo']);

    const outputMessage = {
      type: 'group',
      number: groupId,
      message: message
    };

    if (!jaFoiEnviadoAntes) {
      await WhatsAppApiService.enviarMensagem(outputMessage);

      // Salva o salmo e marca que houve envio hoje
      history.save('salmodia', [
        { salmo }, 
        { enviadoHoje: true }
      ], ['salmo', 'enviadoHoje']);

      return;
    }
  }

  logger.info('✅ Todos os salmos já foram enviados anteriormente.');
}


module.exports = { readingJourney, readingSalmodia }
