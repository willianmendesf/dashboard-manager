const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { parse } = require('csv-parse/sync');

/**
 * Resolve caminho relativo ao módulo chamador
 * @param {string} relativePath - Caminho relativo ao arquivo chamador
 * @param {string} callerPath - __dirname do arquivo que chamou a função
 * @returns {any}
 */
function parseSpreadsheet(relativePath, sheetName = null, callerPath = __dirname) {
  const resolvedPath = path.resolve(callerPath, relativePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Arquivo não encontrado: ${resolvedPath}`);
  }

  const ext = path.extname(resolvedPath).toLowerCase();

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = xlsx.readFile(resolvedPath);
    const sheets = workbook.SheetNames;

    if (sheetName && sheets.includes(sheetName)) {
      const json = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      return { [sheetName]: json };
    }

    const allData = {};
    sheets.forEach(name => {
      allData[name] = xlsx.utils.sheet_to_json(workbook.Sheets[name]);
    });

    return allData;
  }

  if (ext === '.csv') {
    const raw = fs.readFileSync(resolvedPath, 'utf8');
    const records = parse(raw, {
      columns: true,
      skip_empty_lines: true
    });

    return sheetName ? { [sheetName]: records } : records;
  }

  throw new Error('Tipo de arquivo não suportado. Use .xlsx, .xls ou .csv');
}

module.exports = { parseSpreadsheet };
