const path = require('path');
const fs = require('fs');

class TemplateReader {
  constructor(filePathOrName) {
    if (filePathOrName.includes('/') || filePathOrName.includes('\\')) {
      // Caminho explícito passado
      this.templatePath = path.resolve(__dirname, filePathOrName);
    } else {
      // Apenas o nome do arquivo foi passado
      this.templatePath = path.resolve(__dirname, '../templates', filePathOrName);
    }

    // Lê o conteúdo do template
    this.templateContent = fs.readFileSync(this.templatePath, 'utf8');
  }

  /**
   * Substitui variáveis no template
   * @param {...[string, any]} replacements - pares [variável, valor]
   * @returns {string} - template com variáveis substituídas
   */
  replace(...replacements) {
    let output = this.templateContent;

    for (const [key, value] of replacements) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      const substituted = Array.isArray(value) ? value.join('\n') : value;
      output = output.replace(placeholder, substituted);
    }

    return output;
  }
}

module.exports = TemplateReader;
