/**
 * Утилиты для работы с файлами (загрузка изображений)
 */
const fs = require('fs').promises;
const path = require('path');
const stream = require('stream');
const { promisify } = require('util');
const config = require('../config');

const pipeline = promisify(stream.pipeline);

/**
 * Преобразует поток в Buffer
 * @param {stream.Readable} stream - Поток для чтения
 * @returns {Promise<Buffer>}
 */
async function streamToBuffer(stream) {
  const chunks = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    stream.on('error', (error) => {
      reject(error);
    });
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
 * @param {Object} bot - Экземпляр Telegram бота
 * @param {string} fileId - ID файла в Telegram
 * @param {number} maxRetries - Максимальное количество попыток
 * @returns {Promise<{stream: stream.Readable, fileInfo: Object}>}
 */
async function getFileFromTelegram(bot, fileId, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Получаем информацию о файле и поток одновременно
      const [fileStream, fileInfo] = await Promise.all([
        bot.getFileStream(fileId),
        bot.getFile(fileId)
      ]);
      
      return { stream: fileStream, fileInfo };
    } catch (error) {
      lastError = error;
      
      // Проверяем, является ли это сетевой ошибкой, которую можно повторить
      const isRetryableError = 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET' ||
        error.code === 'EAI_AGAIN' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ERR_STREAM_PREMATURE_CLOSE' ||
        (error.message && (
          error.message.includes('timeout') ||
          error.message.includes('Premature close') ||
          error.message.includes('getaddrinfo') ||
          error.message.includes('ECONNREFUSED')
        ));
      
      if (isRetryableError && attempt < maxRetries) {
        const delay = attempt * 1000; // Экспоненциальная задержка
        console.warn(`⚠️ Ошибка при загрузке файла из Telegram (попытка ${attempt}/${maxRetries}), повтор через ${delay}мс:`, error.message || error.code);
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
