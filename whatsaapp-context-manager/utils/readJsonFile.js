const fs = require('fs');
const path = require('path');

/**
 * Lê um arquivo .json da pasta /src/data
 * @param {string} fileName - Nome do arquivo (ex: dados.json)
 * @returns {object} Conteúdo como JSON
 */
function readJsonFile(fileName) {
  const filePath = path.resolve(__dirname, '../data', fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }

  const rawContent = fs.readFileSync(filePath, 'utf8');

  try {
    return JSON.parse(rawContent);
  } catch (error) {
    throw new Error(`Falha ao parsear JSON: ${error.message}`);
  }
}

module.exports = { readJsonFile };
