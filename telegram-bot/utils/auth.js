/**
 * Утилиты для авторизации
 */
const config = require('../config');

/**
 * Проверяет, является ли пользователь администратором
 * @param {number} userId - ID пользователя Telegram
 * @returns {boolean}
 */
function isAuthorized(userId) {
  return config.adminIds.includes(userId);
}

/**
 * Получает список администраторов
 * @returns {number[]}
 */
function getAdminIds() {
  return config.adminIds;
}

module.exports = {
  isAuthorized,
  getAdminIds
};
