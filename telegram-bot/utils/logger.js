/**
 * Утилита для логирования в файл и консоль
 */
const fs = require('fs').promises;
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'bot.log');

/**
 * Обеспечивает существование директории для логов
 */
async function ensureLogDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch (error) {
    // Игнорируем ошибки создания директории
  }
}

/**
 * Записывает сообщение в лог-файл
 * @param {string} level - Уровень логирования (INFO, ERROR, WARN, DEBUG)
 * @param {string} message - Сообщение для логирования
 * @param {Object} data - Дополнительные данные
 */
async function writeLog(level, message, data = {}) {
  try {
    await ensureLogDir();
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    await fs.appendFile(LOG_FILE, logLine, 'utf8');
  } catch (error) {
    // Если не удалось записать в файл, выводим в консоль
    console.error('❌ Ошибка записи в лог-файл:', error.message);
  }
}

/**
 * Логирует информационное сообщение
 */
function info(message, data) {
  console.log(message);
  writeLog('INFO', message, data).catch(() => {});
}

/**
 * Логирует предупреждение
 */
function warn(message, data) {
  console.warn(message);
  writeLog('WARN', message, data).catch(() => {});
}

/**
 * Логирует ошибку
 */
function error(message, error, data) {
  const errorData = {
    ...data,
    error: {
      message: error?.message || error,
      code: error?.code,
      stack: error?.stack
    }
  };
  console.error(message, error);
  writeLog('ERROR', message, errorData).catch(() => {});
}

/**
 * Логирует отладочную информацию
 */
function debug(message, data) {
  console.log(`[DEBUG] ${message}`);
  writeLog('DEBUG', message, data).catch(() => {});
}

module.exports = {
  info,
  warn,
  error,
  debug,
  writeLog
};
