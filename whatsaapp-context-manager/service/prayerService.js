const logger = require('../utils/logger');
const capitalize = require('../utils/capitalize');

const fetchGoogleSpreadsheet = require('../utils/googleSheets');
const PrayRulesImplementation = require("./prayer/prayerService");

async function prayer(){
  const gUrl = 'https://docs.google.com/spreadsheets/d/1jnr13Yn9vUGbfVmgo0wEw_Q5ScRbd8br-HXdo3AB1o0';
  const gData = await fetchGoogleSpreadsheet(gUrl, 'prayer360');
  const gdata = gData['prayer360'];
  const data = [];

  if(gdata !== null) {
    logger.info('✅ Getting data ');

  gdata.forEach(people => {
    // people.NOME = capitalize(people.NOME);
    // people.TIPO = capitalize(people.TIPO);

    if(people.INTERCESSOR == 'SIM') people.INTERCESSOR = true;
    
    if(people.TIPO == 'CRIANÇA' || people.TIPO == 'Criança') {
      people.responsavel = [] 
      people.responsavel.push({
        // pai:{nome: capitalize(people.NOMEPAI),numero:people.TELEFONEPAI},
        // mae:{nome: capitalize(people.NOMEMAE), numero:people.TELEFONEMAE}
        pai:{nome: people.NOMEPAI,numero:people.TELEFONEPAI},
        mae:{nome: people.NOMEMAE, numero:people.TELEFONEMAE}
      })
    }

    data.push(people)
  });

  const service = new PrayRulesImplementation(data, {
    contextKey: "prayer",
    campoIntercessor: "INTERCESSOR",
    campoNome: "NOME",
    campoTelefone: "CELULAR",
    campoTipo: "TIPO",
    maxPorIntercessor: 3,
    maxCriancasPorIntercessor: 1,
    limiteFlexivel: 4,
    resetAntecipado: {
      habilitado: true,                  // Habilita o reset antecipado
      tipo: 'proporcional',              // 'fixo', 'dinamico', 'proporcional'
      quantidade: 0.4,                   // Percentual dos candidatos (para 'proporcional')
      limiteProximidade: 30,             // Considera "próximo do fim" se faltam ≤30 pessoas
      limiteDistribuicao: 1.0,           // Ativa reset se distribuição < 100%
      maxTentativas: 3,                  // Máximo de tentativas de reset antes de aceitar distribuição parcial
      tentativasHabilitadas: true        // Habilita sistema de múltiplas tentativas
    }
  });

  const distribuicao = service.generateDistribution();

  // console.log("Distribuição da semana:");
  // console.dir(distribuicao, { depth: null });
  } 
  
  else logger.info('Não foram encontrato dados para processar a Oracao360');
}

module.exports = { prayer }