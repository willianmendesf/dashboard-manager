const path = require('path');
const logger = require('../utils/logger');

/**
 * Configura as rotas principais da aplicação
 * @param {Express} app - Instância do Express
 */
function setupAppRoutes(app, apiRoute) {
  // Rota para informações da aplicação
  app.get('/app/info', (req, res) => {
    const pkg = require('../../package.json');
    res.json({name: pkg.name, version: pkg.version, description: pkg.description});
  });

  app.get('/app/logs/history', async (req, res) => {
    const logs = await logger.getLogHistory();
    res.send(logs);
  });

  // Rota para a página de status/logs
  app.get('/status', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'status.html'));
  });
}

module.exports = { setupAppRoutes };
