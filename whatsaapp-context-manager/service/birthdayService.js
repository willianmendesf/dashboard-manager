const logger = require('../utils/logger');
const fetchGoogleSpreadsheet = require('../utils/googleSheets');

const HistoryManager = require('../utils/HistoryManager');
const TemplateReader = require('../utils/TemplateReader');
const WhatsAppApiService = require('./whatsappApiService');

async function birthday() {
  const groupId = process.env.BIRTHDAYGROUP || '120363419667302902';
  
  const history = new HistoryManager('birthday');
  const gUrl = 'https://docs.google.com/spreadsheets/d/1jnr13Yn9vUGbfVmgo0wEw_Q5ScRbd8br-HXdo3AB1o0';
  const gData = await fetchGoogleSpreadsheet(gUrl, 'birthday');

  const peoples = gData['birthday'].filter(people => validTypeReg(people));
  const template = new TemplateReader('birthday.txt');

  for (people of peoples) {
    let name    = validInputs(people['Nome']);
    let nasc    = validInputs(people['Nascimento']);
    let phone   = validInputs(people['Celular']);

    if (isBirthdayToday(nasc)) {
      const message = phone !== '' 
        ? template.replace(['name', `@${getFirstAndLastName(name)}`]) 
        : template.replace(['name', `@${getFirstAndLastName(name)}`])
        
      let outputMessage = {
        type: 'group',
        number: groupId,
        message: message
      }

      if (phone != '') outputMessage.mentions = [`55${phone}@c.us`]
      
      const validHistory = history.isDuplicated('birthday', {name:name, message:'Mensagem de aniversário enviada!'}, [name]);
      
      // Valida se já havia sido enviada, se não, envia.
      if(!validHistory) {
        await WhatsAppApiService.enviarMensagem(outputMessage);
        history.save('birthday', {name:name, message:'Mensagem de aniversário enviada!'}, [name]);
      } 
      
      else logger.info(`A mensagem de aniversário para ${getFirstAndLastName(name)} já havia sido processada!`);
    }
  }
} 

// Valida se hoje é o aniversário da pessoa
function isBirthdayToday(birthDateStr) {
  const [day, month, year] = birthDateStr.split('/');
  const birthDay = parseInt(day, 10);
  const birthMonth = parseInt(month, 10) - 1; // Janeiro = 0 em JavaScript

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();

  return todayDay === birthDay && todayMonth === birthMonth;
}

// Elimina do registro com filtro.
function validTypeReg(people){
  let type      = people['Tipo Cadastro'];
  let subtype   = people['Subtipo'];
  let lgpd      = people['LGPD']

  if((type != '' || type != 'Visitante') && (lgpd == 'Sim') && (subtype != 'NÃO COMUNGANTE' || subtype != 'ROL EM SEPARADO POR AUSÊNCIA'))
    return subtype;

  // 'NÃO COMUNGANTE'
  // 'ROL EM SEPARADO POR AUSÊNCIA'
  // 'AUXILIAR'
  // 'COMUNGANTE'
  // 'EFETIVO'
  // 'SEMINARISTA'
}

// 👤 Pega o primeiro nome
function getFirstName(fullName) {
  if (typeof fullName !== 'string') return '';
  const formattedName = capitalizeWords(fullName);
  return formattedName.trim().split(' ')[0];
}

// 👥 Pega o primeiro e o último nome
function getFirstAndLastName(fullName) {
  if (typeof fullName !== 'string' || fullName.trim() === '') return '';
  const formattedName = capitalizeWords(fullName);
  const partials = formattedName.trim().split(/\s+/);
  const first = partials[0];
  const last = partials[partials.length - 1];
  return `${first} ${last}`;
}

// 🔠 Converte todo nome para capitalização correta
function capitalizeWords(name) {
  if (typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// valida o valor dos campos passados
function validInputs(param) {
  return param !== '' ? param : null;
}

module.exports = { birthday };