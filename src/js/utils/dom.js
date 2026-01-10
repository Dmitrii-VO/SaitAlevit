/**
 * Утилиты для работы с DOM
 * @module utils/dom
 */

/**
 * Утилиты для работы с DOM элементами
 */
export const $ = {
    /**
     * Выбирает первый элемент по селектору
     * @param {string} selector - CSS селектор
     * @returns {Element|null} Найденный элемент или null
     */
    select: (selector) => document.querySelector(selector),
    
    /**
     * Выбирает все элементы по селектору
     * @param {string} selector - CSS селектор
     * @returns {NodeList} Список найденных элементов
     */
    selectAll: (selector) => document.querySelectorAll(selector),
    
    /**
     * Создает новый DOM элемент
     * @param {string} tag - Тег элемента
     * @param {Object} attributes - Атрибуты элемента
     * @returns {HTMLElement} Созданный элемент
     */
    create: (tag, attributes = {}) => {
        const element = document.createElement(tag);
        Object.assign(element, attributes);
        return element;
    },
    
    /**
     * Выполняет callback когда DOM готов
     * @param {Function} callback - Функция для выполнения
     */
    ready: (callback) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }
};
