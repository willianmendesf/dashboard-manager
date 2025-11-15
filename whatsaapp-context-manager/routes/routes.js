const { setupContextRoutes } = require('./contextRoutes');
const { setupAppRoutes } = require('./appRoutes');

function setupRoutes(app, apiRoute) {
  setupContextRoutes(app, apiRoute); // 👈 Rota genérica que usa middleware
  setupAppRoutes(app, apiRoute);     // (opcional) se quiser manter rotas de info/logs
}

module.exports = { setupRoutes };
