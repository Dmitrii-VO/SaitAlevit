/**
 * Утилиты для загрузки данных
 * @module utils/fetch
 */

/**
 * Универсальная функция загрузки JSON файлов
 * @param {string} path - Путь к JSON файлу (относительный или абсолютный)
 * @returns {Promise<Object|null>} Объект данных или null при ошибке
 */
export async function fetchJSON(path) {
    try {
        let response = await fetch(path);
        if (!response.ok) {
            // Пробуем абсолютный путь
            response = await fetch('/' + path);
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Ошибка загрузки ${path}:`, error);
        return null;
    }
}
