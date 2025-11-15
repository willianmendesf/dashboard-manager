const logger = require('../utils/logger');
const fetchGoogleSpreadsheet = require('../utils/googleSheets');
const HistoryManager = require('../utils/HistoryManager');
const WhatsAppApiService = require('./whatsappApiService');

const number = process.env.LOVE || '5511966152161';

async function getData(tab) {
  const gUrl = 'https://docs.google.com/spreadsheets/d/1UYNVFV8nkbllOgtBhlgoi56aIP741suFQtu_KpE2OLQ';
  const gData = await fetchGoogleSpreadsheet(gUrl, tab);
  const data = gData[tab];
  return data;
}

async function lovePhrases() {
  const data = await getData('phrases')
  const history = new HistoryManager('love');
  
  for (const item of data) {
    const frase = item['Frase'];
    const ref = item['Referencia'];
    const message = `${frase} ${ref}`;

    const jaFoiEnviada = history.wasEverSent('love', { frase }, ['frase']);

    const outputMessage = {
      type: 'individual',
      number: number,
      message: message
    };

    if (!jaFoiEnviada) {
      await WhatsAppApiService.enviarMensagem(outputMessage);
      history.save('love', { frase }, ['frase']);
      return;
    }
  }
}

async function loveIdeas() {
  const data = await getData('ideas')
  const history = new HistoryManager('love');
  
  for (const item of data) {
    const idea = item['Ideas'];

    const jaFoiEnviada = history.wasEverSent('loveideas', { idea }, ['idea']);

    const outputMessage = {
      type: 'individual',
      number: number,
      message: `Segue a ideia de amor do dia: *${idea}*`
    };

    if (!jaFoiEnviada) {
      await WhatsAppApiService.enviarMensagem(outputMessage);
      history.save('loveideas', { idea }, ['idea']);
      return;
    }
  }
}

module.exports = { lovePhrases, loveIdeas }