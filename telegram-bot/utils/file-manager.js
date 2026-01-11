/**
 * Утилиты для работы с файлами (загрузка изображений)
 */
const fs = require('fs').promises;
const path = require('path');
const stream = require('stream');
const { promisify } = require('util');
const config = require('../config');
const logger = require('./logger');

const pipeline = promisify(stream.pipeline);

/**
 * Преобразует поток в Buffer
 * @param {stream.Readable} stream - Поток для чтения
 * @returns {Promise<Buffer>}
 */
// Функция streamToBuffer оставлена для совместимости, но сейчас не используется
async function streamToBuffer(stream) {
  const chunks = [];
  let receivedBytes = 0;
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      logger.error('Timeout при чтении потока', new Error('Timeout'), { receivedBytes });
      reject(new Error('Timeout при чтении потока (30 секунд)'));
    }, 30000);
    
    stream.on('data', (chunk) => {
      chunks.push(chunk);
      receivedBytes += chunk.length;
      logger.debug('Получен chunk потока', { chunkSize: chunk.length, totalBytes: receivedBytes });
    });
    
    stream.on('end', () => {
      clearTimeout(timeout);
      const buffer = Buffer.concat(chunks);
      logger.debug('Поток завершен', { totalBytes: buffer.length, chunksCount: chunks.length });
      resolve(buffer);
    });
    
    stream.on('error', (error) => {
      clearTimeout(timeout);
      logger.error('Ошибка при чтении потока', error, { receivedBytes, chunksCount: chunks.length });
      reject(error);
    });
    
    // Обрабатываем случай, когда поток может быть уже закрыт
    if (stream.readable === false && stream.readableEnded) {
      clearTimeout(timeout);
      const buffer = Buffer.concat(chunks);
      logger.debug('Поток уже завершен при создании', { totalBytes: buffer.length });
      resolve(buffer);
    }
  });
}

/**
 * Сохраняет файл из Telegram
 * @param {Object} fileStream - Поток файла из бота
 * @param {string} fileName - Имя файла
 * @param {string} subfolder - Подпапка (projects, works, reviews)
 * @returns {Promise<string>} - Путь к сохраненному файлу
 */
