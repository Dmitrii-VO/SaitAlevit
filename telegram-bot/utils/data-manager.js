/**
 * Утилиты для работы с JSON файлами данных
 */
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

/**
 * Читает JSON файл
 * @param {string} dataType - Тип данных ('projects', 'works', 'reviews', 'contacts')
 * @returns {Promise<Object>}
 */
async function readData(dataType) {
  try {
    const filePath = config.dataPaths[dataType];
    if (!filePath) {
      throw new Error(`Неизвестный тип данных: ${dataType}`);
    }
    
    const fullPath = path.resolve(filePath);
    const data = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Файл не существует, возвращаем пустую структуру
      return getDefaultStructure(dataType);
    }
    throw error;
  }
}

/**
 * Записывает данные в JSON файл
 * @param {string} dataType - Тип данных
 * @param {Object} data - Данные для записи
 * @returns {Promise<void>}
 */
async function writeData(dataType, data) {
  try {
    const filePath = config.dataPaths[dataType];
    if (!filePath) {
      throw new Error(`Неизвестный тип данных: ${dataType}`);
    }
    
    const fullPath = path.resolve(filePath);
    const dir = path.dirname(fullPath);
    
    // Создаём директорию, если её нет
    await fs.mkdir(dir, { recursive: true });
    
    // Записываем данные с форматированием
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Ошибка записи данных ${dataType}:`, error);
    throw error;
  }
}

/**
 * Возвращает структуру по умолчанию для типа данных
 * @param {string} dataType - Тип данных
 * @returns {Object}
 */
function getDefaultStructure(dataType) {
  const structures = {
    projects: { projects: [] },
    works: { works: [] },
    reviews: { reviews: [] },
    contacts: {
      phone: "+7 (XXX) XXX-XX-XX",
      email: "info@alevit-stroy.ru",
      address: "Белгородская область, Белгородский район, с. Пушкарное-78, ул. Кузнечная, д. 9",
      whatsapp: "#",
      telegram: "#"
    },
    prices: {
      prices: {
        shell: 45000,
        clean: 65000,
        turnkey: 80000
      }
    }
  };
  
  return structures[dataType] || {};
}

/**
 * Генерирует уникальный ID для элемента
 * @param {string} dataType - Тип данных
 * @returns {Promise<string>}
 */
async function generateId(dataType) {
  const data = await readData(dataType);
  const items = data[dataType] || data; // projects/projects или contacts
  const maxId = items.length > 0 
    ? Math.max(...items.map(item => {
        const id = parseInt(item.id) || 0;
        return isNaN(id) ? 0 : id;
      }))
    : 0;
  
  return String(maxId + 1);
}

/**
 * Находит элемент по ID
 * @param {string} dataType - Тип данных
 * @param {string} id - ID элемента
 * @returns {Promise<Object|null>}
 */
async function findById(dataType, id) {
  const data = await readData(dataType);
  const items = data[dataType] || [];
  return items.find(item => String(item.id) === String(id)) || null;
}

/**
 * Удаляет элемент по ID
 * @param {string} dataType - Тип данных
 * @param {string} id - ID элемента
 * @returns {Promise<boolean>}
 */
async function deleteById(dataType, id) {
  const data = await readData(dataType);
  const items = data[dataType] || [];
  const index = items.findIndex(item => String(item.id) === String(id));
  
  if (index === -1) {
    return false;
  }
  
  items.splice(index, 1);
  data[dataType] = items;
  await writeData(dataType, data);
  return true;
}

module.exports = {
  readData,
  writeData,
  generateId,
  findById,
  deleteById,
  getDefaultStructure
};
