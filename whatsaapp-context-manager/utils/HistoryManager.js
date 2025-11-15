const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class HistoryManager {
  /**
   * Creates an instance of HistoryManager.
   * @memberof HistoryManager
   */
  constructor() {
    this.historyDir = path.resolve(__dirname, '../data/history');
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
    }
  }

  
  /**
   * Verifica se um dado já existe antes de salvar
   * @param {*} context
   * @param {*} item
   * @param {*} [uniqueKeys=[]]
   * @return {*} 
   * @memberof HistoryManager
   */
  isDuplicated(context, item, uniqueKeys = []) {
    const filePath = path.join(this.historyDir, `${context}.json`);
    if (!fs.existsSync(filePath)) return false;

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const history = JSON.parse(raw);
      const todayDate = new Date().toISOString().split('T')[0];

      if (!history[todayDate]) return false;

      return history[todayDate].some(existing =>
        uniqueKeys.every(key => existing[key] === item[key])
      );
    } catch {
      return false;
    }
  }


  /**
   * Salva conteúdo no histórico, acumulando por data
   * @param {string} context - Nome do contexto
   * @param {any} data - Conteúdo a ser salvo
   */
  save(context, data, uniqueKeys = []) {
    const filePath = path.join(this.historyDir, `${context}.json`);
    let history = {};

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        history = JSON.parse(raw);
      } catch (err) {
        logger.warn(`Histórico de ${context} estava corrompido, já foi recriado e o dado salvo.`);
      }
    }

    const todayDate = new Date().toISOString().split('T')[0];
    if (!history[todayDate]) history[todayDate] = [];

    const input = Array.isArray(data) ? data : [data];

    // Função para verificar se já existe baseado nas chaves únicas
    const isDuplicate = (item) => {
      return history[todayDate].some(existing => {
        const validKey = uniqueKeys.every(key => existing[key] === item[key]);

        if (validKey) {
          const detalhes = uniqueKeys.map(k => `${k}: "${item[k]}"`).join(', ');
          logger.info(`🗂️ [Histórico] Registro já existe nesta data: ${todayDate} — (contexto: ${context}) — ${detalhes}`);
        }

        return validKey;
      });
    };

    input.forEach(item => {
      if (uniqueKeys.length === 0 || !isDuplicate(item)) history[todayDate].push(item);
    });

    // 🔍 Se nenhum item foi adicionado, remove a data antes de salvar
    if (history.hasOwnProperty(todayDate) && history[todayDate].length === 0) {
      delete history[todayDate];
    }

    // 💾 Salva o histórico atualizado
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf8');
  }


  /**
   * Lê o conteúdo completo do histórico de um contexto
   * @param {string} context - Nome do contexto
   * @returns {object|null} Histórico completo ou null
   */
  read(context) {
    const filePath = path.join(this.historyDir, `${context}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      throw new Error(`Erro ao ler histórico do contexto "${context}": ${err.message}`);
    }
  }


  /**
   * Verifica se um item já foi enviado em qualquer data
   * @param {string} context - Nome do contexto
   * @param {object} item - Item a verificar
   * @param {string[]} uniqueKeys - Chaves únicas para comparação
   * @returns {boolean} true se já foi enviado em qualquer data
   */
  wasEverSent(context, item, uniqueKeys = []) {
    const filePath = path.join(this.historyDir, `${context}.json`);
    if (!fs.existsSync(filePath)) return false;

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const history = JSON.parse(raw);

      return Object.values(history).some(entries =>
        entries.some(existing =>
          uniqueKeys.every(key => existing[key] === item[key])
        )
      );
    } catch {
      return false;
    }
  }

  /**
   * contextKey	Define qual é o nome do arquivo de histórico (ex: "prayer") 
   * target	Nome ou valor que você quer contar
   * path	Caminho até o campo desejado, em forma de array (ex: ["prayerList"])
   * @param {*} contextKey
   * @param {*} target
   * @param {*} [path=[]]
   * @return {*} 
   * @memberof HistoryManager
   */
  getEntryCountFor(contextKey, target, path = []) {
    const historyData = this.read(contextKey);
    if (!historyData) return 0;

    let count = 0;
    Object.values(historyData).forEach(dayList => {
      dayList.forEach(entry => {
        let pointer = entry;
        for (let key of path) {
          pointer = pointer?.[key];
          if (!pointer) return;
        }

        if (pointer === target) count++;
        else if (Array.isArray(pointer)) {
          pointer.forEach(item => {
            if (typeof item === "object" && item.nome === target) {
              count++;
            } else if (item === target) {
              count++;
            }
          });
        }
      });
    });
    return count;
  }

  /**
   * Remove todos os registros de um item específico no histórico
   * @param {string} context - Nome do contexto (ex: "prayer")
   * @param {object} item - Item a ser removido (ex: { nome: "Ana" })
   * @param {string[]} uniqueKeys - Chaves para identificar o item (ex: ["nome"])
   * @returns {boolean} true se houve alteração
   */
  clearHistoryFor(context, item, uniqueKeys = []) {
    const filePath = path.join(this.historyDir, `${context}.json`);
    if (!fs.existsSync(filePath)) return false;

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const history = JSON.parse(raw);
      let changed = false;

      Object.keys(history).forEach(date => {
        const originalLength = history[date].length;

        history[date] = history[date].filter(entry => {
          return !uniqueKeys.every(key => entry[key] === item[key]);
        });

        if (history[date].length < originalLength) changed = true;
        if (history[date].length === 0) delete history[date];
      });

      if (changed) {
        fs.writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf8');
      }

      return changed;
    } catch (err) {
      logger.error(`Erro ao limpar histórico de ${context} para ${JSON.stringify(item)}: ${err.message}`);
      return false;
    }
  }
}

module.exports = HistoryManager;
