const path = require('path');
const { google } = require('googleapis');

/**
 * Extrai o ID da planilha a partir da URL do Google Sheets
 */
function extrairIdDaUrl(sheetUrl) {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) {
    throw new Error('ID da planilha não encontrado na URL');
  }
  return match[1];
}

/**
 * Busca os dados da planilha (todas as abas ou apenas uma)
 * Retorna um objeto estruturado com os dados
 */
async function fetchGoogleSpreadsheet(sheetUrl, aba = null, range = 'A1:Z1000') {
  const sheetId = extrairIdDaUrl(sheetUrl);

  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../data/gcredentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheetsApi = google.sheets({ version: 'v4', auth: await auth.getClient() });

  const spreadsheet = await sheetsApi.spreadsheets.get({ spreadsheetId: sheetId });
  const abasDisponiveis = spreadsheet.data.sheets.map(s => s.properties.title);

  const abasAlvo = aba ? [aba] : abasDisponiveis;
  const resultado = {};

  for (const nomeAba of abasAlvo) {
    const res = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${nomeAba}!${range}`,
    });

    const [headers, ...rows] = res.data.values || [];
    resultado[nomeAba] = rows.map(row => {
      const obj = {};
      headers.forEach((key, i) => obj[key] = row[i] || '');
      return obj;
    });
  }

  return resultado;
}

module.exports = fetchGoogleSpreadsheet ;