async function saveFile(fileStream, fileName, subfolder = 'uploads', maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Создаём безопасное имя файла
      const safeFileName = sanitizeFileName(fileName);
      const timestamp = Date.now();
      const fileExtension = path.extname(safeFileName) || '.jpg';
      const baseName = path.basename(safeFileName, fileExtension);
      const finalFileName = `${baseName}-${timestamp}${fileExtension}`;
      
      // Путь для сохранения
      const saveDir = path.join(config.imagesPath, subfolder);
      await fs.mkdir(saveDir, { recursive: true });
      
      const filePath = path.join(saveDir, finalFileName);
      
      // Преобразуем поток в Buffer перед сохранением
      // Это необходимо, так как fs.writeFile ожидает Buffer, а не поток
      let buffer;
      
      // Проверяем, является ли fileStream уже Buffer
      if (Buffer.isBuffer(fileStream)) {
        buffer = fileStream;
      } else if (fileStream && typeof fileStream.pipe === 'function') {
        // Это поток - преобразуем в Buffer
        buffer = await streamToBuffer(fileStream);
      } else {
        throw new Error('Неподдерживаемый тип данных для сохранения файла');
      }
      
      // Сохраняем файл
      await fs.writeFile(filePath, buffer);
      
      // Возвращаем относительный путь для использования в HTML
      return `images/${subfolder}/${finalFileName}`;
    } catch (error) {
      lastError = error;
      
      // Если это ошибка преждевременного закрытия потока или сетевые ошибки, пробуем снова
      if (error.code === 'ERR_STREAM_PREMATURE_CLOSE' || 
          error.code === 'ECONNRESET' || 
          error.code === 'ETIMEDOUT' ||
          error.message && error.message.includes('Premature close')) {
        if (attempt < maxRetries) {
          const delay = attempt * 1000; // Экспоненциальная задержка
          console.warn(`⚠️ Ошибка при сохранении файла (попытка ${attempt}/${maxRetries}), повтор через ${delay}мс:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Повторяем попытку
        }
      }
      
      // Для других ошибок или если попытки закончились - выбрасываем ошибку
      console.error('Ошибка сохранения файла:', error);
      throw error;
    }
  }
  
  // Если все попытки не удались
  throw lastError;
}

/**
 * Удаляет файл
 * @param {string} filePath - Путь к файлу
 * @returns {Promise<boolean>}
 */
async function deleteFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Файл уже не существует
      return true;
    }
    console.error('Ошибка удаления файла:', error);
    return false;
  }
}

/**
 * Очищает имя файла от небезопасных символов
 * @param {string} fileName - Исходное имя файла
 * @returns {string}
 */
function sanitizeFileName(fileName) {
  // Убираем все небезопасные символы, оставляем только буквы, цифры, точки и дефисы
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_').substring(0, 100);
}

/**
 * Проверяет тип файла
 * @param {string} mimeType - MIME тип файла
 * @returns {boolean}
 */
function isValidImageType(mimeType) {
  return config.allowedImageTypes.includes(mimeType);
}

/**
 * Проверяет размер файла
 * @param {number} fileSize - Размер файла в байтах
 * @returns {boolean}
 */
function isValidFileSize(fileSize) {
  return fileSize <= config.maxFileSize;
}

/**
 * Безопасная загрузка файла из Telegram API с повторными попытками
 * Использует встроенный метод bot.getFileStream, который поддерживает прокси и настройки бота
 * @param {Object} bot - Экземпляр Telegram бота
 * @param {string} fileId - ID файла в Telegram
 * @param {number} maxRetries - Максимальное количество попыток
 * @returns {Promise<{buffer: Buffer, fileInfo: Object}>}
 */
async function getFileFromTelegram(bot, fileId, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`📥 Попытка ${attempt}/${maxRetries} загрузки файла`, { fileId: fileId.substring(0, 20) + '...', attempt, maxRetries });

      // Сначала получаем информацию о файле
      logger.debug('Вызов bot.getFile()', { fileId: fileId.substring(0, 20) + '...' });
      const fileInfo = await bot.getFile(fileId);
      logger.info(`✅ Информация о файле получена`, { filePath: fileInfo.file_path, fileSize: fileInfo.file_size });

      // Используем прямой HTTPS-запрос с использованием настроек прокси из config
      const https = require('https');
      const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.file_path}`;
      
      logger.debug('Загрузка файла через HTTPS', { fileUrl: fileUrl.replace(bot.token, 'TOKEN_HIDDEN'), filePath: fileInfo.file_path });
      
      const buffer = await new Promise((resolve, reject) => {
        const chunks = [];
        let totalSize = 0;
        const timeout = setTimeout(() => {
          logger.error('Timeout при загрузке файла', new Error('Timeout'), { filePath: fileInfo.file_path, totalSize });
          reject(new Error('Timeout при загрузке файла (30 секунд)'));
        }, 30000);

        const requestOptions = {
          timeout: 30000
        };
        
        // Добавляем прокси, если настроен (через переменные окружения)
        if (config.proxy.enabled && config.proxy.host && config.proxy.port) {
          // Для HTTPS через HTTP прокси нужно использовать другой подход
          // Пока используем без прокси для файлов, так как прокси может быть настроен на уровне бота
          logger.debug('Прокси настроен, но для прямого HTTPS не используется', { proxy: config.proxy.host });
        }

        const req = https.get(fileUrl, requestOptions, (res) => {
          logger.debug('Получен ответ HTTP', { statusCode: res.statusCode, headers: res.headers });
          
          if (res.statusCode !== 200) {
            clearTimeout(timeout);
            const error = new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
            logger.error('Ошибка HTTP при загрузке файла', error, { statusCode: res.statusCode, statusMessage: res.statusMessage });
            reject(error);
            return;
          }

          res.on('data', (chunk) => {
            chunks.push(chunk);
            totalSize += chunk.length;
            logger.debug('Получен chunk данных', { chunkSize: chunk.length, totalSize });
          });

          res.on('end', () => {
            clearTimeout(timeout);
            const buffer = Buffer.concat(chunks);
            logger.debug('Загрузка файла завершена', { totalSize: buffer.length, chunksCount: chunks.length });
            resolve(buffer);
          });

          res.on('error', (error) => {
            clearTimeout(timeout);
            logger.error('Ошибка при чтении ответа', error, { totalSize });
            reject(error);
          });
        });

        req.on('error', (error) => {
          clearTimeout(timeout);
          logger.error('Ошибка HTTP-запроса', error, { fileUrl: fileUrl.replace(bot.token, 'TOKEN_HIDDEN') });
          reject(error);
        });
        
        req.on('timeout', () => {
          req.destroy();
          clearTimeout(timeout);
          logger.error('Timeout HTTP-запроса', new Error('Request timeout'), { filePath: fileInfo.file_path });
          reject(new Error('Request timeout'));
        });
      });

      logger.info(`✅ Файл загружен`, { bufferSize: buffer.length, filePath: fileInfo.file_path });
      return { buffer, fileInfo };
    } catch (error) {
      lastError = error;
      logger.error(`❌ Ошибка при загрузке файла (попытка ${attempt}/${maxRetries})`, error, {
        fileId: fileId.substring(0, 20) + '...',
        attempt,
        maxRetries,
        errorCode: error.code,
        errorName: error.name
      });

      // Проверяем, является ли это сетевой ошибкой, которую можно повторить
      const isRetryableError =
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET' ||
        error.code === 'EAI_AGAIN' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ERR_STREAM_PREMATURE_CLOSE' ||
        error.code === 'EFATAL' ||
        error.message.includes('timeout') ||
        error.message.includes('Timeout') ||
        (error.message && (
          error.message.includes('Premature close') ||
          error.message.includes('getaddrinfo') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('AggregateError')
        ));

      if (isRetryableError && attempt < maxRetries) {
        const delay = attempt * 1000; // Экспоненциальная задержка
        logger.warn(`⚠️ Повтор через ${delay}мс...`, { attempt, maxRetries, delay });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Для других ошибок или если попытки закончились - выбрасываем ошибку
      throw error;
    }
  }

  throw lastError;
}

module.exports = {
  saveFile,
  deleteFile,
  sanitizeFileName,
  isValidImageType,
  isValidFileSize,
  getFileFromTelegram
};
