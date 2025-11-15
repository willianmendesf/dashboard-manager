exemplo:

const TemplateReader = require('./templateReader');

const template = new TemplateReader('exemplo.txt'); // ou '../../templates/exemplo.txt'

const name = 'william';
const apelido = 'Cafezinho';
const list = [
  'Olá lige par mim: ass Te',
  'e ai cara, fala comigo wa.me/000',
  'fala bro wa:me/000'
];

const finalText = template.replace(
  ['nome', name],
  ['apelido', apelido],
  ['listaDeNomes', list]
);

console.log(finalText);
