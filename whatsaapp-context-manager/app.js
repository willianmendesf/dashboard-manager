const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const logger = require('./utils/logger');
const responseHandler = require('./middlewares/responseHandler');

const { setupRoutes } = require('./routes/routes');
const { initializeWhatsApp, startServer } = require('./config/server');

const express = require('express');
const app = express();

app.use(express.json());
app.use(responseHandler); 

const PORT = process.env.PORT || 3400;
const apiRoute =  process.env.API_ROUTE || '/api/v1';

// Inicializa o sistema com API externa
initializeWhatsApp();

// Rotas
setupRoutes(app, apiRoute);

// Inicia o servidor
startServer(app, PORT);