📘 README – Spreadsheet Import Utilities

Este projeto contém utilitários para leitura e transformação de planilhas em formato .csv, .xlsx e do Google Sheets em objetos JSON estruturados.

const { parseSpreadsheet } = require('./utils/parseFile');

const dados = parseSpreadsheet('./files/contacts.csv');
console.log(dados); // Retorna array de objetos
📄 Processando uma aba específica de .xlsx
js


const { parseSpreadsheet } = require('./utils/parseFile');

const dadosXlsx = parseSpreadsheet('./files/exemplo.xlsx', 'Clientes');
console.log(dadosXlsx); // Retorna { Clientes: [...] }


🌐 Como usar: Google Sheets
🔐 Pré-requisitos

Salve seu arquivo de credenciais como: src/files/gcredentials.json

Compartilhe a planilha com o e-mail do serviço presente nas credenciais

✨ Exemplo de uso
js
const { fetchGoogleSpreadsheet } = require('./utils/googleSheets');

const url = 'https://docs.google.com/spreadsheets/d/1AbCdefGHIJkLmNopQRstuVWXYZ/edit#gid=0';


// Todas as abas
const todasAbas = await fetchGoogleSpreadsheet(url);
console.log(todasAbas); // Retorna { aba1: [...], aba2: [...] }

// Apenas uma aba específica
const abaUnica = await fetchGoogleSpreadsheet(url, 'Clientes');
console.log(abaUnica); // Retorna { Clientes: [...] }
🧠 Resultado dos utilitários
Todos os métodos retornam objetos estruturados como:

js
{
  "Clientes": [
    { "Nome": "Maria", "Telefone": "999999999" },
    { "Nome": "João", "Telefone": "888888888" }
  ]
}