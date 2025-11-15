const path = require('path');
const logger = require('../utils/logger');
const whatsappApiService = require('../service/whatsappApiService');

/**
 * Inicializa o sistema usando API externa
 */
function initializeWhatsApp() {
  logger.info('🚀 Inicializando sistema com API externa de WhatsApp...');
  
  // Testa conectividade com a API externa
  whatsappApiService.testarConectividade()
    .then(conectado => {
      if (conectado) {
        logger.info('✅ Sistema inicializado - usando API externa');
      } else {
        logger.warn('⚠️ API externa pode não estar disponível');
      }
    })
    .catch(error => {
      logger.error('❌ Erro ao testar API externa:', error.message);
    });

  // Log das configurações atuais
  const config = whatsappApiService.getConfig();
  // logger.info(`⚙️ Configurações: URL=${config.apiUrl}, Timeout=${config.timeout}ms`);
}

/**
 * Inicia o servidor na porta especificada
 * @param {Express} app - Instância do Express
 * @param {number} port - Porta do servidor
 */
function startServer(app, port) {
  app.listen(port, () => {
    logger.info(`🚀 Server is running on http://localhost:${port}`);
  });
}

module.exports = { 
  initializeWhatsApp, 
  startServer 
};
