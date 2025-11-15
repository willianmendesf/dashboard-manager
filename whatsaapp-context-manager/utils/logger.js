const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const pkg = require('../../package.json');

class Logger extends EventEmitter {
  constructor() {
    super();
    this.logDir = path.join(__dirname, '../logs');
    this.logFile = path.join(this.logDir, `${pkg.name}.log`);
    this.ensureLogDir();
    this.interceptConsole();
  }

  async ensureLogDir() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório de logs:', error);
    }
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  format(level, message, ...args) {
    const timestamp = this.formatTimestamp();
    const formattedArgs = args.length ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' ') : '';
    
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  async writeLog(level, message, ...args) {
    const logEntry = this.format(level, message, ...args) + '\n';
    
    try {
      await fs.appendFile(this.logFile, logEntry);
      this.emit('log', logEntry);
      
      if (level === 'ERROR') {
        process.stderr.write(logEntry);
      } else {
        process.stdout.write(logEntry);
      }
    } catch (error) {
      console.error('Erro ao escrever log:', error);
    }
  }

  info(message, ...args) {
    this.writeLog('INFO', message, ...args);
  }

  error(message, ...args) {
    this.writeLog('ERROR', message, ...args);
  }

  warn(message, ...args) {
    this.writeLog('WARN', message, ...args);
  }

  debug(message, ...args) {
    this.writeLog('DEBUG', message, ...args);
  }

  setupSSE(app) {
    app.get('/app/status', (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const sendLog = (logEntry) => {
        res.write(`data: ${logEntry}\n\n`);
      };

      this.on('log', sendLog);

      req.on('close', () => {
        this.removeListener('log', sendLog);
      });
    });
  }

  async getLogHistory() {
    try {
      return await fs.readFile(this.logFile, 'utf8');
    } catch (error) {
      return 'Nenhum log disponível.';
    }
  }

  // Intercepta console.log, console.error, etc. para também salvar no arquivo
  interceptConsole() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = (...args) => {
      this.info(...args);
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      this.error(...args);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      this.warn(...args);
      originalWarn.apply(console, args);
    };

    console.info = (...args) => {
      this.info(...args);
      originalInfo.apply(console, args);
    };
  }
}

// Exporta única instância
module.exports = new Logger();
