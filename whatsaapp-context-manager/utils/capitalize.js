function capitalize(text) {
  return text
    .toLowerCase() // transforma tudo em minúsculo
    .split(' ')    // separa em palavras
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');    // junta tudo de novo
}

module.exports = capitalize;