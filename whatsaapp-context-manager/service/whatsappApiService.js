const logger = require('../utils/logger');

/**
 * Serviço para integração com API externa de WhatsApp
 */
class WhatsAppApiService {
  constructor() {
    // URL base da API externa
    this.apiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:3000';
    this.timeout = parseInt(process.env.WHATSAPP_API_TIMEOUT) || 30000; // 30 segundos
  }

  /**
   * Envia mensagem através da API externa
   * @param {Object} dados - Dados da mensagem
   * @param {string} dados.type - Tipo: 'individual' ou 'group'
   * @param {string} dados.number - Número do destinatário
   * @param {string} dados.message - Mensagem a ser enviada
   * @param {Object} dados.media - Dados de mídia (opcional)
   * @param {Array} dados.fallbackList - Lista de fallback (opcional)
   * @returns {Promise<Object>} Resultado do envio
   */
  async enviarMensagem(dados) {
    try {
      logger.info(`📤 Enviando mensagem via API externa para ${dados.type}: ${dados.number}`);
      
      // Validação básica
      if (!dados.number || !dados.message) {
        throw new Error('Dados obrigatórios não fornecidos (number, message)');
      }

      // Formata o número para o novo padrão
      const numeroFormatado = dados.number.replace('@c.us', '@s.whatsapp.net');

      const payload = {
        phone: numeroFormatado,
        message: dados.message,
        is_forwarded: dados.is_forwarded || false
      }; 

      // Adiciona Mentions se fornecido
      if (dados.mentions) {
        payload.mentions = dados.mentions;
      }

      // Adiciona mídia se fornecida
      if (dados.media) {
        payload.media = dados.media;
      }

      // Adiciona fallback se fornecido
      if (dados.fallbackList) {
        payload.fallbackList = dados.fallbackList;
      }

      // logger.info(`📡 Payload: ${JSON.stringify(payload, null, 2)}`);

      // Faz a requisição HTTP
      const response = await this.makeHttpRequest(payload);
      
      if (response.success) {
        logger.info(`✅ Mensagem enviada com sucesso para ${dados.number}`);
        return { success: true, data: response.data };
      } else {
        logger.error(`❌ Falha no envio para ${dados.number}: ${response.error}`);
        return { success: false, error: response.error };
      }

    } catch (error) {
      logger.error(`❌ Erro ao enviar mensagem para ${dados.number}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Faz a requisição HTTP para a API externa
   * @param {Object} payload - Dados a serem enviados
   * @returns {Promise<Object>} Resposta da API
   */
  async makeHttpRequest(payload) {
    // Como não podemos instalar dependências, vamos usar o módulo nativo do Node.js
    const https = require('https');
    const http = require('http');
    const url = require('url');

    return new Promise((resolve, reject) => {
      const parsedUrl = url.parse(`${this.apiUrl}/send/message`);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const postData = JSON.stringify(payload);

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'WhatsApp-Message-Dispatcher/1.2.0'
        },
        timeout: this.timeout
      };

      const req = client.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (res.statusCode >= 200 && res.statusCode < 300 && response.code === 'SUCCESS') {
              resolve({ 
                success: true, 
                data: {
                  messageId: response.results.message_id,
                  status: response.results.status
                }
              });
            } else {
              resolve({ 
                success: false, 
                error: response.message || `HTTP ${res.statusCode}: ${data}` 
              });
            }
          } catch (parseError) {
            resolve({ 
              success: false, 
              error: `Erro ao interpretar resposta da API: ${parseError.message}` 
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Erro de rede: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout na requisição para API externa'));
      });

      // Envia os dados
      req.write(postData);
      req.end();
    });
  }

  /**
   * Testa a conectividade com a API externa
   * @returns {Promise<boolean>} Se a API está acessível
   */
  async testarConectividade() {
    try {
      logger.info('🔍 Testando conectividade com API externa...');
      
      // Faz uma requisição de teste (pode precisar de um endpoint específico de health check)
      const resultado = await this.enviarMensagem({
        number: '5511966152161', // Número de teste
        message: 'Teste de conectividade - ignorar',
        is_forwarded: false
      });

      if (resultado.success || resultado.error.includes('não encontrado')) {
        logger.info('✅ API externa está acessível');
        return true;
      } else {
        logger.warn('⚠️ API externa pode não está funcionando corretamente');
        return false;
      }
    } catch (error) {
      logger.error(`❌ Erro ao testar conectividade: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtém configurações da API
   * @returns {Object} Configurações atuais
   */
  getConfig() {
    return {
      apiUrl: `${this.apiUrl}/send/message`,
      timeout: this.timeout
    };
  }

  /**
   * Atualiza configurações da API
   * @param {Object} novasConfigs - Novas configurações
   */
  updateConfig(novasConfigs) {
    if (novasConfigs.apiUrl) {
      this.apiUrl = novasConfigs.apiUrl;
    }
    if (novasConfigs.timeout) {
      this.timeout = novasConfigs.timeout;
    }
    logger.info('⚙️ Configurações da API atualizadas');
  }
}

module.exports = new WhatsAppApiService();
